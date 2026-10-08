from rest_framework import serializers
from .models import AggregatorProfile, AggregatorFarmConnection, MilkCollection
from farms.models import Farm

class AggregatorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AggregatorProfile
        fields = ['id', 'organization_name', 'operating_counties', 'vehicle_capacity_litres', 'is_verified', 'business_reg_no', 'kra_pin', 'contact_person', 'office_address', 'payment_terms', 'indemnity_agreed', 'indemnity_agreed_at', 'created_at']

class AggregatorFarmConnectionSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    aggregator_name = serializers.CharField(source='aggregator.organization_name', read_only=True)

    class Meta:
        model = AggregatorFarmConnection
        fields = ['id', 'aggregator', 'farm', 'farm_name', 'aggregator_name', 'status', 'created_at']
        read_only_fields = ['status']

class MilkCollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MilkCollection
        fields = ['id', 'connection', 'date', 'litres_collected', 'price_per_litre', 'total_price', 'payment_status', 'created_at']
        read_only_fields = ['total_price']
