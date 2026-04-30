import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import Conversation, Message
from django.utils import timezone
from .tasks import check_message_read_fallback

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Verify Token
        query_string = self.scope['query_string'].decode()
        token = None
        if 'token=' in query_string:
            token = query_string.split('token=')[1]
        
        user = await self.get_user_from_token(token)
        if not user:
            await self.close()
            return
            
        self.user = user
        
        # Verify access to conversation
        has_access = await self.verify_conversation_access(user, self.conversation_id)
        if not has_access:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json['content']
        
        # Save message
        message = await self.save_message(self.user, self.conversation_id, content)

        # Schedule SMS fallback (5 mins delay)
        # Note: calling celery task from async consumer requires sync_to_async or just call .delay() which is thread-safe usually?
        # Celery .delay() is thread-safe.
        check_message_read_fallback.apply_async((message.id,), countdown=300)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': str(message.id),
                    'sender_id': str(self.user.id),
                    'sender_name': self.user.full_name,
                    'content': message.content,
                    'timestamp': message.created_at.isoformat()
                }
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except Exception:
            return None

    @database_sync_to_async
    def verify_conversation_access(self, user, conversation_id):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            if hasattr(user, 'vet_profile') and conv.vet == user.vet_profile:
                return True
            if hasattr(user, 'farm') and conv.farm == user.farm:
                return True
            return False
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, conversation_id, content):
        conv = Conversation.objects.get(id=conversation_id)
        msg = Message.objects.create(conversation=conv, sender=user, content=content)
        conv.last_message_at = timezone.now()
        conv.save()
        return msg
