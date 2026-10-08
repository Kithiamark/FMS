from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
from core.models import AuditLog
from core.utils import get_user_farm
from .models import SupportTicket, TicketMessage, Announcement, SystemLog
from .serializers import SupportTicketSerializer, TicketMessageSerializer, SystemLogSerializer, VetProfileAdminSerializer
from farms.models import Farm
from animals.models import Animal
from vets.models import VetProfile
from finance.models import Subscription
from accounts.serializers import UserSerializer

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', '') == 'ADMIN')
        )

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_farmers = User.objects.filter(role='FARMER').count()
        total_vets = User.objects.filter(role='VETERINARIAN').count()
        total_animals = Animal.objects.count()
        
        active_subs = Subscription.objects.filter(status='ACTIVE')
        sub_counts = {
            'basic': active_subs.filter(plan='Basic').count(),
            'trial': active_subs.filter(plan='Trial').count(),
            'premium': active_subs.filter(plan='Premium').count(),
            'enterprise': active_subs.filter(plan='Enterprise').count(),
        }

        monthly_revenue = 0 
        errors_24h = SystemLog.objects.filter(
            level__in=['ERROR', 'CRITICAL'], 
            timestamp__gte=timezone.now() - timezone.timedelta(hours=24)
        ).count()

        data = {
            'total_farmers': total_farmers,
            'total_vets': total_vets,
            'total_animals': total_animals,
            'active_subscriptions': sub_counts,
            'monthly_revenue_kes': monthly_revenue,
            'system_errors_24h': errors_24h,
        }
        return Response(data)

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['post'])
    def impersonate(self, request, pk=None):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only platform super administrators can impersonate users.'},
                status=status.HTTP_403_FORBIDDEN
            )
        target_user = self.get_object()
        
        if target_user == request.user:
            return Response(
                {'error': 'Cannot impersonate your own administrative account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if target_user.is_superuser or target_user.is_staff or getattr(target_user, 'role', '') == 'ADMIN':
            return Response(
                {'error': 'Impersonation of administrative or staff accounts is forbidden.'},
                status=status.HTTP_403_FORBIDDEN
            )

        SystemLog.objects.create(
            level=SystemLog.Level.WARNING,
            service=SystemLog.Service.API,
            message=f"Superadmin {request.user.email} impersonated {target_user.email}",
            user=request.user,
            ip_address=request.META.get('REMOTE_ADDR')
        )

        AuditLog.objects.create(
            user=request.user,
            event_type=AuditLog.EventType.SECURITY,
            action='USER_IMPERSONATED',
            model_name='User',
            object_id=str(target_user.id),
            metadata={
                'details': f"Superadmin {request.user.email} generated impersonation session for {target_user.email}",
                'target_user_id': str(target_user.id),
                'target_email': target_user.email,
                'target_role': getattr(target_user, 'role', ''),
                'ip_address': request.META.get('REMOTE_ADDR'),
            }
        )

        refresh = RefreshToken.for_user(target_user)
        refresh.set_exp(lifetime=timezone.timedelta(minutes=15))
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'warning': 'This token expires in 15 minutes. Financial operations restricted.'
        })

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only platform super administrators can delete user accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {'error': 'Administrators cannot delete their own active account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        AuditLog.objects.create(
            user=request.user,
            event_type=AuditLog.EventType.SECURITY,
            action='DELETE',
            model_name='User',
            object_id=str(instance.id),
            metadata={
                'details': f"Superadmin {request.user.email} permanently deleted user {instance.email} ({instance.role})",
                'deleted_user_id': str(instance.id),
                'deleted_email': instance.email,
                'deleted_role': getattr(instance, 'role', ''),
            }
        )
        return super().destroy(request, *args, **kwargs)

class AdminVetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = VetProfile.objects.all()
    serializer_class = VetProfileAdminSerializer

    @action(detail=False, methods=['get'])
    def pending(self, request):
        pending_vets = VetProfile.objects.filter(is_verified=False)
        serializer = self.get_serializer(pending_vets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def verify(self, request, pk=None):
        vet = self.get_object()
        action_type = request.data.get('action')
        reason = request.data.get('reason', '')
        
        if action_type == 'approve':
            vet.is_verified = True
            vet.save()
            AuditLog.objects.create(
                user=request.user,
                event_type=AuditLog.EventType.SECURITY,
                action='VET_VERIFIED',
                model_name='VetProfile',
                object_id=str(vet.id),
                metadata={
                    'details': f"Admin {request.user.email} approved vet verification for {vet.user.email} (License: {vet.license_number})",
                    'vet_id': str(vet.id),
                    'vet_email': vet.user.email,
                    'license_number': vet.license_number,
                    'action': 'approve',
                    'reason': reason,
                }
            )
            return Response({'status': 'approved'})
        elif action_type == 'reject':
            vet.is_verified = False
            vet.save()
            AuditLog.objects.create(
                user=request.user,
                event_type=AuditLog.EventType.SECURITY,
                action='VET_REJECTED',
                model_name='VetProfile',
                object_id=str(vet.id),
                metadata={
                    'details': f"Admin {request.user.email} rejected vet verification for {vet.user.email} (License: {vet.license_number})",
                    'vet_id': str(vet.id),
                    'vet_email': vet.user.email,
                    'license_number': vet.license_number,
                    'action': 'reject',
                    'reason': reason,
                }
            )
            return Response({'status': 'rejected'})
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

class SupportTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SupportTicketSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'role', '') == 'ADMIN':
            return SupportTicket.objects.all().order_by('-created_at')
        return SupportTicket.objects.filter(raised_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        farm = get_user_farm(self.request.user)
        serializer.save(raised_by=self.request.user, farm=farm)

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        content = request.data.get('content', '')
        if not content or not str(content).strip():
            return Response(
                {'content': ['Message content cannot be empty.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        msg = TicketMessage.objects.create(ticket=ticket, sender=request.user, content=str(content).strip())
        return Response({'status': 'message sent', 'id': msg.id})

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = SystemLog.objects.all().order_by('-timestamp')
    serializer_class = SystemLogSerializer

class RecentOTPsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        cutoff = timezone.now() - timedelta(minutes=15)
        logs = AuditLog.objects.filter(
            action='OTP_REQUESTED',
            timestamp__gte=cutoff
        ).order_by('-timestamp')[:25]

        data = []
        for log in logs:
            meta = log.metadata or {}
            phone = meta.get('phone_number')
            otp = meta.get('otp_code')
            expires_at = meta.get('expires_at')
            if phone and otp:
                is_expired = False
                if expires_at:
                    try:
                        from datetime import datetime
                        is_expired = datetime.fromisoformat(expires_at) < timezone.now()
                    except Exception:
                        is_expired = False
                data.append({
                    'id': log.id,
                    'phone_number': phone,
                    'otp_code': otp,
                    'expires_at': expires_at,
                    'created_at': log.timestamp.isoformat(),
                    'is_expired': is_expired
                })
        return Response(data)
