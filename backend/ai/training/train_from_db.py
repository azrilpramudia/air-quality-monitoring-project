import os
import joblib
import pandas as pd
from datetime import datetime

from sqlalchemy import create_engine

from sklearn.preprocessing import StandardScaler
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

from xgboost import XGBRegressor

from ai.features.build_features import build_features, get_feature_names


# ======================================================
# CONFIG
# ======================================================

TARGET_COLS = [
    "temp_c",
    "rh_pct",
    "tvoc_ppb",
    "eco2_ppm",
    "dust_ugm3",
]

MIN_ROWS = 48        # minimal 2 hari data hourly
RESAMPLE_FREQ = "1h"
TEST_SIZE = 0.2
RANDOM_STATE = 42


# ======================================================
# TRAINING FUNCTION
# ======================================================

def train_from_db(device_id: str | None = None):
    """
    Retrain XGBoost model from DB (hourly)
    Safe to be called from FastAPI endpoint /train
    """

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root123@localhost:3306/db_monitor",
    )

    engine = create_engine(DATABASE_URL)

    print("📥 Loading data from DB for training")

    # ------------------------------------------
    # Load data
    # ------------------------------------------
    query = """
        SELECT
            ts,
            temperature,
            humidity,
            tvoc,
            eco2,
            dust
        FROM actual
    """

    if device_id:
        query += " WHERE deviceId = %s"
        df = pd.read_sql(query, engine, params=(device_id,))
    else:
        df = pd.read_sql(query, engine)

    if df.empty:
        raise RuntimeError("No data available for training")

    # ------------------------------------------
    # Preprocess
    # ------------------------------------------
    df["ts"] = pd.to_datetime(df["ts"], utc=True)
    df = df.set_index("ts").sort_index()

    df = df.rename(
        columns={
            "temperature": "temp_c",
            "humidity": "rh_pct",
            "tvoc": "tvoc_ppb",
            "eco2": "eco2_ppm",
            "dust": "dust_ugm3",
        }
    )

    # ------------------------------------------
    # Hourly aggregation
    # ------------------------------------------
    df_hourly = (
        df[TARGET_COLS]
        .resample(RESAMPLE_FREQ)
        .mean()
        .dropna()
    )

    print(f"⏱️  Hourly rows: {len(df_hourly)}")
    print(f"📅 Range: {df_hourly.index.min()} → {df_hourly.index.max()}")

    if len(df_hourly) < MIN_ROWS:
        raise RuntimeError(
            f"Not enough data to train model (need ≥ {MIN_ROWS} hours)"
        )

    # ======================================================
    # FEATURE ENGINEERING (🔥 FIX COLUMN OVERLAP)
    # ======================================================

    # Build features
    X = build_features(df_hourly)
    feature_names = get_feature_names()

    # Build targets (next-step prediction)
    y = (
        df_hourly[TARGET_COLS]
        .shift(-1)
        .rename(columns={c: f"{c}_target" for c in TARGET_COLS})
    )

    # Join safely
    dataset = X.join(y, how="inner").dropna()

    X_final = dataset[X.columns]
    y_final = dataset[[f"{c}_target" for c in TARGET_COLS]].values

    print("🧠 Feature matrix:", X_final.shape)
    print("🎯 Target matrix :", y_final.shape)

    # ------------------------------------------
    # Train / test split
    # ------------------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X_final.values,
        y_final,
        test_size=TEST_SIZE,
        shuffle=False,
    )

    # ------------------------------------------
    # Scaling
    # ------------------------------------------
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # ------------------------------------------
    # XGBoost model
    # ------------------------------------------
    base_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )

    model = MultiOutputRegressor(base_model)

    print("🚀 Training XGBoost...")
    model.fit(X_train_s, y_train)

    # ------------------------------------------
    # Evaluation
    # ------------------------------------------
    preds = model.predict(X_test_s)
    maes = mean_absolute_error(y_test, preds, multioutput="raw_values")

    print("📊 Validation MAE:")
    for col, mae in zip(TARGET_COLS, maes):
        print(f"   {col:10s}: {mae:.3f}")

    # ------------------------------------------
    # Save model bundle
    # ------------------------------------------
    MODEL_PATH = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "models",
            "xgb_hourly_final.pkl",
        )
    )

    bundle = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names,
        "target_cols": TARGET_COLS,
        "freq": RESAMPLE_FREQ,
        "trained_at": datetime.utcnow().isoformat(),
        "rows": len(df_hourly),
    }

    joblib.dump(bundle, MODEL_PATH)

    print(f"💾 Model retrained & saved → {MODEL_PATH}")

    return {
        "rows": len(df_hourly),
        "mae": maes.tolist(),
        "trained_at": bundle["trained_at"],
        "model_path": MODEL_PATH,
    }
