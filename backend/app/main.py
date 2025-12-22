from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import time
import os
# import logging
# from .logging_config import HealthFilter

from sqlalchemy import create_engine

from ai.features.build_features import build_latest_features
from ai.training.train_from_db import train_from_db

# ======================================================
# APP INIT
# ======================================================

app = FastAPI(
    title="Air Quality ML Service",
    version="1.1.0",
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
# GLOBAL MODEL STATE (AUTO-RELOAD SAFE)
# ======================================================

model = None
scaler = None
feature_names = None
target_cols = None
FREQ = None
MODEL_LOADED_AT = None


def load_model():
    """
    Load / Reload model bundle from disk
    """
    global model, scaler, feature_names, target_cols, FREQ, MODEL_LOADED_AT

    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model not found: {MODEL_PATH}")

    print("🔄 Loading ML model...")
    bundle = joblib.load(MODEL_PATH)

    model = bundle["model"]
    scaler = bundle["scaler"]
    feature_names = bundle["feature_names"]
    target_cols = bundle["target_cols"]
    FREQ = bundle.get("freq", "1h")
    MODEL_LOADED_AT = time.time()

    print("✅ Model loaded")
    print("   Features:", len(feature_names))
    print("   Targets :", target_cols)
    print("   Loaded at:", time.ctime(MODEL_LOADED_AT))


# ======================================================
# LOAD MODEL AT STARTUP
# ======================================================

load_model()

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
    model_reloaded: bool


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_loaded_at: float | None
    uptime_seconds: float


# # =============================
# # FILTER ACCESS LOG (TOP LEVEL)
# # =============================
# uvicorn_access = logging.getLogger("uvicorn.access")
# uvicorn_access.addFilter(HealthFilter())

# ======================================================
# HEALTH
# ======================================================

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        model_loaded_at=MODEL_LOADED_AT,
        uptime_seconds=time.time() - START_TIME,
    )


# ======================================================
# PREDICT (DB-BASED)
# ======================================================

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        if model is None:
            raise HTTPException(503, "Model not loaded")

        print(f"📥 Predict request | device={req.device_id}, lookback={req.lookback_hours}h")

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

        df = df.rename(
            columns={
                "temperature": "temp_c",
                "humidity": "rh_pct",
                "tvoc": "tvoc_ppb",
                "eco2": "eco2_ppm",
                "dust": "dust_ugm3",
            }
        )

        X_latest = build_latest_features(df)
        X_latest = X_latest[feature_names]
        X_np = scaler.transform(X_latest.values)

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
# TRAIN + AUTO-RELOAD
# ======================================================

@app.post("/train", response_model=TrainResponse)
def train(req: TrainRequest):
    try:
        print("🧠 Training requested")

        result = train_from_db(req.device_id)

        # 🔥 AUTO-RELOAD MODEL AFTER TRAINING
        load_model()

        return TrainResponse(
            status="success",
            rows_used=result["rows"],
            mae=result["mae"],
            trained_at=result["trained_at"],
            model_reloaded=True,
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
        "version": "1.1.0",
        "endpoints": ["/health", "/predict", "/train"],
    }
