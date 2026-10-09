from rest_framework import serializers
from .models import SupportTicket, TicketMessage, Announcement, SystemLog
from vets.models import VetProfile
from accounts.models import User
from finance.models import Subscription

class SupportTicketSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.CharField(source='raised_by.full_name', read_only=True)
    class Meta:
        model = SupportTicket
        fields = '__all__'

class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    class Meta:
        model = TicketMessage
        fields = '__all__'

class SystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model = SystemLog
        fields = '__all__'

class VetProfileAdminSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.full_name', read_only=True)
    license = serializers.CharField(source='license_number', read_only=True)
    class Meta:
        model = VetProfile
        fields = '__all__'

class AdminSubscriptionSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    farm_county = serializers.CharField(source='farm.county', read_only=True)
    owner_name = serializers.CharField(source='farm.owner.full_name', read_only=True)
    owner_phone = serializers.SerializerMethodField()
    owner_email = serializers.CharField(source='farm.owner.email', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'farm', 'farm_name', 'farm_county', 'owner_name', 
            'owner_phone', 'owner_email', 'plan', 'status', 'start_date', 
            'end_date', 'trial_ends_at', 'amount_kes', 'mpesa_ref', 'created_at'
        ]
        read_only_fields = ['id', 'farm', 'created_at']

    def get_owner_phone(self, obj):
        if obj.farm and obj.farm.owner and obj.farm.owner.phone_number:
            return str(obj.farm.owner.phone_number)
        return ''

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'body', 'target_audience', 'is_published', 
            'publish_at', 'expires_at', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

