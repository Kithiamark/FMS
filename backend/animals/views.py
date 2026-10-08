from core.utils import get_user_farm
from rest_framework import viewsets, filters, status, generics
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
from accounts.permissions import IsVet, IsFarmer, IsAdmin, IsConnectedVet, IsOwnFarm

class AnimalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin | IsConnectedVet]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['health_status', 'breed', 'sex']
    search_fields = ['name', 'ear_tag']
    ordering_fields = ['created_at', 'name', 'ear_tag']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Animal.objects.filter(is_active=True)
        farm = get_user_farm(user)
        if farm:
            return Animal.objects.filter(farm=farm, is_active=True)
        return Animal.objects.none()
        if user.role == 'VETERINARIAN':
            # Vets should access via vet-specific endpoints usually, 
            # but if they hit this, show animals from connected farms?
            # Or restrict this viewset to Farmers/Admins only and use VetDataViewSet?
            # The prompt says: "Vet X cannot access Farm Y animals without an ACTIVE connection"
            # and "Vet X CAN access Farm Y animals after connection is ACTIVE"
            # So likely we should support it here or rely on VetDataViewSet.
            # Given the design, VetDataViewSet is the main entry for vets.
            # Let's return none here for vets to enforce using Vet portal, OR
            # allow read-only if we want generic access.
            # But the requirement says "Farmer A cannot GET /api/v1/animals/ and see Farmer B's animals"
            return Animal.objects.none() 
        return Animal.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return AnimalListSerializer
        return AnimalDetailSerializer

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.farm)

    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.health_status = Animal.HealthStatus.DECEASED
        instance.save()

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
            serializer.save(animal=animal, created_by=request.user)
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
