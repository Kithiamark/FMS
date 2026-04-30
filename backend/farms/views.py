from rest_framework import viewsets, permissions
from .models import Farm
from .serializers import FarmSerializer
from accounts.permissions import IsFarmer, IsAdmin, IsOwnFarm

class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Farm.objects.all()
        elif user.role == 'FARMER':
            return Farm.objects.filter(owner=user)
        # Vets might need read access via VetDataViewSet, but here?
        # Maybe allow if connected? But VetDataViewSet handles that.
        # So for now, restrict to owner/admin.
        return Farm.objects.none()

    def perform_create(self, serializer):
        # Only farmer/admin can create?
        # If user is farmer, set owner=user.
        # Assuming OneToOne constraint is handled by DB.
        serializer.save(owner=self.request.user)
