from django.utils import timezone
from core.utils import get_user_farm
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AggregatorProfile, AggregatorFarmConnection, MilkCollection
from .serializers import AggregatorProfileSerializer, AggregatorFarmConnectionSerializer, MilkCollectionSerializer

class IsAggregator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'AGGREGATOR')

class AggregatorProfileViewSet(viewsets.ModelViewSet):
    queryset = AggregatorProfile.objects.all()
    serializer_class = AggregatorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Farmers can view verified aggregators, aggregators can view their own profile.
        if self.request.user.role == 'FARMER':
            return self.queryset.filter(is_verified=True)
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.indemnity_agreed and not instance.indemnity_agreed_at:
            instance.indemnity_agreed_at = timezone.now()
            instance.save(update_fields=['indemnity_agreed_at'])

class AggregatorFarmConnectionViewSet(viewsets.ModelViewSet):
    queryset = AggregatorFarmConnection.objects.all()
    serializer_class = AggregatorFarmConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'AGGREGATOR':
            return self.queryset.filter(aggregator__user=user)
        elif user.role == 'FARMER':
            return self.queryset.filter(farm__owner=user)
        return self.queryset.none()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        connection = self.get_object()
        if request.user.role != 'FARMER' or connection.farm != get_user_farm(request.user):
            return Response({'detail': 'Only the farm owner can accept.'}, status=status.HTTP_403_FORBIDDEN)
        connection.status = AggregatorFarmConnection.Status.ACCEPTED
        connection.save()
        return Response({'status': 'Connection accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        connection = self.get_object()
        if request.user.role != 'FARMER' or connection.farm != get_user_farm(request.user):
            return Response({'detail': 'Only the farm owner can reject.'}, status=status.HTTP_403_FORBIDDEN)
        connection.status = AggregatorFarmConnection.Status.REJECTED
        connection.save()
        return Response({'status': 'Connection rejected'})

class MilkCollectionViewSet(viewsets.ModelViewSet):
    queryset = MilkCollection.objects.all()
    serializer_class = MilkCollectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'AGGREGATOR':
            return self.queryset.filter(connection__aggregator__user=user)
        elif user.role == 'FARMER':
            return self.queryset.filter(connection__farm__owner=user)
        return self.queryset.none()
