from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import AuditLog
from core.utils import get_user_farm
from .models import VetProfile, VetFarmConnection
from .serializers import VetProfileSerializer, VetFarmConnectionSerializer, VetListSerializer
from .permissions import IsVetProfileOwnerOrAdmin
from accounts.permissions import IsVet, IsFarmer, IsAdmin

class VetProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsVetProfileOwnerOrAdmin] 
    serializer_class = VetProfileSerializer
    queryset = VetProfile.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return VetListSerializer
        return VetProfileSerializer

    @action(detail=False, methods=['get', 'patch'], url_path='my-profile')
    def my_profile(self, request):
        try:
            profile = request.user.vet_profile
        except Exception:
            return Response({'error': 'User has no veterinarian profile configured.'}, status=status.HTTP_400_BAD_REQUEST)
        if request.method == 'PATCH':
            data = request.data.copy()
            if data.get('indemnity_agreed') and not profile.indemnity_agreed:
                profile.indemnity_agreed_at = timezone.now()
            serializer = VetProfileSerializer(profile, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(VetProfileSerializer(profile).data)

    def get_queryset(self):
        user = self.request.user
        qs = VetProfile.objects.select_related('user').prefetch_related('availability', 'reviews__farm')
        if getattr(user, 'is_superuser', False) or getattr(user, 'role', '') == 'ADMIN':
            return qs
        if self.action == 'list':
            return qs.filter(is_verified=True)
        # Detail actions (retrieve, update, partial_update, destroy)
        # Allow verified vets OR the current user's own profile so unverified vets can view/edit their own profile
        return qs.filter(Q(is_verified=True) | Q(user=user))

    def perform_create(self, serializer):
        user = self.request.user
        try:
            if hasattr(user, 'vet_profile') and user.vet_profile:
                raise exceptions.ValidationError({'detail': 'User already has a veterinarian profile.'})
        except exceptions.ValidationError:
            raise
        except Exception:
            pass
        profile = serializer.save(user=user)
        AuditLog.objects.create(
            user=user,
            event_type=AuditLog.EventType.API,
            action='CREATE',
            model_name='VetProfile',
            object_id=str(profile.id),
            metadata={'license_number': profile.license_number}
        )

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser:
            raise exceptions.PermissionDenied("Veterinarian profiles cannot be deleted directly. Contact platform administrators.")
        AuditLog.objects.create(
            user=self.request.user,
            event_type=AuditLog.EventType.API,
            action='DELETE',
            model_name='VetProfile',
            object_id=str(instance.id),
            metadata={'vet_user_id': instance.user_id, 'license_number': instance.license_number}
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def connect(self, request, pk=None):
        if request.user.role != 'FARMER':
            return Response({'error': 'Only farmers can initiate connection'}, status=status.HTTP_403_FORBIDDEN)
        
        farm = get_user_farm(request.user)
        if not farm:
            return Response({'error': 'Farmer has no active farm configured'}, status=status.HTTP_400_BAD_REQUEST)

        vet = self.get_object()
        connection, created = VetFarmConnection.objects.get_or_create(
            vet=vet, 
            farm=farm,
            defaults={'requested_by': request.user}
        )
        if not created and connection.status == 'ACTIVE':
            return Response({'message': 'Already connected'}, status=status.HTTP_200_OK)
            
        connection.status = 'PENDING'
        # If reviving a connection, update who requested it
        if not created:
            connection.requested_by = request.user
        connection.save()
        return Response({'message': 'Connection request sent'}, status=status.HTTP_201_CREATED)

class VetConnectionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsVet | IsFarmer]
    serializer_class = VetFarmConnectionSerializer

    def get_queryset(self):
        user = self.request.user
        farm = get_user_farm(user)
        if user.role == 'VETERINARIAN':
            try:
                vet_profile = user.vet_profile
            except Exception:
                return VetFarmConnection.objects.none()
            return VetFarmConnection.objects.filter(vet=vet_profile)
        elif user.role in ['FARMER', 'FARM_WORKER'] and farm:
            return VetFarmConnection.objects.filter(farm=farm)
        return VetFarmConnection.objects.none()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        connection = self.get_object()
        try:
            vet_profile = request.user.vet_profile
        except Exception:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role != 'VETERINARIAN' or connection.vet != vet_profile:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        connection.status = 'ACTIVE'
        connection.save()
        return Response({'status': 'active'})
