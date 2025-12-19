from fastapi import APIRouter, HTTPException
import numpy as np

from .schemas import (
    PredictionRequest,
    PredictionResponse,
    BulkPredictionRequest,
    BulkPredictionResponse,
    BulkPredictionResponseItem,
)
from .models_manager import get_model, DEFAULT_MODEL_NAME

router = APIRouter()

@router.get("/health", tags=["system"])
def health_check():
    """Simple health endpoint."""
    return {"status": "ok"}

@router.get("/models", tags=["system"])
def list_available_models():
    from .models_manager import list_models
    return {"models": list_models(), "default": DEFAULT_MODEL_NAME}


@router.post("/predict", response_model=PredictionResponse, tags=["predict"])
def predict_default(request: PredictionRequest):
    """Predict using default model."""
    return _predict_for_model(DEFAULT_MODEL_NAME, request)


@router.post("/predict/{model_name}", response_model=PredictionResponse, tags=["predict"])
def predict_with_model(model_name: str, request: PredictionRequest):
    """Predict using specific model."""
    return _predict_for_model(model_name, request)


@router.post("/predict/bulk/{model_name}", response_model=BulkPredictionResponse, tags=["predict"])
def predict_bulk(model_name: str, request: BulkPredictionRequest):
    """Bulk prediction for a specific model."""
    try:
        model = get_model(model_name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Each item.data is one row of features
    X = np.array([item.data for item in request.items])
    preds = model.predict(X)

    # Preds may be 1D or 2D
    results = []
    for item, pred in zip(request.items, preds):
        # if array, convert to list, else to float
        if hasattr(pred, "__len__") and not isinstance(pred, (float, int)):
            pred_value = [float(x) for x in pred]
        else:
            pred_value = float(pred)
        results.append(
            BulkPredictionResponseItem(
                id=item.id,
                prediction=pred_value,
            )
        )

    return BulkPredictionResponse(model=model_name, results=results)


# ------------- internal helper -----------------

def _predict_for_model(model_name: str, request: PredictionRequest) -> PredictionResponse:
    try:
        model = get_model(model_name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Convert to shape (1, n_features)
    arr = np.array([request.data])

    pred = model.predict(arr)[0]

    # If model returns vector (multi-output), return list
    if hasattr(pred, "__len__") and not isinstance(pred, (float, int)):
        pred_value = [float(x) for x in pred]
    else:
        pred_value = float(pred)

    return PredictionResponse(model=model_name, prediction=pred_value)
