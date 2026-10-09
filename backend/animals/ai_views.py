import logging
from datetime import datetime, timedelta

import requests
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from animals.models import Animal, HealthRecord, VaccinationRecord
from core.utils import get_user_farm
from dairy.models import MilkRecord

logger = logging.getLogger(__name__)

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
        farm = get_user_farm(request.user)
        if not farm:
            return Response([])
        animals = Animal.objects.filter(farm=farm, is_active=True)[:5]
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
        farm = get_user_farm(request.user)
        if not farm:
            return Response({
                "model": {
                    "name": "Farm Learning Recommendations",
                    "version": "1.0",
                    "method": "Linear regression over each animal's milk history plus rule-based herd health signals",
                    "confidence": 0.0,
                    "learned_from_records": 0,
                },
                "summary": {
                    "active_animals": 0,
                    "milk_records_30_days": 0,
                    "last_7_day_total": 0.0,
                    "previous_7_day_total": 0.0,
                    "production_change_pct": 0.0,
                    "month_to_date_total": 0.0,
                },
                "animal_predictions": [],
                "recommendations": [],
            })
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


def _generate_fallback_response(message: str, farm_context: dict) -> str:
    msg = message.lower()
    farm_name = farm_context.get("farm_name", "your farm")
    county = farm_context.get("county", "Kenya")
    active_animals = farm_context.get("active_animals", 0)
    sick_animals = farm_context.get("sick_animals", 0)
    last_7_milk = farm_context.get("last_7_days_milk_litres", 0)

    if any(k in msg for k in ["mastitis", "udder", "teat", "swollen", "clots"]):
        return (
            f"**Mastitis Management & Udder Health Guidance for {farm_name}:**\n\n"
            "1. **Detection & Testing:** Perform a California Mastitis Test (CMT) immediately on all four quarters before milking. Check for thick gel formation or milk flaking.\n"
            "2. **Milking Protocol:** Always milk uninfected cows first. Affected cows must be milked last into a separate container, and their milk must be discarded.\n"
            "3. **Teat Dipping:** Dip teats post-milking in a recognized antiseptic dip (e.g. 0.5% - 1.0% iodophor) and keep cows standing for at least 30 minutes with fresh feed.\n"
            "4. **Bedding & Hygiene:** Ensure the cubicle or stall bedding is dry, clean, and disinfected with agricultural lime.\n"
            "5. **Veterinary Treatment:** If udder swelling, hardness, or fever is present, contact your local veterinary surgeon for targeted intramammary antibiotic infusion and anti-inflammatory therapy. Complete the full course and observe withdrawal periods."
        )

    if any(k in msg for k in ["feed", "nutrition", "silage", "napier", "hay", "ration", "concentrate", "diet", "water"]):
        return (
            f"**Dairy Feeding & Nutrition Plan (Tailored for {county}):**\n\n"
            "1. **Dry Matter Intake:** A lactating cow requires ~3% to 3.5% of her body weight in dry matter daily (e.g., 13-15 kg DM for a 450 kg cow).\n"
            "2. **Forage Foundation (70%):** Provide high-quality chopped Napier grass (wilted), maize silage, or Boma Rhodes hay. Chopping to 2-3 cm reduces waste and improves rumen digestion.\n"
            "3. **Dairy Meal Supplementation (30%):** Feed 1 kg of commercial dairy meal (16% crude protein) for every 1.5 - 2.0 Litres of milk produced above maintenance (~5 L base).\n"
            "4. **Minerals & Salts:** Supply 100-150g of balanced dairy mineral powder daily, plus free-choice rock salt / mineral lick.\n"
            "5. **Water Ad Libitum:** Ensure unlimited, clean drinking water. High-producing cows require 60 to 100 Litres of water daily; insufficient water immediately drops milk yield."
        )

    if any(k in msg for k in ["heat", "breeding", "inseminat", "ai", "calv", "bull", "estrus"]):
        return (
            f"**Breeding & Heat Detection Protocol for {farm_name}:**\n\n"
            "1. **Primary Signs of Standing Heat:** The cow stands firmly when mounted by herd mates. Secondary signs include clear, stringy vulval mucus discharge, restlessness, swelling of vulva, and drop in milk yield.\n"
            "2. **The AM-PM Breeding Rule:**\n"
            "   - If heat is observed in the **Morning**, inseminate in the **Evening** of the same day.\n"
            "   - If heat is observed in the **Evening**, inseminate the next **Morning** (within 10-14 hours).\n"
            "3. **AI Provider Quality:** Source certified semen from authorized artificial insemination (AI) technicians (e.g. via KAGRC or licensed distributors) with high milk trait indices suited for your crossbreeds.\n"
            "4. **Record Keeping:** Log insemination dates immediately in FMS so calving dates, gestation countdowns, and drying-off dates (at 7 months pregnant) are automatically tracked."
        )

    if any(k in msg for k in ["buyer", "market", "price", "aggregator", "offtake", "sell", "cooperative"]):
        return (
            f"**Milk Commercialization & Aggregator Off-Take in {county}:**\n\n"
            "1. **Find Verified Buyers:** You can discover active aggregators and chilling hubs operating in your county directly in the **Find Buyers** directory (`/find-buyer`).\n"
            "2. **Quality Standards for Top Payouts:**\n"
            "   - **Alcohol Test (68% or 72%):** Ensure milk does not coagulate to pass freshness checks.\n"
            "   - **Lactometer Reading:** Specific gravity should be between 1.028 and 1.032 to verify zero water adulteration.\n"
            "   - **Hygiene:** Cool milk promptly to under 4°C or deliver within 2 hours of morning milking to avoid rejection.\n"
            "3. **Payment Security:** Agree on clear payment schedules (bi-weekly or monthly M-Pesa/Bank payout) and track every collection slip against your FMS records."
        )

    if any(k in msg for k in ["calf", "calves", "colostrum", "wean", "scour"]):
        return (
            f"**Calf Rearing & Health Checklist:**\n\n"
            "1. **Colostrum Rule of Gold:** Feed the newborn calf 10% of its body weight (~3 to 4 Litres) of clean, high-quality colostrum within the **first 2 hours** of life, repeated at 12 hours.\n"
            "2. **Navel Care:** Dip the navel cord in 7% tincture of iodine immediately after birth to prevent navel ill and joint ill.\n"
            "3. **Early Solid Feeding:** Introduce fresh calf starter pellets (18-20% protein) and clean water from day 7. Introduce good quality fine hay (e.g., Lucerne/Rhodes) from week 2.\n"
            "4. **Weaning Target:** Wean calves at 8-10 weeks only when they are steadily consuming at least 1.0 kg of calf starter daily.\n"
            "5. **Calf Scours:** If diarrhea occurs, isolate the calf, administer oral rehydration electrolytes immediately, and call your veterinarian."
        )

    if any(k in msg for k in ["disease", "sick", "ecf", "tick", "fever", "fmd", "vaccin"]):
        return (
            f"**Herd Health & Disease Prevention for {farm_name}:**\n\n"
            f"*(Currently tracking {sick_animals} sick/monitoring animal(s) out of {active_animals} total head)*\n\n"
            "1. **Tick-Borne Diseases (ECF, Anaplasmosis, Babesiosis):** Strict acaricide spray or dip every 7 days is essential in Kenya. Check for swollen lymph nodes (especially behind the ear and in front of shoulder).\n"
            "2. **Vaccination Calendar:** Keep current with mandatory and regional vaccines:\n"
            "   - Foot and Mouth Disease (FMD) — Every 6 months\n"
            "   - Anthrax & Blackquarter — Annually\n"
            "   - Lumpy Skin Disease (LSD) — Annually\n"
            "   - ECF Muguga Cocktail — Once in calfhood for lifelong protection\n"
            "3. **Vital Signs:** Normal rectal temperature is 38.5°C to 39.2°C. A temperature exceeding 39.5°C indicates fever.\n"
            "4. **Emergency:** For recumbent cattle, bloody discharge, severe bloat, or rapid breathing, isolate immediately and contact your certified veterinarian."
        )

    return (
        f"**Welcome to Arvion AI Dairy Assistant!**\n\n"
        f"I am actively monitoring your farm profile at **{farm_name}** ({county}):\n"
        f"- 🐄 **Active Cattle:** {active_animals} animals\n"
        f"- 🩺 **Animals in Care/Watch:** {sick_animals}\n"
        f"- 🥛 **Recent 7-Day Output:** {last_7_milk} Litres\n\n"
        "Here are key areas I can help you with today:\n"
        "- 🌾 **Feed & Ration Formulation:** Balancing silage, Napier, and dairy meal concentrates for peak milk production.\n"
        "- 🩺 **Herd Health & Mastitis Control:** Step-by-step CMT protocols, biosecurity, and tick-borne disease prevention.\n"
        "- 🐄 **Breeding & Insemination:** Optimal timing for artificial insemination (AM-PM rule) and heat detection.\n"
        "- 🤝 **Commercial Aggregation:** Connecting with county milk buyers on `/find-buyer` and maintaining quality standards.\n\n"
        "*What specific challenge or question can I assist you with right now?*"
    )


class AIAssistantChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = (request.data.get("message") or "").strip()
        if not user_message:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        history = request.data.get("history", [])
        farm = get_user_farm(request.user)

        if farm:
            animals_qs = Animal.objects.filter(farm=farm, is_active=True)
            active_animals = animals_qs.count()
            sick_animals = animals_qs.filter(health_status=Animal.HealthStatus.SICK).count()
            breeds = [b for b in animals_qs.values_list("breed", flat=True).distinct()[:5] if b]
            today = timezone.now().date()
            last_7_milk = float(
                MilkRecord.objects.filter(
                    animal__farm=farm,
                    date__gte=today - timedelta(days=7),
                ).aggregate(total=Sum("total_yield"))["total"]
                or 0
            )

            farm_context = {
                "farm_name": farm.name,
                "county": farm.county or "Kenya",
                "active_animals": active_animals,
                "sick_animals": sick_animals,
                "breeds": breeds,
                "last_7_days_milk_litres": round(last_7_milk, 1),
            }
        else:
            farm_context = {
                "farm_name": "General Dairy Operations",
                "county": "Kenya",
                "active_animals": 0,
                "sick_animals": 0,
                "breeds": [],
                "last_7_days_milk_litres": 0.0,
            }

        gemini_api_key = getattr(settings, "GEMINI_API_KEY", "") or ""

        if gemini_api_key:
            try:
                system_instruction = (
                    "You are Arvion AI, an expert Kenyan agricultural & dairy management assistant embedded in the Farm Management System (FMS).\n"
                    "You provide actionable, practical advice for dairy farmers in Kenya.\n"
                    f"Farmer's Live Context:\n"
                    f"- Farm Name: {farm_context.get('farm_name')}\n"
                    f"- County: {farm_context.get('county')}\n"
                    f"- Active Cattle Herd: {farm_context.get('active_animals')} animals\n"
                    f"- Sick/Observing Animals: {farm_context.get('sick_animals')}\n"
                    f"- Key Breeds: {', '.join(farm_context.get('breeds', [])) or 'Friesian / Ayrshire / Crosses'}\n"
                    f"- Last 7 Days Milk Output: {farm_context.get('last_7_days_milk_litres')} Litres\n\n"
                    "Guidelines:\n"
                    "1. Focus on practical Kenyan dairy practices (e.g. silage, Napier grass, Rhodes grass, dairy meal concentrate balancing, mineral salts, clean water access).\n"
                    "2. Cover disease prevention, mastitis detection via CMT, tick-borne diseases (ECF), and hygiene protocols.\n"
                    "3. Support milk marketing, fair aggregator pricing, chilling storage, and quality testing (alcohol/density).\n"
                    "4. Keep responses structured, concise, and encouraging using bullet points.\n"
                    "5. Always advise consulting a certified local veterinary officer for prescription medicines or severe clinical symptoms."
                )

                gemini_contents = []
                if isinstance(history, list):
                    for turn in history[-6:]:
                        role = "model" if turn.get("role") in ["assistant", "model"] else "user"
                        content_text = turn.get("content") or (
                            turn.get("parts", [{}])[0].get("text")
                            if isinstance(turn.get("parts"), list) and turn.get("parts")
                            else ""
                        )
                        if content_text:
                            gemini_contents.append({
                                "role": role,
                                "parts": [{"text": str(content_text)}],
                            })

                gemini_contents.append({
                    "role": "user",
                    "parts": [{"text": user_message}],
                })

                payload = {
                    "system_instruction": {
                        "parts": [{"text": system_instruction}],
                    },
                    "contents": gemini_contents,
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 1000,
                    },
                }

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={gemini_api_key}"
                resp = requests.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=12,
                )

                if resp.status_code == 200:
                    resp_data = resp.json()
                    candidates = resp_data.get("candidates", [])
                    if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
                        ai_text = candidates[0]["content"]["parts"][0].get("text", "")
                        if ai_text:
                            return Response({
                                "response": ai_text,
                                "provider": "gemini-3.8-flash",
                                "mode": "live",
                                "farm_context": farm_context,
                            })
                else:
                    logger.warning("Gemini API returned status %s: %s", resp.status_code, resp.text)
            except Exception as e:
                logger.warning("Gemini API call failed, using fallback engine: %s", str(e))

        # Fallback heuristic engine
        fallback_text = _generate_fallback_response(user_message, farm_context)
        return Response({
            "response": fallback_text,
            "provider": "arvion-dairy-knowledge-base",
            "mode": "offline_fallback",
            "farm_context": farm_context,
        })

