from datetime import datetime, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from animals.models import Animal, HealthRecord, VaccinationRecord
from dairy.models import MilkRecord
from django.utils import timezone
from django.db.models import Sum

AI_SERVICE_URL = "http://localhost:8001"
AI_API_KEY = "dev-secret-key"


def _animal_age_months(animal):
    today = timezone.now().date()
    return max(0, (today.year - animal.date_of_birth.year) * 12 + today.month - animal.date_of_birth.month)


def _risk_assessment(days_since_vet, yield_trend, vaccination_up_to_date, health_status):
    score = 0

    if health_status == Animal.HealthStatus.SICK:
        score += 35
    elif health_status in [Animal.HealthStatus.PREGNANT, Animal.HealthStatus.DRY]:
        score += 10

    if len(yield_trend) >= 4:
        recent_avg = sum(yield_trend[:3]) / 3
        earlier_values = yield_trend[3:]
        earlier_avg = sum(earlier_values) / len(earlier_values)
        if earlier_avg > 0 and recent_avg < earlier_avg * 0.8:
            score += 35

    if days_since_vet > 120:
        score += 25
    elif days_since_vet > 75:
        score += 15

    if not vaccination_up_to_date:
        score += 20

    if score >= 60:
        return score, "High", "Book a vet review and isolate any animal showing fever, appetite loss, or abnormal milk."
    if score >= 30:
        return score, "Medium", "Monitor yield, appetite, and temperature daily for the next week."
    return score, "Low", "Continue routine checks and keep records current."


def _predict_next_week(records):
    # Lightweight local projection used until an external model service is introduced.
    # The frontend depends on the response keys, so preserve this contract when swapping
    # in a real ML model.
    if len(records) < 3:
        return {
            "predicted_7_day": [],
            "predicted_7_day_total": 0,
            "trend": "insufficient_data",
            "confidence": 0.2,
        }

    ordered = sorted(records, key=lambda record: record.date)
    start = ordered[0].date
    day_index = [(record.date - start).days for record in ordered]
    totals = [float(record.total_yield or 0) for record in ordered]

    mean_x = sum(day_index) / len(day_index)
    mean_y = sum(totals) / len(totals)
    denominator = sum((x - mean_x) ** 2 for x in day_index)
    slope = 0 if denominator == 0 else sum((x - mean_x) * (y - mean_y) for x, y in zip(day_index, totals)) / denominator
    intercept = mean_y - slope * mean_x
    last_day = max(day_index)
    predictions = [max(intercept + slope * (last_day + offset), 0) for offset in range(1, 8)]

    if slope > 0.25:
        trend = "improving"
    elif slope < -0.25:
        trend = "declining"
    else:
        trend = "stable"

    confidence = min(0.85, 0.35 + (len(records) / 40))
    return {
        "predicted_7_day": [round(value, 1) for value in predictions],
        "predicted_7_day_total": round(sum(predictions), 1),
        "trend": trend,
        "confidence": round(confidence, 2),
    }

class AIProxyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, endpoint):
        # These endpoints mimic a model service while keeping local development simple.
        # They are deterministic by design, which makes debugging and tests easier.
        if endpoint == "feed-recommendation":
            weight = float(request.data.get("weight_kg") or 450)
            milk = float(request.data.get("daily_milk_yield") or 0)
            stage = request.data.get("stage") or "Lactating"
            dry_matter = (weight * 0.02) + (milk * 0.2)
            hay_kg = dry_matter * 0.7
            concentrates_kg = dry_matter * 0.3
            if stage == "Dry":
                concentrates_kg *= 0.2
                hay_kg *= 1.2
            elif stage == "Pregnant":
                concentrates_kg *= 1.1
            return Response({
                "hay_kg": round(hay_kg, 1),
                "concentrates_kg": round(concentrates_kg, 1),
                "mineral_supplement_g": 100,
                "water_litres": round((milk * 3) + (weight * 0.1), 1),
                "estimated_cost_kes": round((hay_kg * 20) + (concentrates_kg * 50) + 200, 2),
                "notes": "Keep clean water available all day and adjust concentrates gradually.",
            })

        if endpoint == "disease-risk":
            score, level, action = _risk_assessment(
                int(request.data.get("days_since_last_vet") or 100),
                [float(value) for value in request.data.get("recent_yield_trend", [])],
                bool(request.data.get("vaccination_up_to_date", True)),
                request.data.get("health_status") or Animal.HealthStatus.HEALTHY,
            )
            return Response({
                "risk_score": min(score, 100),
                "risk_level": level,
                "recommended_action": action,
            })

        if endpoint == "milk-yield":
            historical = request.data.get("historical_yields", [])
            lightweight_records = [
                type("YieldRecord", (), {"date": datetime.fromisoformat(item["date"]).date(), "total_yield": item["total"]})
                for item in historical
                if item.get("date") and item.get("total") is not None
            ]
            prediction = _predict_next_week(lightweight_records)
            return Response({
                "predicted_7_day": prediction["predicted_7_day"],
                "predicted_30_day_avg": round(prediction["predicted_7_day_total"] / 7, 1) if prediction["predicted_7_day"] else 0,
                "confidence": prediction["confidence"],
            })

        return Response({"error": "Unknown AI endpoint"}, status=status.HTTP_404_NOT_FOUND)

class FarmHealthOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        animals = Animal.objects.filter(farm=request.user.farm, is_active=True)[:5]
        results = []
        
        for animal in animals:
            last_vet = HealthRecord.objects.filter(animal=animal).order_by('-date').first()
            days_since_vet = (timezone.now().date() - last_vet.date).days if last_vet else 100
            recent_yields = MilkRecord.objects.filter(animal=animal).order_by('-date')[:7]
            yield_trend = [float(record.total_yield or 0) for record in recent_yields]
            vaccination_up_to_date = not VaccinationRecord.objects.filter(
                animal=animal,
                next_due_date__lt=timezone.now().date()
            ).exists()
            score, level, action = _risk_assessment(days_since_vet, yield_trend, vaccination_up_to_date, animal.health_status)
            results.append({
                "animal": {
                    "id": animal.id,
                    "name": animal.name,
                    "ear_tag": animal.ear_tag,
                    "photo": animal.photo.url if animal.photo else None
                },
                "risk": {
                    "risk_score": min(score, 100),
                    "risk_level": level,
                    "recommended_action": action,
                }
            })

        return Response(results)


class PersonalizedRecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Recommendations combine learned milk history with rule-based farm signals.
        # Add new recommendation types here, but keep the list item shape stable:
        # type, priority, title, message, action, and link.
        farm = request.user.farm
        today = timezone.now().date()
        month_start = today.replace(day=1)
        animals = Animal.objects.filter(farm=farm, is_active=True)
        records = MilkRecord.objects.filter(animal__farm=farm)
        recent_records = records.filter(date__gte=today - timedelta(days=30))
        last_7 = records.filter(date__gte=today - timedelta(days=7))
        previous_7 = records.filter(date__gte=today - timedelta(days=14), date__lt=today - timedelta(days=7))

        last_7_total = float(last_7.aggregate(total=Sum('total_yield'))['total'] or 0)
        previous_7_total = float(previous_7.aggregate(total=Sum('total_yield'))['total'] or 0)
        production_change_pct = 0
        if previous_7_total:
            production_change_pct = round(((last_7_total - previous_7_total) / previous_7_total) * 100, 1)

        animal_predictions = []
        for animal in animals:
            animal_records = list(records.filter(animal=animal).order_by('-date')[:45])
            prediction = _predict_next_week(animal_records)
            animal_predictions.append({
                "animal": {
                    "id": animal.id,
                    "name": animal.name,
                    "ear_tag": animal.ear_tag,
                    "breed": animal.breed,
                    "health_status": animal.health_status,
                    "age_months": _animal_age_months(animal),
                },
                **prediction,
            })

        recommendations = []
        if records.count() < max(animals.count() * 7, 7):
            recommendations.append({
                "type": "records",
                "priority": "High",
                "title": "Build a stronger learning base",
                "message": "Record morning and evening milk daily for each cow for at least two weeks. The model becomes more personal as farm history grows.",
                "action": "Open Daily Milk Entry",
                "link": "/dairy/record",
            })

        declining = [item for item in animal_predictions if item["trend"] == "declining"]
        if declining:
            names = ", ".join(item["animal"]["name"] for item in declining[:3])
            recommendations.append({
                "type": "production",
                "priority": "High",
                "title": "Production trend needs attention",
                "message": f"{names} show a declining milk trend. Check feed consistency, water access, udder health, and heat stress.",
                "action": "Review herd",
                "link": "/animals",
            })
        elif production_change_pct > 10:
            recommendations.append({
                "type": "production",
                "priority": "Low",
                "title": "Production is improving",
                "message": f"Milk output is up {production_change_pct}% compared with the previous week. Keep the same feeding and milking routine stable.",
                "action": "View production",
                "link": "/dairy",
            })

        sick_or_watch = animals.filter(health_status__in=[Animal.HealthStatus.SICK, Animal.HealthStatus.PREGNANT, Animal.HealthStatus.DRY]).count()
        if sick_or_watch:
            recommendations.append({
                "type": "health",
                "priority": "Medium",
                "title": "Increase monitoring for special-status animals",
                "message": f"{sick_or_watch} animal(s) need closer observation. Track appetite, temperature, milk changes, and notes after each milking.",
                "action": "Check AI health",
                "link": "/insights",
            })

        top_animal = max(animal_predictions, key=lambda item: item["predicted_7_day_total"], default=None)
        if top_animal and top_animal["predicted_7_day_total"] > 0:
            recommendations.append({
                "type": "feed",
                "priority": "Medium",
                "title": "Match feed to expected production",
                "message": f"{top_animal['animal']['name']} is projected at {top_animal['predicted_7_day_total']} L over the next week. Prioritize clean water, roughage, and measured concentrates for high producers.",
                "action": "Record milk",
                "link": "/dairy/record",
            })

        monthly_total = float(records.filter(date__gte=month_start).aggregate(total=Sum('total_yield'))['total'] or 0)
        response = {
            "model": {
                "name": "Farm Learning Recommendations",
                "version": "1.0",
                "method": "Linear regression over each animal's milk history plus rule-based herd health signals",
                "confidence": round(sum(item["confidence"] for item in animal_predictions) / len(animal_predictions), 2) if animal_predictions else 0.2,
                "learned_from_records": records.count(),
            },
            "summary": {
                "active_animals": animals.count(),
                "milk_records_30_days": recent_records.count(),
                "last_7_day_total": round(last_7_total, 1),
                "previous_7_day_total": round(previous_7_total, 1),
                "production_change_pct": production_change_pct,
                "month_to_date_total": round(monthly_total, 1),
            },
            "animal_predictions": animal_predictions,
            "recommendations": recommendations,
        }
        return Response(response)
