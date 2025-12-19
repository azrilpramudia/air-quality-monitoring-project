#!/usr/bin/env python3
"""
train_xgb_from_db.py
====================
FINAL XGBoost training script
- Load actual sensor data from MySQL
- Build features using build_features.py
- Train multi-target XGBoost
- Save model bundle for inference
"""

from __future__ import annotations

import os
import sys
import joblib
import numpy as np
import pandas as pd
import mysql.connector
from datetime import timezone

from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error

from xgboost import XGBRegressor

# -----------------------------------------
# PATH FIX (allow: python -m ai.training...)
# -----------------------------------------
BASE_DIR = os.path.abspath(os.path.join(__file__, "../../.."))
sys.path.append(BASE_DIR)

from ai.features.build_features import (
    build_features,
    get_feature_names,
)

# =========================================
# CONFIG
# =========================================

MODEL_PATH = "backend/ai/models/xgb_hourly_v1.pkl"
MIN_ROWS = 48              # minimum hours
RESAMPLE_FREQ = "1H"       # MUST match inference
DEVICE_ID = "esp32-01-client-io"  # or None for all

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root123",
    "database": "db_monitor",
}

TARGET_COLS = [
    "temp_c",
    "rh_pct",
    "tvoc_ppb",
    "eco2_ppm",
    "dust_ugm3",
]

# =========================================
# LOAD DATA FROM DB
# =========================================

def load_actual_from_db(device_id: str | None) -> pd.DataFrame:
    print("📥 Loading data from MySQL...")

    conn = mysql.connector.connect(**DB_CONFIG)
    query = """
        SELECT
            ts,
            temperature AS temp_c,
            humidity AS rh_pct,
            tvoc,
            eco2,
            dust
        FROM actual
    """

    if device_id:
        query += " WHERE deviceId = %s ORDER BY ts ASC"
        df = pd.read_sql(query, conn, params=(device_id,))
    else:
        query += " ORDER BY ts ASC"
        df = pd.read_sql(query, conn)

    conn.close()

    if df.empty:
        raise RuntimeError("No data found in actual table")

    # Timestamp → DatetimeIndex
    df["ts"] = pd.to_datetime(df["ts"], utc=True)
    df = df.set_index("ts").sort_index()

    print(f"✅ Rows loaded: {len(df)}")
    print(f"⏱️  Range: {df.index.min()} → {df.index.max()}")

    return df


# =========================================
# TRAINING
# =========================================

def main():
    # -----------------------------
    # 1) Load data
    # -----------------------------
    df = load_actual_from_db(DEVICE_ID)

    # Hourly resample (mean)
    df = df.resample(RESAMPLE_FREQ).mean().dropna()

    if len(df) < MIN_ROWS:
        raise RuntimeError(
            f"Not enough data ({len(df)} rows), need at least {MIN_ROWS}"
        )

    # -----------------------------
    # 2) Build features
    # -----------------------------
    X = build_features(df)
    y = df[TARGET_COLS]

    print("🧠 Feature matrix:", X.shape)
    print("🎯 Target matrix:", y.shape)

    # -----------------------------
    # 3) Scale features
    # -----------------------------
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # -----------------------------
    # 4) Train XGBoost
    # -----------------------------
    print("🚀 Training XGBoost model...")

    base_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        tree_method="hist",   # ⚡ FAST
        n_jobs=-1,
        random_state=42,
    )

    model = MultiOutputRegressor(base_model)
    model.fit(X_scaled, y)

    # -----------------------------
    # 5) Quick validation (train MAE)
    # -----------------------------
    preds = model.predict(X_scaled)
    maes = {
        col: mean_absolute_error(y[col], preds[:, i])
        for i, col in enumerate(TARGET_COLS)
    }

    print("📊 Training MAE:")
    for k, v in maes.items():
        print(f"  {k:10s}: {v:.3f}")

    # -----------------------------
    # 6) Save model bundle
    # -----------------------------
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    bundle = {
        "model": model,
        "scaler": scaler,
        "feature_names": get_feature_names(),
        "target_cols": TARGET_COLS,
        "freq": RESAMPLE_FREQ,
        "model_type": "xgboost",
        "trained_at": pd.Timestamp.utcnow(),
        "device_id": DEVICE_ID,
    }

    joblib.dump(bundle, MODEL_PATH)

    print("✅ Model saved to:", MODEL_PATH)
    print("🎉 TRAINING COMPLETE")


# =========================================
# ENTRYPOINT
# =========================================

if __name__ == "__main__":
    main()
