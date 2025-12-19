#!/usr/bin/env python3
"""
train_predict_hourly_fix.py
- preserves TVOC peaks by using hourly aggregation that keeps max/p90,
  avoids long linear interpolation that flattens spikes,
- trains a 1-step hourly RandomForest on those hourly aggregates,
- recursively forecasts 168 hours ahead and saves CSV (WIB) + PNG.
"""
import os
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

DATA_CSV = "data/sensor.csv"
OUT_DIR = "predictions"
MODEL_DIR = "models"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# CONFIG
LAG_HOURS = 24
FORECAST_HOURS = 168
USE_COLS = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]
TARGET_TEMP = "temp_c_hour_mean"
TARGET_TVOC = "tvoc_ppb_hour_max"

# ---------------- load + parse ts robust ----------------
if not os.path.exists(DATA_CSV):
    raise SystemExit("data/sensor.csv not found")

df_raw = pd.read_csv(DATA_CSV)
if "ts" not in df_raw.columns:
    raise SystemExit("CSV must contain 'ts' column")

# robust timestamp parsing
ts_raw = df_raw["ts"]
ts_num = pd.to_numeric(ts_raw, errors="coerce")
ts_from_num = pd.to_datetime(ts_num, unit="s", utc=True, errors="coerce")
ts_from_iso = pd.to_datetime(ts_raw, utc=True, errors="coerce")
ts = ts_from_iso.fillna(ts_from_num)
n_invalid = int(ts.isna().sum())
if n_invalid > 0:
    print(f"[WARN] {n_invalid} rows have invalid timestamps and will be dropped")
df = df_raw.loc[~ts.isna()].copy().reset_index(drop=True)
ts = ts.loc[~ts.isna()].reset_index(drop=True)

# make naive timestamps (we'll treat as UTC then convert to WIB on save)
try:
    ts = ts.dt.tz_convert(None)
except Exception:
    try:
        ts = ts.dt.tz_localize(None)
    except Exception:
        pass
df.index = ts
df = df.sort_index()

# ensure required columns exist (fill missing non-critical with forward fill)
for c in USE_COLS:
    if c not in df.columns:
        print(f"[INFO] {c} missing in CSV, filling with 0.0")
        df[c] = 0.0

# ---------------- handle gaps WITHOUT linear smoothing ----------------
# Approach: limit forward-fill/backfill to a reasonable window (e.g. 60 min).
# This avoids filling very long gaps with linear interpolation.
dfm = df[USE_COLS].asfreq("1min")

# forward/backfill but only for short gaps:
max_fill = 60  # minutes
# forward fill up to max_fill consecutive NaNs
dfm = dfm.copy()
mask = dfm.isna().any(axis=1)
if mask.any():
    # simple approach: ffill then bfill then revert long-gap fills
    ffilled = dfm.ffill(limit=max_fill)
    bfilled = ffilled.bfill(limit=max_fill)
    # keep bfilled where original gap length <= max_fill; otherwise keep NaN
    dfm = bfilled

# ---------------- hourly aggregation preserving peaks ----------------
# For each hour compute:
# - temp_mean: mean(temp_c)
# - rh_mean: mean(rh_pct)
# - tvoc_max: max(tvoc_ppb)  <-- preserves spikes
# - tvoc_p90: 90th percentile (robust peak measure)
# - eco2_mean, dust_mean
def agg_hourly(dfm):
    agg = pd.DataFrame()
    agg["temp_mean"] = dfm["temp_c"].resample("1H").mean()
    agg["rh_mean"] = dfm["rh_pct"].resample("1H").mean()
    agg["eco2_mean"] = dfm["eco2_ppm"].resample("1H").mean()
    agg["dust_mean"] = dfm["dust_ugm3"].resample("1H").mean()
    agg["tvoc_max"] = dfm["tvoc_ppb"].resample("1H").max()
    agg["tvoc_p90"] = dfm["tvoc_ppb"].resample("1H").quantile(0.90)
    return agg

dfh = agg_hourly(dfm)
available_hours = len(dfh)
print("Hourly rows:", available_hours)
if available_hours < LAG_HOURS + 1:
    raise SystemExit(f"Not enough hourly rows ({available_hours}) for LAG_HOURS={LAG_HOURS}")

# ---------------- build supervised data (one-step ahead) ----------------
# Targets are next-hour temp_mean and tvoc_max
def build_XY(dfh, lag_hours):
    Xs = []
    Ys = []
    idx = []
    cols_feats = ["temp_mean", "rh_mean", "eco2_mean", "dust_mean", "tvoc_max", "tvoc_p90"]
    for i in range(lag_hours, len(dfh)-1):
        window = dfh.iloc[i-lag_hours:i]
        feat = window[cols_feats].values.flatten().tolist()
        # cyclical hour-of-day for prediction time
        hour = dfh.index[i].hour
        feat.append(np.sin(2*np.pi*hour/24))
        feat.append(np.cos(2*np.pi*hour/24))
        target_temp = dfh.iloc[i+1]["temp_mean"]
        target_tvoc = dfh.iloc[i+1]["tvoc_max"]
        Xs.append(feat)
        Ys.append([target_temp, target_tvoc])
        idx.append(dfh.index[i])
    X = np.array(Xs, dtype=np.float32)
    Y = np.array(Ys, dtype=np.float32)
    return X, Y, idx

X, Y, idx_rows = build_XY(dfh, LAG_HOURS)
print("Built samples:", X.shape, Y.shape)
if X.shape[0] < 5:
    print("[WARN] very few training samples; consider collecting more data")

# ---------------- train model (multi-output RF) ----------------
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error

scaler = StandardScaler()
X_s = scaler.fit_transform(X)

Xtr, Xte, Ytr, Yte = train_test_split(X_s, Y, test_size=0.2, shuffle=False)
base = RandomForestRegressor(n_estimators=150, max_depth=12, n_jobs=-1, random_state=42)
from sklearn.multioutput import MultiOutputRegressor
model = MultiOutputRegressor(base)
print("Training multi-output RandomForest...")
model.fit(Xtr, Ytr)
pred_te = model.predict(Xte)
mae_temp = mean_absolute_error(Yte[:,0], pred_te[:,0])
mae_tvoc = mean_absolute_error(Yte[:,1], pred_te[:,1])
print(f"Validation MAE -> temp: {mae_temp:.3f}, tvoc(max): {mae_tvoc:.3f}")

# save model bundle
bundle = {"model": model, "scaler": scaler, "cols_feats": ["temp_mean","rh_mean","eco2_mean","dust_mean","tvoc_max","tvoc_p90"], "lag_hours": LAG_HOURS}
joblib.dump(bundle, os.path.join(MODEL_DIR, "rf_hourly_fixed.pkl"))
print("Saved model ->", os.path.join(MODEL_DIR, "rf_hourly_fixed.pkl"))

# ---------------- recursive forecast 168 hours ----------------
last_window = dfh.tail(LAG_HOURS).copy()
current = last_window.copy()
last_time = dfh.index.max()
preds = []
for h in range(FORECAST_HOURS):
    feats = current[["temp_mean","rh_mean","eco2_mean","dust_mean","tvoc_max","tvoc_p90"]].values.flatten().tolist()
    hour = (last_time + pd.Timedelta(hours=h)).hour
    feats.append(np.sin(2*np.pi*hour/24))
    feats.append(np.cos(2*np.pi*hour/24))
    Xv = np.array(feats, dtype=np.float32).reshape(1,-1)
    Xvs = scaler.transform(Xv)
    ypred = model.predict(Xvs)[0]   # [temp_mean_pred, tvoc_max_pred]
    ts_pred = last_time + pd.Timedelta(hours=h+1)
    preds.append({"timestamp": ts_pred, "temp_c_pred": float(ypred[0]), "tvoc_ppb_pred": float(ypred[1])})
    # append new row for autoregressive loop:
    new_row = pd.DataFrame({
        "temp_mean": ypred[0],
        "rh_mean": current["rh_mean"].iloc[-1],
        "eco2_mean": current["eco2_mean"].iloc[-1],
        "dust_mean": current["dust_mean"].iloc[-1],
        "tvoc_max": ypred[1],
        "tvoc_p90": ypred[1]   # approximate p90 as pred max for recursion
    }, index=[ts_pred])
    current = pd.concat([current, new_row]).iloc[-LAG_HOURS:]

df_pred = pd.DataFrame(preds).set_index("timestamp")

# ---------------- save original naive CSV ----------------
out_orig = os.path.join(OUT_DIR, "pred_7days_hourly_fixed.csv")
df_pred.to_csv(out_orig)
print("Saved:", out_orig)

# ---------------- convert to WIB and save (with tz and naive) ----------------
df_reset = df_pred.reset_index()
df_reset["timestamp"] = pd.to_datetime(df_reset["timestamp"])
df_reset["timestamp_aj"] = df_reset["timestamp"].dt.tz_localize("UTC").dt.tz_convert("Asia/Jakarta")
out_wib = os.path.join(OUT_DIR, "pred_7days_hourly_fixed_wib.csv")
df_wib = df_reset[["timestamp_aj","temp_c_pred","tvoc_ppb_pred"]].rename(columns={"timestamp_aj":"timestamp"})
df_wib.to_csv(out_wib, index=False)
print("Saved WIB:", out_wib)
# naive WIB (no tz info)
out_wib_naive = os.path.join(OUT_DIR, "pred_7days_hourly_fixed_wib_naive.csv")
df_wib_naive = df_wib.copy()
df_wib_naive["timestamp"] = pd.to_datetime(df_wib_naive["timestamp"]).dt.tz_convert("Asia/Jakarta").dt.tz_localize(None)
df_wib_naive.to_csv(out_wib_naive, index=False)
print("Saved WIB naive:", out_wib_naive)

# ---------------- quick plot ----------------
plt.figure(figsize=(12,5))
plt.plot(df_wib_naive["timestamp"], df_wib_naive["temp_c_pred"], label="temp_c_pred")
plt.plot(df_wib_naive["timestamp"], df_wib_naive["tvoc_ppb_pred"], label="tvoc_ppb_pred")
plt.legend()
plt.title("Forecast (7 days) — fixed hourly aggregation (WIB)")
plt.xticks(rotation=30)
plt.tight_layout()
out_png = os.path.join(OUT_DIR, "pred_7days_hourly_fixed_wib.png")
plt.savefig(out_png)
print("Saved plot:", out_png)

print("Done.")
