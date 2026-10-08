from django.db.models import Q
from django.utils import timezone
from core.models import AuditLog
from core.utils import get_user_farm
from rest_framework import viewsets, permissions, status, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AggregatorProfile, AggregatorFarmConnection, MilkCollection
from .serializers import AggregatorProfileSerializer, AggregatorFarmConnectionSerializer, MilkCollectionSerializer
from .permissions import IsAggregator, IsAggregatorProfileOwnerOrAdmin

class AggregatorProfileViewSet(viewsets.ModelViewSet):
    queryset = AggregatorProfile.objects.all()
    serializer_class = AggregatorProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAggregatorProfileOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = AggregatorProfile.objects.select_related('user')
        if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN':
            return qs
        if self.action == 'list':
            if user.role == 'FARMER':
                return qs.filter(is_verified=True)
            return qs.filter(user=user)
        # Detail actions (retrieve, update, partial_update, destroy)
        # Allow verified aggregators OR user's own profile
        return qs.filter(Q(is_verified=True) | Q(user=user))

    @action(detail=False, methods=['get', 'patch'], url_path='my-profile')
    def my_profile(self, request):
        try:
            profile = request.user.aggregator_profile
        except Exception:
            return Response({'error': 'User has no aggregator profile configured.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'PATCH':
            data = request.data.copy()
            if data.get('indemnity_agreed') and not profile.indemnity_agreed:
                profile.indemnity_agreed_at = timezone.now()
            serializer = self.get_serializer(profile, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(profile).data)

    def perform_create(self, serializer):
        user = self.request.user
        try:
            if hasattr(user, 'aggregator_profile') and user.aggregator_profile:
                raise exceptions.ValidationError({'detail': 'User already has an aggregator profile.'})
        except exceptions.ValidationError:
            raise
        except Exception:
            pass
        profile = serializer.save(user=user)
        AuditLog.objects.create(
            user=user,
            event_type=AuditLog.EventType.API,
            action='CREATE',
            model_name='AggregatorProfile',
            object_id=str(profile.id),
            metadata={'organization_name': profile.organization_name}
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.indemnity_agreed and not instance.indemnity_agreed_at:
            instance.indemnity_agreed_at = timezone.now()
            instance.save(update_fields=['indemnity_agreed_at'])

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser:
            raise exceptions.PermissionDenied("Aggregator profiles cannot be deleted directly. Contact platform administrators.")
        AuditLog.objects.create(
            user=self.request.user,
            event_type=AuditLog.EventType.API,
            action='DELETE',
            model_name='AggregatorProfile',
            object_id=str(instance.id),
            metadata={'aggregator_user_id': instance.user_id, 'organization_name': instance.organization_name}
        )
        instance.delete()

class AggregatorFarmConnectionViewSet(viewsets.ModelViewSet):
    queryset = AggregatorFarmConnection.objects.all()
    serializer_class = AggregatorFarmConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        farm = get_user_farm(user)
        if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN':
            return self.queryset.select_related('aggregator', 'farm')
        if user.role == 'AGGREGATOR':
            try:
                profile = user.aggregator_profile
            except Exception:
                return self.queryset.none()
            return self.queryset.filter(aggregator=profile).select_related('aggregator', 'farm')
        elif user.role in ['FARMER', 'FARM_WORKER'] and farm:
            return self.queryset.filter(farm=farm).select_related('aggregator', 'farm')
        return self.queryset.none()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        connection = self.get_object()
        farm = get_user_farm(request.user)
        if request.user.role != 'FARMER' or connection.farm != farm:
            return Response({'detail': 'Only the farm owner can accept.'}, status=status.HTTP_403_FORBIDDEN)
        connection.status = AggregatorFarmConnection.Status.ACCEPTED
        connection.save()
        return Response({'status': 'Connection accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        connection = self.get_object()
        farm = get_user_farm(request.user)
        if request.user.role != 'FARMER' or connection.farm != farm:
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
        farm = get_user_farm(user)
        if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN':
            return self.queryset.select_related('connection__aggregator', 'connection__farm')
        if user.role == 'AGGREGATOR':
            try:
                profile = user.aggregator_profile
            except Exception:
                return self.queryset.none()
            return self.queryset.filter(connection__aggregator=profile).select_related('connection__aggregator', 'connection__farm')
        elif user.role in ['FARMER', 'FARM_WORKER'] and farm:
            return self.queryset.filter(connection__farm=farm).select_related('connection__aggregator', 'connection__farm')
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        connection = serializer.validated_data.get('connection')
        if not getattr(user, 'is_superuser', False) and getattr(user, 'role', '') != 'ADMIN':
            if user.role != 'AGGREGATOR':
                raise exceptions.PermissionDenied("Only aggregators can log milk collections.")
            try:
                profile = user.aggregator_profile
            except Exception:
                raise exceptions.PermissionDenied("Aggregator profile not found.")
            if connection.aggregator != profile:
                raise exceptions.PermissionDenied("Cannot log milk collection for another aggregator's connection.")
            if connection.status != AggregatorFarmConnection.Status.ACCEPTED:
                raise exceptions.ValidationError({'connection': 'Cannot log collections on unaccepted connections.'})

        serializer.save()
