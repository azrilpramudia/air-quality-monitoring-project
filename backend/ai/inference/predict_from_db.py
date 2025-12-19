#!/usr/bin/env python3
"""
predict_from_db.py
==================
Load model -> fetch data from DB -> build features -> predict

Run:
    python -m ai.inference.predict_from_db
"""

from pathlib import Path
import sys
import joblib
import numpy as np
import pandas as pd
import pymysql
from datetime import datetime

# ======================================================
# PATH FIX (IMPORTANT)
# ======================================================

BASE_DIR = Path(__file__).resolve().parents[1]   # backend/ai
PROJECT_DIR = BASE_DIR.parent                   # backend/

sys.path.append(str(BASE_DIR))                  # allow ai.*
sys.path.append(str(PROJECT_DIR))

# ======================================================
# IMPORT FEATURE BUILDER
# ======================================================

from ai.features.build_features import (
    build_latest_features,
    get_feature_names,
)

# ======================================================
# CONFIG
# ======================================================

MODEL_PATH = BASE_DIR / "models" / "rf_hourly_fixed.pkl"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root123",
    "database": "db_monitor",
    "cursorclass": pymysql.cursors.DictCursor,
}

DEVICE_ID = "esp32-01-client-io"
LOOKBACK_HOURS = 24

# ======================================================
# LOAD MODEL
# ======================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
scaler = bundle.get("scaler")
lag_hours = bundle.get("lag_hours", 24)

print("✅ Model loaded")
print("   Lag hours:", lag_hours)

# ======================================================
# FETCH DATA FROM DB
# ======================================================

def fetch_actual_data(device_id: str, limit: int = 200) -> pd.DataFrame:
    conn = pymysql.connect(**DB_CONFIG)

    sql = """
        SELECT
            ts,
            temperature  AS temp_c,
            humidity     AS rh_pct,
            tvoc         AS tvoc_ppb,
            eco2         AS eco2_ppm,
            dust         AS dust_ugm3
        FROM actual
        WHERE deviceId = %s
        ORDER BY ts DESC
        LIMIT %s
    """

    with conn.cursor() as cur:
        cur.execute(sql, (device_id, limit))
        rows = cur.fetchall()

    conn.close()

    if not rows:
        raise RuntimeError("No sensor data found for device")

    df = pd.DataFrame(rows)

    # Convert ts to datetime index
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.sort_values("ts")
    df = df.set_index("ts")

    return df


# ======================================================
# MAIN
# ======================================================

def main():
    print(f"📥 Fetching data for device: {DEVICE_ID}")

    df = fetch_actual_data(DEVICE_ID, limit=200)

    print("✅ Rows fetched:", len(df))
    print("⏱️  Latest timestamp:", df.index.max())

    # --------------------------------------------------
    # BUILD FEATURES (SAME AS TRAINING)
    # --------------------------------------------------
    X_latest = build_latest_features(df)

    expected_features = get_feature_names()

    if list(X_latest.columns) != expected_features:
        raise ValueError(
            "Feature mismatch between training and inference"
        )

    print("✅ Feature vector shape:", X_latest.shape)

    # --------------------------------------------------
    # SCALE (IF USED)
    # --------------------------------------------------
    X_np = X_latest.values.astype(np.float32)

    if scaler is not None:
        X_np = scaler.transform(X_np)

    # --------------------------------------------------
    # PREDICT
    # --------------------------------------------------
    y_pred = model.predict(X_np)

    # Multi-output safety
    if hasattr(y_pred[0], "__len__"):
        preds = y_pred[0]
    else:
        preds = [float(y_pred[0])]

    target_cols = [
        "temp_c",
        "rh_pct",
        "tvoc_ppb",
        "eco2_ppm",
        "dust_ugm3",
    ]

    preds = preds[: len(target_cols)]

    # --------------------------------------------------
    # OUTPUT
    # --------------------------------------------------
    print("\n🔮 PREDICTION RESULT (NEXT STEP)")
    print("================================")
    for col, val in zip(target_cols, preds):
        if "tvoc" in col or "eco2" in col:
            print(f"{col:12s}: {int(val)}")
        else:
            print(f"{col:12s}: {val:.2f}")

    print("================================")
    print("🕒 Generated at:", datetime.now().isoformat())


# ======================================================
# ENTRYPOINT
# ======================================================

if __name__ == "__main__":
    main()
