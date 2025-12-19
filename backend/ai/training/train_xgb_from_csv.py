#!/usr/bin/env python3
"""
train_xgb_from_csv.py (FIXED - Shape Alignment)
"""

from __future__ import annotations
import os
import joblib
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

from xgboost import XGBRegressor

# ======================================================
# PATHS
# ======================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(BASE_DIR, "..", "data", "sensor_clean.csv")
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "xgb_hourly_final.pkl")

# ======================================================
# CONFIG
# ======================================================

RESAMPLE_FREQ = "1h"
MIN_ROWS = 48
TEST_SIZE = 0.2
RANDOM_STATE = 42

TARGET_COLS = [
    "temp_c",
    "rh_pct",
    "tvoc_ppb",
    "eco2_ppm",
    "dust_ugm3",
]

# ======================================================
# FEATURE BUILDER
# ======================================================

from ai.features.build_features import build_features, get_feature_names

# ======================================================
# LOAD CSV
# ======================================================

def load_csv(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"CSV not found: {path}")

    print(f"📥 Loading CSV: {path}")
    df = pd.read_csv(path)
    print(f"✅ Rows loaded: {len(df)}")

    if "ts" not in df.columns:
        raise RuntimeError("CSV must contain 'ts' column")

    ts_raw = df["ts"].astype(str).str.strip()

    # Try numeric parsing first
    ts_num = pd.to_numeric(ts_raw, errors="coerce")

    if ts_num.notna().sum() > 0:
        sample = ts_num.dropna().iloc[0]

        # Detect unit by magnitude
        if sample > 1e18:
            unit = "ns"
        elif sample > 1e15:
            unit = "us"
        elif sample > 1e12:
            unit = "ms"
        else:
            unit = "s"

        print(f"🕒 Parsed ts as numeric ({unit})")
        df["timestamp"] = pd.to_datetime(ts_num, unit=unit, utc=True)

    else:
        # Fallback: ISO datetime string
        print("🕒 Parsed ts as datetime string")
        df["timestamp"] = pd.to_datetime(ts_raw, errors="coerce", utc=True)

    # Drop invalid timestamps
    df = df.dropna(subset=["timestamp"])
    df = df.set_index("timestamp").sort_index()

    print(f"⏱️  Time range: {df.index.min()} → {df.index.max()}")

    return df

# ======================================================
# MAIN TRAINING
# ======================================================

def main():
    df = load_csv(DATA_CSV)

    for c in TARGET_COLS:
        if c not in df.columns:
            raise RuntimeError(f"Missing column: {c}")

    # ---------- Hourly aggregation ----------
    df_hourly = df[TARGET_COLS].resample(RESAMPLE_FREQ).mean().dropna()

    print(f"⏱️  Hourly rows: {len(df_hourly)}")
    print(f"📅 Range: {df_hourly.index.min()} → {df_hourly.index.max()}")

    if len(df_hourly) < MIN_ROWS:
        raise RuntimeError(
            f"Not enough hourly rows ({len(df_hourly)}), need ≥ {MIN_ROWS}"
        )

    # ---------- Feature engineering ----------
    print("\n🔧 Building features...")
    X_all = build_features(df_hourly)
    feature_names = get_feature_names()

    # Align X and Y properly
    # build_features creates lag features, causing dimension mismatch
    # We predict Y[t] from X[t-1], so:
    # - Y: drop first row (no lag data available)
    # - X: drop last row (no future target available)
    
    Y_all = df_hourly[TARGET_COLS].iloc[1:].reset_index(drop=True)
    X_all = X_all.iloc[:-1].reset_index(drop=True)
    
    # Safety check: ensure equal length
    min_len = min(len(X_all), len(Y_all))
    X_all = X_all.iloc[:min_len]
    Y_all = Y_all.iloc[:min_len]

    print(f"\n🧠 Feature matrix: {X_all.shape}")
    print(f"🎯 Target matrix: {Y_all.shape}")
    
    if len(X_all) != len(Y_all):
        raise RuntimeError(
            f"❌ Shape mismatch after alignment: X={len(X_all)}, Y={len(Y_all)}"
        )

    # ---------- Train/test split ----------
    X_train, X_test, y_train, y_test = train_test_split(
        X_all.values,
        Y_all.values,
        test_size=TEST_SIZE,
        shuffle=False,
    )

    print(f"\n📊 Split sizes:")
    print(f"   Train: {len(X_train)} samples")
    print(f"   Test:  {len(X_test)} samples")

    # ---------- Scaling ----------
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # ---------- Model ----------
    base_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    model = MultiOutputRegressor(base_model)

    print("\n🚀 Training XGBoost...")
    model.fit(X_train_s, y_train)
    print("✅ Training complete!")

    # ---------- Evaluation ----------
    preds = model.predict(X_test_s)
    maes = mean_absolute_error(y_test, preds, multioutput="raw_values")

    print("\n📊 Validation MAE:")
    for col, mae in zip(TARGET_COLS, maes):
        print(f"   {col:12s}: {mae:.3f}")

    # ---------- Save ----------
    bundle = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names,
        "target_cols": TARGET_COLS,
        "freq": RESAMPLE_FREQ,
        "version": "xgb_hourly_fixed_v1",
    }

    joblib.dump(bundle, MODEL_PATH)
    print(f"\n💾 Model saved → {MODEL_PATH}")
    print("\n" + "=" * 70)
    print("✨ Training completed successfully!")
    print("=" * 70)

# ======================================================
# ENTRY
# ======================================================

if __name__ == "__main__":
    main()