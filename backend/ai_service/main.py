from fastapi import FastAPI, Header, HTTPException, Depends
from .models import MilkYieldInput, MilkYieldOutput, DiseaseRiskInput, DiseaseRiskOutput, FeedInput, FeedOutput
from .logic import predict_milk_yield, assess_disease_risk, recommend_feed
import os

app = FastAPI(title="FMS AI Service")

API_KEY = os.getenv("AI_SERVICE_API_KEY", "dev-secret-key")


async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

@app.get("/health")
def health_check():
    return {"status": "ok", "model_version": "1.0.0"}

@app.post("/predict/milk-yield", response_model=MilkYieldOutput)
def get_milk_yield_prediction(data: MilkYieldInput, authorized: bool = Depends(verify_api_key)):
    return predict_milk_yield(data)

@app.post("/predict/disease-risk", response_model=DiseaseRiskOutput)
def get_disease_risk(data: DiseaseRiskInput, authorized: bool = Depends(verify_api_key)):
    return assess_disease_risk(data)

@app.post("/predict/feed-recommendation", response_model=FeedOutput)
def get_feed_recommendation(data: FeedInput, authorized: bool = Depends(verify_api_key)):
    return recommend_feed(data)
