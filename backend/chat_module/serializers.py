from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'content', 'created_at', 'is_read', 'is_me']

    def get_is_me(self, obj):
        request = self.context.get('request')
        return request.user == obj.sender if request else False

class ConversationSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()
    partner_photo = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'partner_name', 'partner_photo', 'last_message', 'unread_count', 'last_message_at']

    def get_partner_name(self, obj):
        user = self.context['request'].user
        if hasattr(user, 'vet_profile') and obj.vet == user.vet_profile:
            return obj.farm.name # Vet sees Farm Name
        return f"Dr. {obj.vet.user.full_name}" # Farmer sees Vet Name

    def get_partner_photo(self, obj):
        return None

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return last_msg.content[:50]
        return ""

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()
