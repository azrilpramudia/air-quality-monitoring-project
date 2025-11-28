# train_xgb_multi.py — multi-horizon, tiny-mode friendly (per-minute)
import os, joblib, argparse
import numpy as np
import pandas as pd
from sklearn.multioutput import MultiOutputRegressor
from xgboost import XGBRegressor

# ===================== CLI & CONFIG =====================
ap = argparse.ArgumentParser()
ap.add_argument("--H", type=int, default=10080, help="horizon menit (default 10080 = 1 minggu).")
ap.add_argument("--tiny-ok", action="store_true",
                help="izinkan training walau data super pendek (untuk uji pipeline). "
                     "Model akan tetap disimpan walau akurasi tidak optimal.")
ap.add_argument("--data", default=os.path.join("data", "sensor.csv"),
                help="path CSV input (default: data/sensor.csv)")
ap.add_argument("--lookback-days", type=int, default=365,
                help="batas maksimal histori yang dipakai (default 365 hari)")
ap.add_argument("--use-gpu", action="store_true", help="pakai GPU (tree_method=gpu_hist) jika tersedia")
args = ap.parse_args()

DATA_CSV = args.data
H = int(args.H)
LOOKBACK_DAYS = int(args.lookback_days)
TINY_OK = bool(args.tiny_ok)
USE_GPU = bool(args.use_gpu)

BASE_COLS = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]
TARGETS   = ["temp_c", "tvoc_ppb"]  # target yang akan diprediksi

print(">>> DEBUG train_xgb_multi.py path:", __file__)
print(">>> DEBUG args:", {"H": H, "tiny_ok": TINY_OK, "data": DATA_CSV, "lookback_days": LOOKBACK_DAYS, "use_gpu": USE_GPU})

# ===================== LOAD =====================
if not os.path.exists(DATA_CSV):
    raise SystemExit(f"data file not found: {DATA_CSV}")

df0 = pd.read_csv(DATA_CSV)
assert "ts" in df0.columns or df0.index.name == "ts", "sensor.csv harus punya kolom 'ts'"

# parse timestamp: dukung epoch detik atau ISO
if "ts" in df0.columns:
    ts_raw = df0["ts"]
    ts_num = pd.to_numeric(ts_raw, errors="coerce")
    idx_num = pd.to_datetime(ts_num, unit="s", utc=True)
    idx_iso = pd.to_datetime(ts_raw, utc=True, errors="coerce")
    idx = idx_iso.fillna(idx_num)
else:
    idx = pd.to_datetime(df0.index, unit="s", utc=True)

idx = pd.DatetimeIndex(idx)
if idx.tz is not None:
    idx = idx.tz_convert("UTC")
idx = idx.tz_localize(None)

df0 = df0.set_index(idx).drop(columns=[c for c in df0.columns if c == "ts"]).sort_index()

# ===================== RESAMPLE 1min & LIMIT LOOKBACK =====================
df = (
    df0[BASE_COLS]
    .asfreq("1min")                           # per-minute frequency
    .interpolate(limit_direction="both")
)

if df.empty:
    raise SystemExit("Data kosong setelah resample. Pastikan sensor.csv berisi kolom ts & base cols.")

end_ts = df.index.max()
start_ts = end_ts - pd.Timedelta(days=LOOKBACK_DAYS)
df = df.loc[start_ts:end_ts]

available_minutes = len(df)
print("Minute range used:", df.index.min(), "→", df.index.max(), "| rows (minutes):", available_minutes)

# ===================== AUTO-CLAMP H & KEBIJAKAN DATA PENDEK =====================
min_hist_for_features = 2               # super minimal supaya bisa jalan untuk uji
max_h_by_data = max(1, available_minutes - min_hist_for_features - 1)

if H > max_h_by_data:
    print(f"[INFO] Data minutes={available_minutes}: turunkan H {H} -> {max_h_by_data}")
    H = max_h_by_data

if available_minutes < 3 and not TINY_OK:
    raise SystemExit(
        f"Data sangat pendek (minutes={available_minutes}). "
        f"Jalankan kolektor lebih lama atau jalankan ulang dengan opsi --tiny-ok untuk uji pipeline."
    )

if available_minutes < 3 and TINY_OK:
    print("[TINY] Data < 3 minutes. Lanjut training tiny-mode (sekadar membentuk model untuk uji alur).")

# ===================== ADAPTIVE PYRAMIDAL LAGS (per-minute) =====================
max_viable_lag = max(0, available_minutes - H - 1)
upper = min(30, max_viable_lag)
lag_minutes = list(range(1, upper+1)) if upper >= 1 else []

anchor_candidates = [60, 180, 360, 720, 1440, 10080]  # 1h,3h,6h,12h,1d,1w (menit)
for a in anchor_candidates:
    if a <= max_viable_lag and a not in lag_minutes:
        lag_minutes.append(a)
lag_minutes = sorted(set(lag_minutes))
print("Lag count (minutes):", len(lag_minutes), "| first:", lag_minutes[:20] if lag_minutes else "[]")

# ===================== FEATURES =====================
hours = df.index.hour.astype(np.float32)   # dipertahankan untuk siklus harian
cyc = pd.DataFrame({
    "sin_day": np.sin(2*np.pi*hours/24.0),
    "cos_day": np.cos(2*np.pi*hours/24.0),
}, index=df.index)

lag_blocks = []
if lag_minutes:
    for col in BASE_COLS:
        lag_blocks.append(pd.concat(
            {f"{col}_lag{lag}": df[col].shift(lag) for lag in lag_minutes},
            axis=1
        ))

parts = [df[BASE_COLS]] + (lag_blocks if lag_blocks else []) + [cyc]
X = pd.concat(parts, axis=1).astype("float32")

# ===================== MULTI-HORIZON TARGETS (1..H) =====================
target_cols = []
tcols = {}
for h in range(1, H+1):
    c1 = f"y_temp+{h}"
    c2 = f"y_tvoc+{h}"
    tcols[c1] = df["temp_c"].shift(-h)
    tcols[c2] = df["tvoc_ppb"].shift(-h)
    target_cols.extend([c1, c2])

Y = pd.DataFrame(tcols, index=df.index).astype("float32")

XY = pd.concat([X, Y], axis=1).dropna()
usable = len(XY)
if usable == 0:
    if TINY_OK and available_minutes >= 2:
        print("[TINY] Tidak ada baris usable setelah shift/lag. "
              "Memaksa tanpa lag & horizon=1 untuk membentuk model dummy.")
        H = 1
        target_cols = ["y_temp+1", "y_tvoc+1"]
        Y = pd.DataFrame({
            "y_temp+1": df["temp_c"].shift(-1),
            "y_tvoc+1": df["tvoc_ppb"].shift(-1),
        }, index=df.index)
        X = pd.concat([df[BASE_COLS], cyc], axis=1).astype("float32")
        XY = pd.concat([X, Y], axis=1).dropna()
        usable = len(XY)
    else:
        raise SystemExit("Tidak ada baris usable setelah lag/shift. Tambah data historis terlebih dulu.")

X = XY[X.columns]
Y = XY[target_cols]
print("Usable rows:", usable, "| Features:", X.shape[1], "| Targets:", Y.shape[1], "| Final H:", H)

# ===================== TRAIN (XGBoost optimized params) =====================
# adaptive choices based on dataset size
if usable < 1000:
    n_estimators = 40         
    max_depth = 3             
    learning_rate = 0.10      

else:
    n_estimators = 80         
    max_depth = 4             
    learning_rate = 0.08 

# build param dict (usable also for xgb API if later needed)
tree_method = "gpu_hist" if (USE_GPU) else "hist"
print(f"[INFO] xgboost: tree_method={tree_method}, n_estimators={n_estimators}, max_depth={max_depth}, lr={learning_rate}")

base = XGBRegressor(
    n_estimators=n_estimators,
    max_depth=max_depth,
    learning_rate=learning_rate,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_lambda=1.0,
    tree_method=tree_method,
    n_jobs=-1,
    verbosity=1,
    random_state=42,
    # enable_predictor may help memory on some setups
)

model = MultiOutputRegressor(base)

# train / test split & fit
if usable >= 20 and not TINY_OK:
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error
    Xtr, Xte, Ytr, Yte = train_test_split(X, Y, test_size=0.2, shuffle=False)
    print("Train rows:", len(Xtr), " Test rows:", len(Xte), " Features:", X.shape[1])

    # Note: MultiOutputRegressor doesn't forward early_stopping kwargs easily,
    # but XGBRegressor will still use n_estimators; we keep n_estimators moderate.
    model.fit(Xtr, Ytr)   # if this still slow, consider per-target training (parallel)
    pred = model.predict(Xte)

    # cek beberapa horizon yang valid saja (short, daily, akhir)
    ycols = list(Y.columns)
    def maybe_mae(col_name):
        if col_name in ycols:
            i = ycols.index(col_name)
            mae = mean_absolute_error(Yte.iloc[:, i], pred[:, i])
            return f"{col_name}: {mae:.3f}"
        return None

    checks = [1, 60, 1440, H]
    to_check = sorted(set([f"y_temp+{min(c,H)}" for c in checks] + [f"y_tvoc+{min(c,H)}" for c in checks]))
    report = [m for m in (maybe_mae(c) for c in to_check) if m]
    print("MAE:", " | ".join(report) if report else "(skip)")
else:
    print("[TINY] Fit full dataset tanpa test split (hanya untuk uji alur)")
    model.fit(X, Y)

# ===================== SAVE BUNDLE =====================
os.makedirs("models", exist_ok=True)
bundle = {
    "model": model,
    "features": X.columns.tolist(),
    "target_cols": list(Y.columns),  # urutan output (y_temp+1.., y_tvoc+1..)
    "H": H,
    "lag_minutes": lag_minutes,
    "freq": "1min",
    "base_cols": BASE_COLS,
}
joblib.dump(bundle, os.path.join("models", "xgb_multi.pkl"))
print("✅ saved: models/xgb_multi.pkl")
