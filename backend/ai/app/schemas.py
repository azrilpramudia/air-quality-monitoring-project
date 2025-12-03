from typing import List, Optional
from pydantic import BaseModel

class PredictionRequest(BaseModel):
    data: List[float]  # features for 1 prediction

class BulkPredictionItem(BaseModel):
    id: Optional[str] = None
    data: List[float]

class BulkPredictionRequest(BaseModel):
    items: List[BulkPredictionItem]

class PredictionResponse(BaseModel):
    model: str
    prediction: float | List[float]

class BulkPredictionResponseItem(BaseModel):
    id: Optional[str] = None
    prediction: float | List[float]

class BulkPredictionResponse(BaseModel):
    model: str
    results: List[BulkPredictionResponseItem]
