from core.utils import get_user_farm
from core.models import AuditLog
from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.response import Response
from .models import Farm, WorkerTask
from .serializers import FarmSerializer, WorkerTaskSerializer
from accounts.permissions import IsFarmer, IsAdmin, IsOwnFarm

class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            return Farm.objects.all()
        elif user.role == 'FARMER':
            return Farm.objects.filter(owner=user)
        elif user.role == 'FARM_WORKER' and getattr(user, 'assigned_farm', None):
            return Farm.objects.filter(id=user.assigned_farm.id)
        return Farm.objects.none()

    def create(self, request, *args, **kwargs):
        # Prevent 500 IntegrityError on duplicate farm creation by performing idempotent upsert
        existing_farm = Farm.objects.filter(owner=request.user).first()
        if existing_farm:
            serializer = self.get_serializer(existing_farm, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'FARM_WORKER':
            raise exceptions.PermissionDenied("Farm workers cannot create new farms.")
        farm = serializer.save(owner=user)
        AuditLog.objects.create(
            user=user,
            farm=farm,
            event_type=AuditLog.EventType.API,
            action='CREATE',
            model_name='Farm',
            object_id=str(farm.id),
            metadata={'farm_name': farm.name}
        )

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'FARM_WORKER':
            raise exceptions.PermissionDenied("Farm workers do not have permission to modify the farm profile.")
        farm = serializer.instance
        if not (user.role == 'ADMIN' or user.is_superuser or farm.owner == user):
            raise exceptions.PermissionDenied("You do not have permission to modify this farm.")
        updated_farm = serializer.save()
        AuditLog.objects.create(
            user=user,
            farm=updated_farm,
            event_type=AuditLog.EventType.API,
            action='UPDATE',
            model_name='Farm',
            object_id=str(updated_farm.id),
            metadata={'updated_fields': list(serializer.validated_data.keys())}
        )

    def destroy(self, request, *args, **kwargs):
        farm = self.get_object()
        if not request.user.is_superuser:
            raise exceptions.PermissionDenied(
                "Farms cannot be deleted directly to prevent accidental loss of livestock, dairy, and financial records. "
                "Please contact platform administrators or submit an in-app support request."
            )
        if request.query_params.get('confirm') != 'true':
            return Response(
                {
                    "detail": "To permanently delete this farm and cascade-delete all associated animals, finances, and records, pass confirmation parameter ?confirm=true."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        AuditLog.objects.create(
            user=request.user,
            farm=farm,
            event_type=AuditLog.EventType.API,
            action='DELETE',
            model_name='Farm',
            object_id=str(farm.id),
            metadata={'farm_name': farm.name, 'owner_id': farm.owner_id}
        )
        return super().destroy(request, *args, **kwargs)

class WorkerTaskViewSet(viewsets.ModelViewSet):
    serializer_class = WorkerTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
        if not farm:
            return WorkerTask.objects.none()
        if self.request.user.role == 'FARM_WORKER':
            return WorkerTask.objects.filter(farm=farm, assigned_to=self.request.user).order_by('-created_at')
        return WorkerTask.objects.filter(farm=farm).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'FARM_WORKER':
            raise exceptions.PermissionDenied("Farm workers cannot create or assign tasks.")
        farm = get_user_farm(user)
        if not farm:
            raise exceptions.ValidationError({'detail': 'No active farm associated with this user.'})

        assigned_to = serializer.validated_data.get('assigned_to')
        if assigned_to and (getattr(assigned_to, 'assigned_farm_id', None) != farm.id or getattr(assigned_to, 'role', '') != 'FARM_WORKER'):
            raise exceptions.ValidationError({'assigned_to': 'The assigned user must be a registered worker of this farm.'})

        task = serializer.save(farm=farm)
        AuditLog.objects.create(
            user=user,
            farm=farm,
            event_type=AuditLog.EventType.API,
            action='TASK_CREATED',
            model_name='WorkerTask',
            object_id=str(task.id),
            metadata={'title': task.title, 'assigned_to_id': task.assigned_to_id}
        )
        
    def perform_update(self, serializer):
        user = self.request.user
        task = serializer.instance
        if user.role == 'FARM_WORKER':
            if task.assigned_to != user:
                raise exceptions.PermissionDenied("You can only update tasks assigned to yourself.")
            allowed_fields = {'status'}
            changed_fields = set(serializer.validated_data.keys())
            if not changed_fields.issubset(allowed_fields):
                raise exceptions.PermissionDenied("Workers are only permitted to update the task status.")

        if serializer.validated_data.get('status') == WorkerTask.Status.COMPLETED:
            from django.utils import timezone
            serializer.save(completed_at=timezone.now())
        else:
            serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'FARM_WORKER':
            raise exceptions.PermissionDenied("Farm workers cannot delete tasks.")
        farm = get_user_farm(user)
        if instance.farm != farm and not (user.role == 'ADMIN' or user.is_superuser):
            raise exceptions.PermissionDenied("You do not have permission to delete this task.")
        instance.delete()
