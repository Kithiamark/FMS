from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from django.utils import timezone
from core.utils import get_user_farm

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'vet_profile'):
            return Conversation.objects.filter(vet=user.vet_profile)
        farm = get_user_farm(user)
        if farm:
            return Conversation.objects.filter(farm=farm)
        return Conversation.objects.none()

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        
        if request.method == 'POST':
            content = (request.data.get('content') or '').strip()
            if not content:
                return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            has_access = False
            if hasattr(user, 'vet_profile') and conversation.vet == user.vet_profile:
                has_access = True
            farm = get_user_farm(user)
            if farm and conversation.farm == farm:
                has_access = True

            if not has_access:
                return Response({'error': 'You do not have access to this conversation.'}, status=status.HTTP_403_FORBIDDEN)

            message = Message.objects.create(conversation=conversation, sender=user, content=content)
            conversation.last_message_at = timezone.now()
            conversation.save()

            # Broadcast via Channels channel_layer if available
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f'chat_{conversation.id}',
                        {
                            'type': 'chat_message',
                            'message': {
                                'id': str(message.id),
                                'sender_id': str(user.id),
                                'sender_name': user.full_name,
                                'content': message.content,
                                'timestamp': message.created_at.isoformat()
                            }
                        }
                    )
            except Exception:
                pass

            serializer = MessageSerializer(message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        messages = conversation.messages.all().order_by('created_at')
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='get-or-create')
    def get_or_create(self, request):
        user = request.user
        vet_id = request.data.get('vet_id')
        farm_id = request.data.get('farm_id')

        # Scenario 1: Farmer initiates conversation with a Vet
        if vet_id:
            farm = get_user_farm(user)
            if not farm:
                return Response({'error': 'You must be associated with a farm to contact a veterinarian.'}, status=status.HTTP_400_BAD_REQUEST)
            from vets.models import VetProfile
            try:
                vet = VetProfile.objects.filter(Q(id=vet_id) | Q(user_id=vet_id)).first()
                if not vet:
                    return Response({'error': 'Veterinarian profile not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception:
                return Response({'error': 'Invalid veterinarian identifier.'}, status=status.HTTP_400_BAD_REQUEST)

            conversation, _ = Conversation.objects.get_or_create(vet=vet, farm=farm)
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Scenario 2: Vet initiates conversation with a Farm
        if farm_id:
            if not hasattr(user, 'vet_profile'):
                return Response({'error': 'Only veterinarians can initiate conversations with farm IDs.'}, status=status.HTTP_403_FORBIDDEN)
            from farms.models import Farm
            try:
                farm = Farm.objects.get(id=farm_id)
            except Farm.DoesNotExist:
                return Response({'error': 'Farm not found.'}, status=status.HTTP_404_NOT_FOUND)

            conversation, _ = Conversation.objects.get_or_create(vet=user.vet_profile, farm=farm)
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({'error': 'Either vet_id or farm_id must be provided.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'status': 'marked as read'})
