from rest_framework import permissions
from vets.models import VetFarmConnection

class IsFarmer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['FARMER', 'FARM_WORKER']

class IsVet(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'VETERINARIAN'

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsFarmerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['FARMER', 'FARM_WORKER', 'ADMIN']

class IsConnectedVet(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # obj is an Animal or Farm instance
        farm = obj if hasattr(obj, 'owner') else obj.farm
        if not hasattr(request.user, 'vet_profile'):
            return False
        return VetFarmConnection.objects.filter(
            vet=request.user.vet_profile,
            farm=farm,
            status='ACTIVE'
        ).exists()

class IsOwnFarm(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        farm = obj if hasattr(obj, 'owner') else obj.farm
        return farm == request.user.farm

class IsAdminReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.role == 'ADMIN':
            return request.method in permissions.SAFE_METHODS
        return False
