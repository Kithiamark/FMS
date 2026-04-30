from rest_framework import serializers
from .models import Animal, HealthRecord, VaccinationRecord

class HealthRecordSerializer(serializers.ModelSerializer):
    vet_name = serializers.CharField(source='vet.full_name', read_only=True)
    
    class Meta:
        model = HealthRecord
        fields = '__all__'
        read_only_fields = ('created_by',)

class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaccinationRecord
        fields = '__all__'

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
