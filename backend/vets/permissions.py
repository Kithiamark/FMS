from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from animals.models import Animal
from farms.models import Farm
from vets.models import VetFarmConnection

class IsVet(permissions.BasePermission):
    """
    Custom permission to only allow vets to access the view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'vet_profile')

class VetFarmAccessMixin:
    """
    Mixin to ensure vet has ACTIVE connection to the farm.
    Assumes `farm_id` or `animal_id` is passed in URL kwargs.
    """
    def check_vet_farm_access(self, request, farm=None, animal=None):
        if not hasattr(request.user, 'vet_profile'):
            raise PermissionDenied("User is not a veterinarian.")
            
        vet_profile = request.user.vet_profile
        target_farm = farm
        
        if animal:
            target_farm = animal.farm
        
        if not target_farm:
             # If neither is provided, we can't check specific access yet, 
             # but might be listing farms which is handled by queryset filtering
             return

        # Check for ACTIVE connection
        has_connection = VetFarmConnection.objects.filter(
            vet=vet_profile,
            farm=target_farm,
            status=VetFarmConnection.Status.ACTIVE
        ).exists()

        if not has_connection:
            raise PermissionDenied(f"You do not have an active connection with {target_farm.name}.")

    def get_object(self):
        # Override get_object to perform check on the retrieved object
        obj = super().get_object()
        
        # Determine if obj is Farm or Animal or related
        farm = None
        animal = None
        
        if isinstance(obj, Farm):
            farm = obj
        elif isinstance(obj, Animal):
            animal = obj
        elif hasattr(obj, 'farm'): # HealthRecord, etc
            farm = obj.farm
        elif hasattr(obj, 'animal'):
            animal = obj.animal
            
        self.check_vet_farm_access(self.request, farm=farm, animal=animal)
        return obj
