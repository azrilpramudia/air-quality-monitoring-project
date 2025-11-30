#!/usr/bin/env python3
# predict_hourly_recursive.py
"""
Train a 1-step hourly model (RandomForest) on available hourly data,
then recursively predict 168 hours ahead (7 days) and save CSV + PNG.

This variant additionally converts prediction timestamps to WIB (Asia/Jakarta).
Assumption: timestamps produced earlier are naive representing UTC. We first
localize them as UTC and then convert to Asia/Jakarta (+07:00).
"""

import os
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

DATA_CSV = "data/sensor.csv"
OUT_DIR = "predictions"
MODEL_DIR = "models"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# ---------- CONFIG ----------
LAG_HOURS = 24            # use last 24 hours as features
FORECAST_HOURS = 168      # 7 days * 24
USE_COLS = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]
TARGET_COLS = ["temp_c", "tvoc_ppb"]

# ---------- LOAD & PARSE ----------
if not os.path.exists(DATA_CSV):
    raise SystemExit("data/sensor.csv not found")

df_raw = pd.read_csv(DATA_CSV)
if "ts" not in df_raw.columns:
    raise SystemExit("CSV must contain 'ts' column")

# robust timestamp parsing (try epoch seconds first, then ISO)
ts_raw = df_raw["ts"]
ts_num = pd.to_numeric(ts_raw, errors="coerce")
ts_from_num = pd.to_datetime(ts_num, unit="s", utc=True, errors="coerce")
ts_from_iso = pd.to_datetime(ts_raw, utc=True, errors="coerce")
ts = ts_from_iso.fillna(ts_from_num)

n_invalid = int(ts.isna().sum())
if n_invalid > 0:
    print(f"[WARN] {n_invalid} invalid timestamps will be dropped for training/prediction")

df = df_raw.loc[~ts.isna()].copy().reset_index(drop=True)
ts = ts.loc[~ts.isna()].reset_index(drop=True)

# remove tz info (make naive) — we'll treat these as UTC later when saving WIB
try:
    ts = ts.dt.tz_convert(None)
except Exception:
    try:
        ts = ts.dt.tz_localize(None)
    except Exception:
        pass

df.index = ts
df = df.sort_index()

# ---------- validate required columns ----------
for c in TARGET_COLS:
    if c not in df.columns:
        raise SystemExit(f"Missing required column: {c}")

for c in USE_COLS:
    if c not in df.columns:
        # for non-critical cols, we can create filler if missing
        print(f"[INFO] Column {c} not found in CSV — it will be filled with zeros.")
        df[c] = 0.0

# ---------- build hourly series ----------
df_min = df[USE_COLS].asfreq("1min").interpolate(limit_direction="both")
# resample to hourly mean
dfh = df_min.resample("1H").mean()

available_hours = len(dfh)
print(f"Available hourly rows: {available_hours}")

if available_hours < LAG_HOURS + 1:
    raise SystemExit(f"Not enough hourly data to build LAG_HOURS={LAG_HOURS} (need at least {LAG_HOURS+1} hours).")

# ---------- prepare training data (1-step hourly) ----------
def build_hourly_one_step_xy(dfh, lag_hours):
    X_list = []
    y_list = []
    for i in range(lag_hours, len(dfh) - 1):
        window = dfh.iloc[i - lag_hours:i]
        feats = []
        # flatten per-column lags in consistent order
        for c in USE_COLS:
            feats.extend(window[c].values.tolist())
        # cyclical hour-of-day of the prediction time
        hour = dfh.index[i].hour
        feats.append(np.sin(2 * np.pi * hour / 24))
        feats.append(np.cos(2 * np.pi * hour / 24))
        target = dfh.iloc[i + 1][TARGET_COLS].values  # next hour targets
        X_list.append(feats)
        y_list.append(target)
    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.float32)
    return X, y

X, y = build_hourly_one_step_xy(dfh, LAG_HOURS)
print("Built one-step hourly samples:", X.shape, y.shape)
if X.shape[0] < 10:
    print("[WARN] Few training samples; model may be unstable but will still run.")

# ---------- train ----------
scaler = StandardScaler()
X_s = scaler.fit_transform(X) if len(X) > 0 else np.zeros_like(X)

split_idx = max(1, int(0.8 * len(X_s)))
Xtr, Xte = X_s[:split_idx], X_s[split_idx:]
ytr, yte = y[:split_idx], y[split_idx:]

model = RandomForestRegressor(n_estimators=100, max_depth=10, n_jobs=-1, random_state=42)
print("Training 1-step hourly RandomForest...")
model.fit(Xtr, ytr)
score = model.score(Xte, yte) if len(Xte) > 0 else None
print("Validation R2 (approx):", score)

# save the one-step model
joblib.dump({"model": model, "scaler": scaler, "lag_hours": LAG_HOURS, "use_cols": USE_COLS}, os.path.join(MODEL_DIR, "rf_hourly_1step.pkl"))

# ---------- recursive forecasting ----------
last_window = dfh.tail(LAG_HOURS).copy()
pred_rows = []
current_window = last_window.copy()
last_time = dfh.index.max()

print("Starting recursive hourly forecasting for", FORECAST_HOURS, "hours...")
for h in range(FORECAST_HOURS):
    feats = []
    for c in USE_COLS:
        feats.extend(current_window[c].values.tolist())
    hour = (last_time + pd.Timedelta(hours=h)).hour
    feats.append(np.sin(2 * np.pi * hour / 24))
    feats.append(np.cos(2 * np.pi * hour / 24))
    Xv = np.array(feats, dtype=np.float32).reshape(1, -1)
    Xvs = scaler.transform(Xv)
    pred = model.predict(Xvs)[0]  # [temp_pred, tvoc_pred]
    ts_pred = last_time + pd.Timedelta(hours=h + 1)
    pred_rows.append({"timestamp": ts_pred, "temp_c_pred": float(pred[0]), "tvoc_ppb_pred": float(pred[1])})
    # append predicted row into current_window
    new_row = pd.DataFrame({c: np.nan for c in USE_COLS}, index=[ts_pred])
    new_row["temp_c"] = pred[0]
    new_row["tvoc_ppb"] = pred[1]
    # persistence for other cols
    for c in ["rh_pct", "eco2_ppm", "dust_ugm3"]:
        if c in current_window.columns:
            new_row[c] = current_window[c].iloc[-1]
        else:
            new_row[c] = 0.0
    current_window = pd.concat([current_window, new_row]).iloc[-LAG_HOURS:]

# ---------- save original CSV (naive timestamps) ----------
df_pred = pd.DataFrame(pred_rows).set_index("timestamp")
out_csv_orig = os.path.join(OUT_DIR, "pred_7days_hourly_recursive.csv")
df_pred.to_csv(out_csv_orig)
print("Saved hourly predictions (original, naive timestamps) ->", out_csv_orig)

# ---------- convert timestamps to WIB and save two variants ----------
# Reset index to column so we can localize/convert
df_pred_reset = df_pred.reset_index()
# treat naive timestamps as UTC (assumption) then convert to Asia/Jakarta
df_pred_reset["timestamp"] = pd.to_datetime(df_pred_reset["timestamp"])
df_pred_reset["timestamp_aj"] = df_pred_reset["timestamp"].dt.tz_localize("UTC").dt.tz_convert("Asia/Jakarta")

# 1) Save with timezone info (+07:00)
out_csv_wib = os.path.join(OUT_DIR, "pred_7days_hourly_recursive_wib.csv")
df_wib = df_pred_reset[["timestamp_aj", "temp_c_pred", "tvoc_ppb_pred"]].rename(columns={"timestamp_aj": "timestamp"})
df_wib.to_csv(out_csv_wib, index=False)
print("Saved hourly predictions (WIB with tz) ->", out_csv_wib)

# 2) Save naive-local (timestamp shifted to WIB but without tz info)
out_csv_wib_naive = os.path.join(OUT_DIR, "pred_7days_hourly_recursive_wib_naive.csv")
df_wib_naive = df_wib.copy()
df_wib_naive["timestamp"] = pd.to_datetime(df_wib_naive["timestamp"]).dt.tz_convert("Asia/Jakarta").dt.tz_localize(None)
df_wib_naive.to_csv(out_csv_wib_naive, index=False)
print("Saved hourly predictions (WIB naive, no tz) ->", out_csv_wib_naive)

# ---------- quick plot using WIB-naive timestamps ----------
plt.figure(figsize=(12, 5))
plt.plot(df_wib_naive["timestamp"], df_wib_naive["temp_c_pred"], label="temp_c_pred")
plt.plot(df_wib_naive["timestamp"], df_wib_naive["tvoc_ppb_pred"], label="tvoc_ppb_pred")
plt.legend()
plt.title("Recursive hourly forecast (7 days) — WIB")
plt.xlabel("timestamp (WIB)")
plt.xticks(rotation=30)
plt.tight_layout()
out_png = os.path.join(OUT_DIR, "pred_7days_hourly_recursive_wib.png")
plt.savefig(out_png)
print("Saved plot ->", out_png)
print("Done.")
