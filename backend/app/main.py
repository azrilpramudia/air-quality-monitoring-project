from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import joblib
import numpy as np
import uvicorn
import os
import time
from typing import List, Optional

# ========================================
# APP INITIALIZATION
# ========================================

app = FastAPI(
    title="Air Quality ML Prediction Service",
    description="XGBoost multi-target regression for air quality forecasting",
    version="1.0.0"
)

# CORS middleware (allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# MODEL LOADING
# ========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "ai", "models", "rf_hourly_fixed.pkl")
MODEL_PATH = os.path.abspath(MODEL_PATH)

print("=" * 50)
print("Loading model from:", MODEL_PATH)
print("=" * 50)

try:
    saved = joblib.load(MODEL_PATH)
    print("✅ Loaded type:", type(saved))

    if isinstance(saved, dict):
        model = saved["model"]
        features = saved.get("features", None)
        target_cols = saved.get("target_cols", ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"])
        print(f"✅ Features: {len(features) if features else 'N/A'}")
        print(f"✅ Target columns: {target_cols}")
    else:
        model = saved
        features = None
        target_cols = ["temp_c", "rh_pct", "tvoc_ppb", "eco2_ppm", "dust_ugm3"]
        print("⚠️ Model loaded without metadata, using defaults")

    print("✅ Model loaded successfully!")
    print("=" * 50)

except FileNotFoundError:
    print(f"❌ Model file not found: {MODEL_PATH}")
    raise
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    raise

# ========================================
# REQUEST/RESPONSE MODELS
# ========================================

class PredictRequest(BaseModel):
    features: List[float]
    
    @validator('features')
    def validate_features(cls, v):
        if not v:
            raise ValueError('features cannot be empty')
        if len(v) < 5:  # Minimum 5 features expected
            raise ValueError(f'Expected at least 5 features, got {len(v)}')
        if not all(isinstance(x, (int, float)) for x in v):
            raise ValueError('All features must be numeric')
        return v

class PredictResponse(BaseModel):
    prediction: List[float]
    target_cols: List[str]
    timestamp: float
    model_version: str = "1.0.0"

class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    timestamp: float
    uptime_seconds: float

# ========================================
# GLOBAL STATE
# ========================================

START_TIME = time.time()

# ========================================
# ENDPOINTS
# ========================================

@app.get("/predict")
async def root():
    """Root endpoint - API info"""
    return {
        "service": "Air Quality ML Prediction",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "predict": "/predict (POST)",
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring service availability
    """
    return HealthResponse(
        status="healthy",
        service="ml-prediction",
        model_loaded=model is not None,
        timestamp=time.time(),
        uptime_seconds=time.time() - START_TIME
    )

@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Predict air quality metrics using trained XGBoost model
    
    Expected features (example):
    - Current sensor values (temp, humidity, tvoc, eco2, dust)
    - Rolling statistics (mean, std, min, max)
    - Time-based features (hour, day_of_week, etc.)
    
    Returns predictions for:
    - temp_c: Temperature (°C)
    - rh_pct: Relative Humidity (%)
    - tvoc_ppb: Total VOC (ppb)
    - eco2_ppm: Equivalent CO2 (ppm)
    - dust_ugm3: Dust density (µg/m³)
    """
    try:
        # Convert to numpy array
        arr = np.array([request.features])
        
        print(f"📊 Prediction request - Features shape: {arr.shape}")
        print(f"📊 Feature values: {request.features[:5]}... (showing first 5)")
        
        # Make prediction
        pred = model.predict(arr)
        
        # Handle different prediction formats
        if hasattr(pred[0], "__len__"):
            pred_value = [float(x) for x in pred[0]]
        else:
            pred_value = [float(pred[0])]
        
        # ============================================
        # FIX: Ensure only 5 predictions returned
        # ============================================
        EXPECTED_TARGETS = 5
        
        if len(pred_value) > EXPECTED_TARGETS:
            print(f"⚠️ Model returned {len(pred_value)} values, expected {EXPECTED_TARGETS}")
            print(f"⚠️ Extracting first {EXPECTED_TARGETS} values (one prediction per target)")
            pred_value = pred_value[:EXPECTED_TARGETS]
            print(f"✅ Extracted: {pred_value}")
        
        # Ensure target_cols matches prediction length
        if len(target_cols) > EXPECTED_TARGETS:
            print(f"⚠️ Trimming target_cols from {len(target_cols)} to {EXPECTED_TARGETS}")
            target_cols = target_cols[:EXPECTED_TARGETS]
        
        # Final validation
        if len(pred_value) != len(target_cols):
            error_msg = f"Mismatch: {len(pred_value)} predictions vs {len(target_cols)} targets"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # ============================================
        # FIX: Multi-step forecast → extract first step
        # ============================================
        expected_targets = len(target_cols)
        
        if len(pred_value) > expected_targets:
            print(f"⚠️ Model returned {len(pred_value)} values, expected {expected_targets}")
            print(f"⚠️ This suggests multi-step forecasting. Extracting first timestep only.")
            
            # Assume format: [t1_temp, t1_rh, t1_tvoc, t1_eco2, t1_dust, t2_temp, t2_rh, ...]
            # Take only first N values
            pred_value = pred_value[:expected_targets]
            print(f"✅ Using first {expected_targets} predictions: {pred_value}")
        
        # ============================================
        # CRITICAL FIX: Ensure target_cols matches predictions
        # ============================================
        if len(target_cols) > expected_targets:
            print(f"⚠️ target_cols has {len(target_cols)} items, trimming to {expected_targets}")
            target_cols = target_cols[:expected_targets]
        
        # Final validation
        if len(pred_value) != len(target_cols):
            error_msg = f"Prediction/target_cols mismatch: {len(pred_value)} vs {len(target_cols)}"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Validation: Check for extreme values
        bounds = {
            0: (-10, 60),      # temp_c
            1: (0, 100),       # rh_pct
            2: (0, 10000),     # tvoc_ppb
            3: (0, 10000),     # eco2_ppm
            4: (0, 1000),      # dust_ugm3
        }
        
        warnings = []
        for i, val in enumerate(pred_value):
            if i in bounds:
                min_val, max_val = bounds[i]
                if val < min_val or val > max_val:
                    col_name = target_cols[i] if i < len(target_cols) else f"target_{i}"
                    warnings.append(
                        f"{col_name}: {val:.2f} outside expected range [{min_val}, {max_val}]"
                    )
        
        if warnings:
            print("⚠️ Prediction warnings:")
            for w in warnings:
                print(f"  - {w}")
        
        print(f"✅ Prediction successful: {pred_value}")
        
        return PredictResponse(
            prediction=pred_value,
            target_cols=target_cols,
            timestamp=time.time()
        )
        
    except ValueError as e:
        print(f"❌ Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction failed: {str(e)}"
        )

@app.get("/model/info")
async def model_info():
    """Get information about the loaded model"""
    return {
        "model_type": type(model).__name__,
        "features": features if features else "Not available",
        "target_cols": target_cols,
        "model_path": MODEL_PATH,
    }

# ========================================
# STARTUP/SHUTDOWN EVENTS
# ========================================

@app.on_event("startup")
async def startup_event():
    print("\n" + "=" * 50)
    print("🚀 ML Service started successfully!")
    print(f"📍 Listening on: http://127.0.0.1:8500")
    print(f"📚 Docs available at: http://127.0.0.1:8500/docs")
    print("=" * 50 + "\n")

@app.on_event("shutdown")
async def shutdown_event():
    print("\n🛑 ML Service shutting down...")

# ========================================
# MAIN
# ========================================

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8500,
        reload=True,
        log_level="info"
    )