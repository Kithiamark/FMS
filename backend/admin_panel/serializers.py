from rest_framework import serializers
from .models import SupportTicket, TicketMessage, Announcement, SystemLog
from vets.models import VetProfile
from accounts.models import User

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
