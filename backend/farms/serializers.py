from rest_framework import serializers
from .models import Farm, WorkerTask

class FarmSerializer(serializers.ModelSerializer):
    animals = serializers.IntegerField(write_only=True, required=False, min_value=0)

    class Meta:
        model = Farm
        fields = ['id', 'name', 'location', 'county', 'sub_county', 'size_acres', 'primary_breed', 'kdb_license', 'estimated_herd_size', 'animals', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_size_acres(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Farm size in acres cannot be negative.")
        return value

    def validate_estimated_herd_size(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Estimated herd size cannot be negative.")
        return value

    def validate(self, attrs):
        if 'animals' in attrs and 'estimated_herd_size' not in attrs:
            attrs['estimated_herd_size'] = attrs.pop('animals')
        elif 'animals' in attrs:
            attrs.pop('animals')
        return attrs

from core.utils import get_user_farm

class WorkerTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    
    class Meta:
        model = WorkerTask
        fields = ('id', 'farm', 'assigned_to', 'assigned_to_name', 'title', 'description', 'status', 'due_date', 'created_at', 'completed_at')
        read_only_fields = ('id', 'farm', 'created_at', 'completed_at')

    def validate_assigned_to(self, value):
        request = self.context.get('request')
        if not request:
            return value
        farm = get_user_farm(request.user)
        if not farm:
            raise serializers.ValidationError("Requester has no associated farm.")
        if getattr(value, 'assigned_farm_id', None) != farm.id or getattr(value, 'role', '') != 'FARM_WORKER':
            raise serializers.ValidationError("The assigned user must be an active farm worker belonging to this farm.")
        return value
