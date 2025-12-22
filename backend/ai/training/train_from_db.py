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


def train_from_db(device_id: str | None = None):
    """
    Retrain XGBoost model from DB (manual trigger)
    """

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root123@localhost:3306/db_monitor",
    )

    engine = create_engine(DATABASE_URL)

    print("📥 Loading data from DB for training")

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

    TARGET_COLS = [
        "temp_c",
        "rh_pct",
        "tvoc_ppb",
        "eco2_ppm",
        "dust_ugm3",
    ]

    df_hourly = df[TARGET_COLS].resample("1h").mean().dropna()

    if len(df_hourly) < 48:
        raise RuntimeError("Not enough data to train model (need ≥ 48 hours)")

    # Feature engineering
    X_all = build_features(df_hourly)
    feature_names = get_feature_names()

    Y_all = df_hourly[TARGET_COLS].iloc[1:]
    X_all = X_all.iloc[:-1]

    X_train, X_test, y_train, y_test = train_test_split(
        X_all.values,
        Y_all.values,
        test_size=0.2,
        shuffle=False,
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    base_model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        n_jobs=-1,
        random_state=42,
    )

    model = MultiOutputRegressor(base_model)

    print("🚀 Training XGBoost...")
    model.fit(X_train_s, y_train)

    preds = model.predict(X_test_s)
    maes = mean_absolute_error(y_test, preds, multioutput="raw_values")

    MODEL_PATH = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "models", "xgb_hourly_final.pkl")
    )

    bundle = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names,
        "target_cols": TARGET_COLS,
        "freq": "1h",
        "trained_at": datetime.utcnow().isoformat(),
    }

    joblib.dump(bundle, MODEL_PATH)

    print("💾 Model retrained & saved")

    return {
        "rows": len(df_hourly),
        "mae": maes.tolist(),
        "trained_at": bundle["trained_at"],
    }
