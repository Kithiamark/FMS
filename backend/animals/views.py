from core.utils import get_user_farm
from core.models import AuditLog
from rest_framework import viewsets, filters, status, generics, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Animal, HealthRecord, VaccinationRecord
from .serializers import (
    AnimalListSerializer, 
    AnimalDetailSerializer, 
    HealthRecordSerializer, 
    VaccinationSerializer
)
from vets.models import VetFarmConnection
from accounts.permissions import IsVet, IsFarmer, IsAdmin, IsConnectedVet, IsOwnFarm

class AnimalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin | IsConnectedVet]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['health_status', 'breed', 'sex']
    search_fields = ['name', 'ear_tag']
    ordering_fields = ['created_at', 'name', 'ear_tag']

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_superuser', False) or user.role == 'ADMIN':
            return Animal.objects.filter(is_active=True).select_related('farm')
        farm = get_user_farm(user)
        if farm:
            return Animal.objects.filter(farm=farm, is_active=True).select_related('farm')
        if user.role == 'VETERINARIAN':
            try:
                vet_profile = user.vet_profile
                connected_farms = VetFarmConnection.objects.filter(
                    vet=vet_profile, 
                    status=VetFarmConnection.Status.ACTIVE
                ).values_list('farm_id', flat=True)
                return Animal.objects.filter(farm_id__in=connected_farms, is_active=True).select_related('farm')
            except Exception:
                return Animal.objects.none()
        return Animal.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return AnimalListSerializer
        return AnimalDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        farm = get_user_farm(user)
        if not farm:
            raise exceptions.ValidationError({'detail': 'User has no active farm configured.'})

        ear_tag = serializer.validated_data.get('ear_tag', '').strip()
        if Animal.objects.filter(farm=farm, ear_tag=ear_tag, is_active=True).exists():
            raise exceptions.ValidationError({'ear_tag': f"An active animal with ear tag '{ear_tag}' already exists on this farm."})

        animal = serializer.save(farm=farm)
        AuditLog.objects.create(
            user=user,
            event_type=AuditLog.EventType.API,
            action='CREATE',
            model_name='Animal',
            object_id=str(animal.id),
            metadata={'ear_tag': animal.ear_tag, 'breed': animal.breed, 'farm_id': farm.id}
        )

    def perform_destroy(self, instance):
        if self.request.user.role == 'FARM_WORKER':
            raise exceptions.PermissionDenied("Farm workers cannot delete or archive animal records.")
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        AuditLog.objects.create(
            user=self.request.user,
            event_type=AuditLog.EventType.API,
            action='DELETE',
            model_name='Animal',
            object_id=str(instance.id),
            metadata={'ear_tag': instance.ear_tag, 'farm_id': instance.farm_id}
        )

    @action(detail=True, methods=['get'])
    def qr(self, request, pk=None):
        animal = self.get_object()
        # Check permission manually if needed, or rely on get_object() + permission_classes
        if animal.qr_code:
            return Response({'qr_code_url': animal.qr_code.url})
        return Response({'error': 'QR code not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post', 'get'])
    def health(self, request, pk=None):
        animal = self.get_object()
        # Permission check for object is handled by get_object -> check_object_permissions
        # But we need to ensure IsConnectedVet works if a Vet hits this.
        
        if request.method == 'GET':
            records = HealthRecord.objects.filter(animal=animal).order_by('-date')
            serializer = HealthRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        # POST
        if request.user.role == 'VETERINARIAN':
             # Enforce IsConnectedVet explicitly if not already
             if not IsConnectedVet().has_object_permission(request, self, animal):
                 return Response({'error': 'Not connected to this farm'}, status=status.HTTP_403_FORBIDDEN)

        serializer = HealthRecordSerializer(data=request.data)
        if serializer.is_valid():
            vet_user = request.user if request.user.role == 'VETERINARIAN' else None
            serializer.save(animal=animal, created_by=request.user, vet=vet_user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post', 'get'])
    def vaccinations(self, request, pk=None):
        animal = self.get_object()
        if request.method == 'GET':
            records = VaccinationRecord.objects.filter(animal=animal).order_by('-date_given')
            serializer = VaccinationSerializer(records, many=True)
            return Response(serializer.data)

        # POST
        if request.user.role == 'VETERINARIAN':
             if not IsConnectedVet().has_object_permission(request, self, animal):
                 return Response({'error': 'Not connected to this farm'}, status=status.HTTP_403_FORBIDDEN)

        serializer = VaccinationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(animal=animal)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
