from rest_framework import serializers
from django.utils import timezone
from .models import Animal, HealthRecord, VaccinationRecord

class HealthRecordSerializer(serializers.ModelSerializer):
    vet_name = serializers.CharField(source='vet.full_name', read_only=True)
    
    class Meta:
        model = HealthRecord
        fields = '__all__'
        read_only_fields = ('created_by', 'animal')

    def validate_cost_kes(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost cannot be negative.")
        return value

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Diagnosis date cannot be in the future.")
        return value

class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinationRecord
        fields = '__all__'
        read_only_fields = ('animal',)

    def validate_date_given(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Date given cannot be in the future.")
        return value

    def validate(self, attrs):
        date_given = attrs.get('date_given')
        next_due = attrs.get('next_due_date')
        if date_given and next_due and next_due < date_given:
            raise serializers.ValidationError({'next_due_date': "Next due date cannot be earlier than vaccination date."})
        return attrs

class AnimalListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Animal
        fields = ('id', 'name', 'ear_tag', 'breed', 'sex', 'health_status', 'photo', 'qr_code')

class AnimalDetailSerializer(serializers.ModelSerializer):
    health_records = HealthRecordSerializer(many=True, read_only=True)
    vaccinations = VaccinationSerializer(many=True, read_only=True)

    class Meta:
        model = Animal
        fields = '__all__'
        read_only_fields = ('farm', 'qr_code')

    def validate_weight_kg(self, value):
        if value <= 0:
            raise serializers.ValidationError("Weight must be greater than zero.")
        if value > 2500:
            raise serializers.ValidationError("Weight exceeds physiological limit (2,500 kg).")
        return value

    def validate_date_of_birth(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_ear_tag(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Ear tag cannot be empty or blank.")
        return cleaned
