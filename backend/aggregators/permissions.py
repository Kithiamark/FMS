from rest_framework import permissions

class IsAggregator(permissions.BasePermission):
    """
    Allows access only to authenticated users with role AGGREGATOR or platform admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'AGGREGATOR' or request.user.is_superuser or request.user.role == 'ADMIN')
        )

class IsAggregatorProfileOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission allowing read access to all authenticated users,
    update access only to the profile owner or platform admin,
    and delete access exclusively to platform super admin.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'DELETE':
            return request.user.is_superuser
        return obj.user == request.user or request.user.is_superuser or getattr(request.user, 'role', '') == 'ADMIN'
