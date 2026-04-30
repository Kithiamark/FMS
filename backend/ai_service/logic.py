import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from .models import MilkYieldInput, MilkYieldOutput, DiseaseRiskInput, DiseaseRiskOutput, FeedInput, FeedOutput

def predict_milk_yield(data: MilkYieldInput) -> MilkYieldOutput:
    if len(data.historical_yields) < 14:
        return MilkYieldOutput(
            predicted_7_day=[15.0] * 7,
            predicted_30_day_avg=15.0,
            confidence=0.2
        )

    df = pd.DataFrame(data.historical_yields)
    df['date'] = pd.to_datetime(df['date'])
    df['day_index'] = (df['date'] - df['date'].min()).dt.days
    
    X = df[['day_index']].values
    y = df['total'].values

    model = LinearRegression()
    model.fit(X, y)

    last_day = df['day_index'].max()
    future_days = np.array([[last_day + i] for i in range(1, 8)])
    predictions = model.predict(future_days)
    
    predicted_avg = np.mean(predictions)
    
    return MilkYieldOutput(
        predicted_7_day=predictions.tolist(),
        predicted_30_day_avg=predicted_avg,
        confidence=0.7 
    )

def assess_disease_risk(data: DiseaseRiskInput) -> DiseaseRiskOutput:
    score = 0
    
    # Yield Drop
    if len(data.recent_yield_trend) >= 2:
        avg_yield = np.mean(data.recent_yield_trend)
        last_yield = data.recent_yield_trend[-1]
        if last_yield < avg_yield * 0.8: # 20% drop
            score += 40
    
    # Vet Visit
    if data.days_since_last_vet > 90:
        score += 30
    elif data.days_since_last_vet > 60:
        score += 15

    # Vaccination
    if not data.vaccination_up_to_date:
        score += 25

    # Weight Loss
    if len(data.weight_trend) >= 2:
        if data.weight_trend[-1] < data.weight_trend[0] * 0.95: # 5% loss
            score += 20

    risk_level = "Low"
    action = "Routine monitoring."
    
    if score >= 60:
        risk_level = "High"
        action = "Immediate vet consultation required."
    elif score >= 30:
        risk_level = "Medium"
        action = "Monitor closely for symptoms."

    return DiseaseRiskOutput(
        risk_score=min(score, 100),
        risk_level=risk_level,
        recommended_action=action
    )

def recommend_feed(data: FeedInput) -> FeedOutput:
    maintenance_dm = data.weight_kg * 0.02
    production_dm = data.daily_milk_yield * 0.2 # Rough estimate
    
    total_dm = maintenance_dm + production_dm
    
    # Ratios
    hay_kg = total_dm * 0.7 # 70% roughage
    concentrates_kg = total_dm * 0.3 # 30% concentrate
    
    # Adjust for stage
    if data.stage == 'Dry':
        concentrates_kg *= 0.2
        hay_kg *= 1.2
    elif data.stage == 'Pregnant':
        concentrates_kg *= 1.1
    
    # Costs (KES estimates)
    hay_cost = 20 # per kg
    conc_cost = 50 # per kg
    mineral_cost = 2 # per g
    
    minerals = 100 # g
    water = data.daily_milk_yield * 3 + (data.weight_kg * 0.1)
    
    cost = (hay_kg * hay_cost) + (concentrates_kg * conc_cost) + (minerals * mineral_cost)
    
    return FeedOutput(
        hay_kg=round(hay_kg, 1),
        concentrates_kg=round(concentrates_kg, 1),
        mineral_supplement_g=minerals,
        water_litres=round(water, 1),
        estimated_cost_kes=round(cost, 2),
        notes="Ensure free access to clean water."
    )
