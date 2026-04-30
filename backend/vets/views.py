from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VetProfile, VetFarmConnection
from .serializers import VetProfileSerializer, VetFarmConnectionSerializer
from accounts.permissions import IsVet, IsFarmer, IsAdmin

class VetProfileViewSet(viewsets.ModelViewSet):
    # Publicly viewable for directory? Or just authenticated?
    # Farmer needs to see list of vets to connect
    permission_classes = [permissions.IsAuthenticated] 
    serializer_class = VetProfileSerializer
    queryset = VetProfile.objects.all()

    def get_queryset(self):
        # Filtering logic for directory
        return VetProfile.objects.filter(is_verified=True)

    @action(detail=True, methods=['post'])
    def connect(self, request, pk=None):
        if request.user.role != 'FARMER':
            return Response({'error': 'Only farmers can initiate connection'}, status=status.HTTP_403_FORBIDDEN)
        
        vet = self.get_object()
        farm = request.user.farm
        
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
        if user.role == 'VETERINARIAN':
            return VetFarmConnection.objects.filter(vet=user.vet_profile)
        elif user.role == 'FARMER':
            return VetFarmConnection.objects.filter(farm=user.farm)
        return VetFarmConnection.objects.none()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        connection = self.get_object()
        if request.user.role != 'VETERINARIAN' or connection.vet != request.user.vet_profile:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        connection.status = 'ACTIVE'
        connection.save()
        return Response({'status': 'active'})
