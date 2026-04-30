from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class MilkYieldInput(BaseModel):
    animal_id: str
    historical_yields: List[dict] # [{date: 'YYYY-MM-DD', total: float}]
    breed: str
    age_months: int
    weight_kg: float

class MilkYieldOutput(BaseModel):
    predicted_7_day: List[float]
    predicted_30_day_avg: float
    confidence: float

class DiseaseRiskInput(BaseModel):
    animal_id: str
    days_since_last_vet: int
    weight_trend: List[float] # Last 7 days
    recent_yield_trend: List[float] # Last 7 days
    vaccination_up_to_date: bool
    age_months: int

class DiseaseRiskOutput(BaseModel):
    risk_score: int
    risk_level: str # Low, Medium, High
    recommended_action: str

class FeedInput(BaseModel):
    weight_kg: float
    daily_milk_yield: float
    stage: str # Lactating, Dry, Pregnant
    breed: str

class FeedOutput(BaseModel):
    hay_kg: float
    concentrates_kg: float
    mineral_supplement_g: float
    water_litres: float
    estimated_cost_kes: float
    notes: str
