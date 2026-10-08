from rest_framework import serializers
from .models import AggregatorProfile, AggregatorFarmConnection, MilkCollection, AggregatorMessage
from farms.models import Farm
from core.utils import get_user_farm

class AggregatorProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.full_name', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False) or getattr(request.user, 'role', '') == 'ADMIN'):
            if 'is_verified' in self.fields:
                self.fields['is_verified'].read_only = False

    class Meta:
        model = AggregatorProfile
        fields = [
            'id', 'user', 'name', 'phone_number', 'organization_name', 
            'operating_counties', 'vehicle_capacity_litres', 'is_verified', 
            'business_reg_no', 'kra_pin', 'contact_person', 'office_address', 
            'payment_terms', 'indemnity_agreed', 'indemnity_agreed_at', 'created_at'
        ]
        read_only_fields = ('id', 'user', 'is_verified', 'created_at')

class AggregatorFarmConnectionSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    aggregator_name = serializers.CharField(source='aggregator.organization_name', read_only=True)

    class Meta:
        model = AggregatorFarmConnection
        fields = ['id', 'aggregator', 'farm', 'farm_name', 'aggregator_name', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            return attrs
        user = request.user
        aggregator = attrs.get('aggregator')
        farm = attrs.get('farm')

        if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN':
            return attrs

        if user.role == 'AGGREGATOR':
            try:
                user_aggregator = user.aggregator_profile
            except Exception:
                raise serializers.ValidationError({'aggregator': 'User has no aggregator profile configured.'})
            if aggregator != user_aggregator:
                raise serializers.ValidationError({'aggregator': 'You can only request connections for your own aggregator profile.'})
        elif user.role in ['FARMER', 'FARM_WORKER']:
            user_farm = get_user_farm(user)
            if not user_farm or farm != user_farm:
                raise serializers.ValidationError({'farm': 'You can only request connections for your own farm.'})

        if AggregatorFarmConnection.objects.filter(aggregator=aggregator, farm=farm).exists():
            raise serializers.ValidationError({'detail': 'A connection request between this aggregator and farm already exists.'})

        return attrs

class MilkCollectionSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='connection.farm.name', read_only=True)

    class Meta:
        model = MilkCollection
        fields = [
            'id', 'connection', 'farm_name', 'date', 'litres_collected', 
            'price_per_litre', 'total_price', 'payment_status',
            'lactometer_reading', 'temperature_celsius', 'alcohol_test_passed', 
            'quality_grade', 'rejection_reason', 'created_at'
        ]
        read_only_fields = ['total_price', 'created_at']

    def validate(self, attrs):
        connection = attrs.get('connection')
        if connection and connection.status != AggregatorFarmConnection.Status.ACCEPTED:
            raise serializers.ValidationError({'connection': 'Cannot log milk collections for an unaccepted connection.'})
        litres = attrs.get('litres_collected')
        if litres is not None and litres <= 0:
            raise serializers.ValidationError({'litres_collected': 'Litres collected must be greater than zero.'})
        price = attrs.get('price_per_litre')
        if price is not None and price <= 0:
            raise serializers.ValidationError({'price_per_litre': 'Price per litre must be greater than zero.'})

        lactometer = attrs.get('lactometer_reading')
        if lactometer is not None and (lactometer < 1.015 or lactometer > 1.045):
            raise serializers.ValidationError({'lactometer_reading': 'Lactometer reading must be within realistic specific gravity bounds (1.015 to 1.045).'})

        temp = attrs.get('temperature_celsius')
        if temp is not None and (temp < -5.0 or temp > 50.0):
            raise serializers.ValidationError({'temperature_celsius': 'Temperature must be between -5.0°C and 50.0°C.'})

        quality = attrs.get('quality_grade')
        rejection_reason = attrs.get('rejection_reason')
        if quality == MilkCollection.QualityGrade.REJECTED and not rejection_reason:
            raise serializers.ValidationError({'rejection_reason': 'Rejection reason is required when milk collection is rejected.'})

        return attrs


class AggregatorMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = AggregatorMessage
        fields = ['id', 'connection', 'sender', 'sender_name', 'content', 'is_read', 'is_me', 'created_at']
        read_only_fields = ['id', 'connection', 'sender', 'is_read', 'created_at']

    def get_is_me(self, obj):
        request = self.context.get('request')
        return bool(request and request.user == obj.sender)

