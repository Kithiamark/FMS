from core.utils import get_user_farm
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Alert
from rest_framework import serializers

class AlertSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'
        read_only_fields = ('farm', 'sent', 'sent_at', 'created_by')

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(farm=get_user_farm(self.request.user)).order_by('-created_at')

    def perform_create(self, serializer):
        animal = serializer.validated_data.get('animal')
        if animal and animal.farm != get_user_farm(self.request.user):
            raise serializers.ValidationError({'animal': 'Animal does not belong to your farm.'})
        serializer.save(farm=get_user_farm(self.request.user), created_by=self.request.user)

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        alert = self.get_object()
        alert.read = True
        alert.save()
        return Response({'status': 'marked as read'})
