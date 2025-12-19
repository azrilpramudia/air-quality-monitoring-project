# forecast_mqtt_xgb_multi.py — multi-horizon 168 jam, simpan CSV (WIB) & (opsional) publish MQTT
import json, os, time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo  # <- TAMBAHAN: untuk konversi WIB

import joblib
import numpy as np
import pandas as pd
import paho.mqtt.client as mqtt

# ===== MQTT (opsional) =====
BROKER      = "broker.emqx.io"
PORT        = 1883
TOPIC_OUT   = "uninus/iot/air_quality/esp32-01"
CLIENT_ID   = "pc-forecast-xgb-168h"

# ===== LOAD MODEL =====
BUNDLE = joblib.load(os.path.join("models", "xgb_multi.pkl"))
MODEL       = BUNDLE["model"]
FEATS       = BUNDLE["features"]
TARGET_COLS = BUNDLE["target_cols"]  # y_temp+1..+168, y_tvoc+1..+168
H           = BUNDLE["H"]
LAGS        = BUNDLE.get("lag_minutes", [])
FREQ        = BUNDLE.get("freq", "1H")
BASE_COLS   = BUNDLE.get("base_cols", ["temp_c","rh_pct","tvoc_ppb","eco2_ppm","dust_ugm3"])

CSV_OUT = "data/forecast_10080m.csv"  # akan disimpan dengan index WIB

def build_latest_features_from_csv(csv_path="data/sensor.csv"):
    import numpy as np
    import pandas as pd

    df0 = pd.read_csv(csv_path)

    # ---- Robust timestamp handling ----
    idx = None
    if "ts" in df0.columns:
        ts = pd.to_datetime(df0["ts"], utc=True, errors="coerce")
        if ts.isna().all():
            ts = pd.to_datetime(pd.to_numeric(df0["ts"], errors="coerce"), unit="s", utc=True)
        ts = ts.dt.tz_convert(None)  # jadikan tz-naive (diasumsikan UTC)
        idx = pd.DatetimeIndex(ts)
        df0 = df0.drop(columns=["ts"])
    else:
        first_col = df0.columns[0]
        ts_try = pd.to_datetime(df0[first_col], utc=True, errors="coerce")
        if ts_try.notna().sum() >= max(2, int(0.5 * len(df0))):
            ts = ts_try.dt.tz_convert(None)
            idx = pd.DatetimeIndex(ts)
            df0 = df0.drop(columns=[first_col])
        else:
            ts_num = pd.to_numeric(df0[first_col], errors="coerce")
            ts = pd.to_datetime(ts_num, unit="s", utc=True, errors="coerce").tz_convert(None)
            idx = pd.DatetimeIndex(ts)
            df0 = df0.drop(columns=[first_col])

    if idx is None or idx.isna().all():
        raise SystemExit("Gagal membaca timestamp dari sensor.csv. Pastikan ada kolom 'ts' atau kolom pertama adalah timestamp.")

    df0 = df0.set_index(idx).sort_index()

    # Hanya pakai base cols yang diketahui saat training
    use_cols = [c for c in BASE_COLS if c in df0.columns]
    if not use_cols:
        raise SystemExit(f"Tidak ada kolom fitur dasar yang ditemukan di CSV. Ditemukan: {list(df0.columns)}")

    df = df0[use_cols].asfreq("1min").interpolate(limit_direction="both")


    # Ambil 1 tahun terakhir (konsisten dengan training)
    end_ts = df.index.max()
    start_ts = end_ts - pd.Timedelta(days=365)
    df = df.loc[start_ts:end_ts]

    # --- cyc features ---
    hours = df.index.hour.astype(np.float32)
    cyc = pd.DataFrame(
        {"sin_day": np.sin(2*np.pi*hours/24.0), "cos_day": np.cos(2*np.pi*hours/24.0)},
        index=df.index
    )

    # --- lags (kalau ada) ---
    lag_frames = []
    if LAGS:
        for col in BASE_COLS:
            if col in df.columns:
                lag_frames.append(pd.concat({f"{col}_lag{lag}": df[col].shift(lag) for lag in LAGS}, axis=1))

    parts = [df.reindex(columns=BASE_COLS).astype("float32")] + (lag_frames if lag_frames else []) + [cyc]
    X = pd.concat(parts, axis=1)
    X = X.reindex(columns=FEATS)  # urutkan sesuai fitur saat training
    X = X.ffill().bfill()         # isi kekosongan jika history terlalu pendek

    last_row = X.iloc[[-1]]
    last_hour = X.index[-1]  # ini NAIVE dan diinterpretasi UTC
    return last_row, last_hour

def make_forecast_df(row_last: pd.DataFrame, last_hour: pd.Timestamp) -> pd.DataFrame:
    yhat = MODEL.predict(row_last).reshape(-1)

    # pisahkan index kolom temp & tvoc dan urutkan berdasarkan horizon
    def parse_targets(prefix):
        pairs = [(i, c) for i, c in enumerate(TARGET_COLS) if c.startswith(prefix)]
        pairs.sort(key=lambda x: int(x[1].split("+")[1]))  # urut +1..+H
        return [i for i, _ in pairs]

    idx_temp = parse_targets("y_temp+")
    idx_tvoc = parse_targets("y_tvoc+")

    temp_preds = yhat[idx_temp]
    tvoc_preds = yhat[idx_tvoc]

    # daftar waktu prediksi (NAIVE → dianggap UTC)
    ts_list = [last_hour + pd.Timedelta(minutes=m) for m in range(1, H+1)]


    df_out = pd.DataFrame({
        "timestamp_utc": ts_list,                          # kolom waktu UTC (naive)
        "ts_epoch_utc": [int(t.timestamp()) for t in ts_list],
        "temp_c_pred": temp_preds,
        "tvoc_ppb_pred": tvoc_preds,
    }).set_index("timestamp_utc")  # index masih UTC-naive (anggap UTC)
    return df_out

from zoneinfo import ZoneInfo
WIB = ZoneInfo("Asia/Jakarta")

# pastikan di atas file sudah ada:
# from zoneinfo import ZoneInfo
WIB = ZoneInfo("Asia/Jakarta")

def save_csv_and_print_daily(df_out: pd.DataFrame):
    os.makedirs("data", exist_ok=True)

    # pastikan unik & terurut (berdasarkan index UTC-naive "timestamp_utc")
    df_out = df_out[~df_out.index.duplicated(keep="first")].sort_index()

    # === simpan versi UTC (standar) ===
    latest_path = "data/forecast_latest.csv"
    df_out.to_csv(latest_path)  # index bernama "timestamp_utc"
    print(f"✅ saved: {latest_path} (UTC, rows={len(df_out)})")

    # === konversi ke WIB dan simpan ===
    df_wib = df_out.copy()
    df_wib.index = df_wib.index.tz_localize("UTC").tz_convert(WIB)
    df_wib.index.name = "timestamp_wib"

    # buat CSV yang memuat WIB + UTC + epoch untuk kemudahan downstream
    df_wib_csv = df_wib.reset_index()
    df_wib_csv["timestamp_utc"] = df_wib_csv["timestamp_wib"].dt.tz_convert("UTC").dt.tz_localize(None)

    cols = ["timestamp_wib", "timestamp_utc", "ts_epoch_utc", "temp_c_pred", "tvoc_ppb_pred"]
    wib_path = "data/forecast_168h_wib.csv"
    df_wib_csv[cols].to_csv(wib_path, index=False)
    print(f"✅ saved: {wib_path} (WIB, rows={len(df_wib_csv)})")

    # === preview ringkas per-hari (WIB) ===
    for day, g in df_wib.groupby(df_wib.index.date):
        print(f"\n=== {day} (WIB) ===")
        print(g[["temp_c_pred", "tvoc_ppb_pred"]].head(24))


# ===== MQTT batch publish (opsional) =====
def publish_batch(df_out: pd.DataFrame):
    cli = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=CLIENT_ID)
    cli.connect(BROKER, PORT, keepalive=60)

    payload = {
        "generated_at": int(time.time()),
        "freq": "1min",
        "horizon_hours": H,
        # kirim epoch UTC (tetap standar)
        "forecast": [
            {"ts": int(ts), "temp_c_pred": float(r.temp_c_pred), "tvoc_ppb_pred": float(r.tvoc_ppb_pred)}
            for ts, r in zip(df_out["ts_epoch_utc"].values, df_out.reset_index()[["temp_c_pred","tvoc_ppb_pred"]].itertuples(index=False))
        ],
    }
    cli.publish(TOPIC_OUT, json.dumps(payload))
    print(f"MQTT published batch → {TOPIC_OUT} | items={len(payload['forecast'])}")
    cli.disconnect()

def main(publish_mqtt=False):
    row_last, last_hour = build_latest_features_from_csv()
    df_out = make_forecast_df(row_last, last_hour)
    save_csv_and_print_daily(df_out)
    if publish_mqtt:
        publish_batch(df_out)

if __name__ == "__main__":
    # set True kalau mau kirim lewat MQTT juga
    main(publish_mqtt=False)
