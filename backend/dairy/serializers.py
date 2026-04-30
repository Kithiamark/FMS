from rest_framework import serializers
from .models import MilkRecord

class MilkRecordSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    animal_ear_tag = serializers.CharField(source='animal.ear_tag', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)
    allocated_litres = serializers.SerializerMethodField()
    unallocated_litres = serializers.SerializerMethodField()

    class Meta:
        model = MilkRecord
        fields = '__all__'
        read_only_fields = ('total_yield', 'recorded_by')

    def get_allocated_litres(self, obj):
        return float((obj.home_use_litres or 0) + (obj.sold_litres or 0) + (obj.calf_litres or 0))

    def get_unallocated_litres(self, obj):
        allocated = (obj.home_use_litres or 0) + (obj.sold_litres or 0) + (obj.calf_litres or 0)
        return float((obj.total_yield or 0) - allocated)
