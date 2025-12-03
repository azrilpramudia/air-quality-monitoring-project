from pathlib import Path
import joblib
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent  # points to backend/ai
MODELS_DIR = BASE_DIR / "models"

# Map model names to filenames
MODEL_FILES = {
    "xgb_multi": "xgb_multi.pkl",
    "rf_hourly_1step": "rf_hourly_1step.pkl",
    "rf_hourly_fixed": "rf_hourly_fixed.pkl",
}

MODELS: Dict[str, Any] = {}
DEFAULT_MODEL_NAME = "xgb_multi"


def load_models() -> None:
    """Load all models into memory."""
    global MODELS
    MODELS = {}

    for name, filename in MODEL_FILES.items():
        path = MODELS_DIR / filename
        if not path.exists():
            print(f"[WARN] Model file not found for '{name}': {path}")
            continue

        try:
            print(f"[INFO] Loading model '{name}' from {path}")
            model = joblib.load(path)
            MODELS[name] = model
            print(f"[INFO] Loaded model '{name}' successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to load model '{name}': {e}")


def get_model(name: str):
    """Return model by name or raise KeyError."""
    if name not in MODELS:
        raise KeyError(f"Model '{name}' not loaded or does not exist.")
    return MODELS[name]


def list_models() -> Dict[str, bool]:
    """Return dict of model_name -> loaded_status."""
    return {name: (name in MODELS) for name in MODEL_FILES.keys()}
