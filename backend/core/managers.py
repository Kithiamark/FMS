from django.db import models

class TenantQuerySet(models.QuerySet):
    def for_user(self, user):
        if user.role == 'ADMIN':
            return self.all()
        if user.role == 'FARMER':
            if hasattr(user, 'farm'):
                return self.filter(farm=user.farm)
            return self.none()
        if user.role == 'VETERINARIAN':
            # Vets can see connected farms
            # This logic might need to be specific per model or handled in views
            # But generally, tenant scope for Vet is handled by IsConnectedVet permission
            # For lists, we might want to return nothing by default unless specific endpoint
            return self.none() 
        return self.none()

class TenantManager(models.Manager):
    def get_queryset(self):
        return TenantQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)
