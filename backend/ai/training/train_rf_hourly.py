#!/usr/bin/env python3
"""
train_rf_hourly.py
==================
Hourly RandomForest training
- Uses build_features.py (SINGLE SOURCE OF TRUTH)
- Multi-output: temp_c, tvoc_ppb
- Safe for FastAPI inference
"""

import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

from features.build_features import (
    build_features,
    get_feature_names,
)

# ======================================================
# PATHS
# ======================================================

DATA_CSV = "data/sensor.csv"     # boleh nanti ganti dari DB
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_OUT = os.path.join(MODEL_DIR, "rf_hourly_fixed.pkl")

# ======================================================
# CONFIG
# ======================================================

BASE_COLS = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]

TARGET_COLS = {
    "temp_c": "temp_c",
    "tvoc_ppb": "tvoc_ppb",
}

MIN_ROWS = 72   # minimal 3 hari hourly

# ======================================================
# LOAD DATA
# ======================================================

if not os.path.exists(DATA_CSV):
    raise SystemExit("❌ data/sensor.csv not found")

df_raw = pd.read_csv(DATA_CSV)

if "ts" not in df_raw.columns:
    raise SystemExit("❌ CSV must contain 'ts' column")

# robust timestamp parsing
ts = pd.to_datetime(
    pd.to_numeric(df_raw["ts"], errors="coerce"),
    unit="s",
    utc=True,
    errors="coerce",
)

df = df_raw.loc[~ts.isna()].copy()
df.index = ts.loc[~ts.isna()].dt.tz_convert(None)
df = df.sort_index()

# ensure columns exist
for c in BASE_COLS:
    if c not in df.columns:
        print(f"[WARN] {c} missing → filled with 0")
        df[c] = 0.0

# ======================================================
# HOURLY AGGREGATION (PRESERVE SPIKES)
# ======================================================

dfm = df[BASE_COLS].asfreq("1min").ffill(limit=60)

dfh = pd.DataFrame({
    "temp_c": dfm["temp_c"].resample("1H").mean(),
    "rh_pct": dfm["rh_pct"].resample("1H").mean(),
    "eco2_ppm": dfm["eco2_ppm"].resample("1H").mean(),
    "dust_ugm3": dfm["dust_ugm3"].resample("1H").mean(),
    "tvoc_ppb": dfm["tvoc_ppb"].resample("1H").max(),  # 🔥 preserve spikes
}).dropna()

print("Hourly rows:", len(dfh))
if len(dfh) < MIN_ROWS:
    raise SystemExit("❌ Not enough hourly data for training")

# ======================================================
# BUILD FEATURES (🔥 THE KEY PART)
# ======================================================

X_all = build_features(dfh, freq="1H")
feature_names = get_feature_names()

# Align targets (1-step ahead)
Y_temp = dfh["temp_c"].shift(-1)
Y_tvoc = dfh["tvoc_ppb"].shift(-1)

valid = ~(Y_temp.isna() | Y_tvoc.isna())
X = X_all.loc[valid]
Y = np.vstack([Y_temp[valid], Y_tvoc[valid]]).T

print("Feature matrix:", X.shape)
print("Targets:", Y.shape)

# ======================================================
# TRAIN / VALIDATION SPLIT
# ======================================================

Xtr, Xte, Ytr, Yte = train_test_split(
    X.values, Y, test_size=0.2, shuffle=False
)

# ======================================================
# TRAIN MODEL
# ======================================================

base = RandomForestRegressor(
    n_estimators=200,
    max_depth=14,
    random_state=42,
    n_jobs=-1,
)

model = MultiOutputRegressor(base)

print("🚀 Training RandomForest...")
model.fit(Xtr, Ytr)

pred = model.predict(Xte)

mae_temp = mean_absolute_error(Yte[:, 0], pred[:, 0])
mae_tvoc = mean_absolute_error(Yte[:, 1], pred[:, 1])

print(f"✅ MAE temp_c  : {mae_temp:.3f}")
print(f"✅ MAE tvoc_ppb: {mae_tvoc:.3f}")

# ======================================================
# SAVE MODEL BUNDLE (🔥 IMPORTANT)
# ======================================================

bundle = {
    "model": model,
    "features": feature_names,
    "freq": "1H",
    "targets": ["temp_c", "tvoc_ppb"],
}

joblib.dump(bundle, MODEL_OUT)

print("💾 Model saved →", MODEL_OUT)
print("🎉 Training finished successfully")
