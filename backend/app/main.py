from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import time
import os

from sqlalchemy import create_engine

from ai.features.build_features import build_latest_features
from ai.training.train_from_db import train_from_db

# ======================================================
# APP INIT
# ======================================================

app = FastAPI(
    title="Air Quality ML Service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()

# ======================================================
# PATH & DB
# ======================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(
    os.path.join(BASE_DIR, "..", "ai", "models", "xgb_hourly_final.pkl")
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:root123@localhost:3306/db_monitor",
)

engine = create_engine(DATABASE_URL)

# ======================================================
# LOAD MODEL
# ======================================================

if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Model not found: {MODEL_PATH}")

print("🚀 Loading ML model...")
bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
scaler = bundle["scaler"]
feature_names = bundle["feature_names"]
target_cols = bundle["target_cols"]
FREQ = bundle["freq"]

print("✅ Model loaded")
print("   Features:", len(feature_names))
print("   Targets :", target_cols)

# ======================================================
# REQUEST / RESPONSE MODELS
# ======================================================

class PredictRequest(BaseModel):
    device_id: str
    lookback_hours: int = 24


class PredictResponse(BaseModel):
    prediction: list[float]
    target_cols: list[str]
    timestamp: float


class TrainRequest(BaseModel):
    device_id: str | None = None


class TrainResponse(BaseModel):
    status: str
    rows_used: int
    mae: list[float]
    trained_at: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    uptime_seconds: float


# ======================================================
# HEALTH
# ======================================================

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        uptime_seconds=time.time() - START_TIME,
    )


# ======================================================
# PREDICT (DB-BASED)
# ======================================================

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        print(f"📥 Predict request | device={req.device_id}, lookback={req.lookback_hours}h")

        # ----------------------------------
        # 1) Load history from DB
        # ----------------------------------
        query = """
        SELECT
            ts,
            temperature,
            humidity,
            tvoc,
            eco2,
            dust
        FROM actual
        WHERE deviceId = %s
        ORDER BY ts DESC
        LIMIT %s
        """

        df = pd.read_sql(
            query,
            engine,
            params=(req.device_id, req.lookback_hours * 2),
        )

        if df.empty:
            raise HTTPException(404, "No data found for device")

        df["ts"] = pd.to_datetime(df["ts"], utc=True)
        df = df.set_index("ts").sort_index()

        # ----------------------------------
        # 2) Column normalization (CRITICAL)
        # ----------------------------------
        df = df.rename(
            columns={
                "temperature": "temp_c",
                "humidity": "rh_pct",
                "tvoc": "tvoc_ppb",
                "eco2": "eco2_ppm",
                "dust": "dust_ugm3",
            }
        )

        for c in ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]:
            if c not in df.columns:
                raise HTTPException(500, f"Missing column: {c}")

        # ----------------------------------
        # 3) Feature engineering
        # ----------------------------------
        X_latest = build_latest_features(df)

        X_latest = X_latest[feature_names]
        X_np = scaler.transform(X_latest.values)

        # ----------------------------------
        # 4) Predict
        # ----------------------------------
        pred = model.predict(X_np)[0]

        print("✅ Prediction OK:", pred.tolist())

        return PredictResponse(
            prediction=[float(x) for x in pred],
            target_cols=target_cols,
            timestamp=time.time(),
        )

    except HTTPException:
        raise

    except Exception as e:
        print("❌ Prediction error:", e)
        raise HTTPException(500, str(e))


# ======================================================
# TRAIN (MANUAL)
# ======================================================

@app.post("/train", response_model=TrainResponse)
def train(req: TrainRequest):
    try:
        print("🧠 Training requested")
        bundle = train_from_db(req.device_id)

        return TrainResponse(
            status="success",
            rows_used=bundle["rows"],
            mae=bundle["mae"],
            trained_at=bundle["trained_at"],
        )

    except Exception as e:
        print("❌ Training failed:", e)
        raise HTTPException(500, str(e))


# ======================================================
# ROOT
# ======================================================

@app.get("/")
def root():
    return {
        "service": "Air Quality ML Service",
        "endpoints": ["/health", "/predict", "/train"],
    }
