from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

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
        return request.user and request.user.is_staff

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_farmers = User.objects.filter(role='FARMER').count()
        total_vets = User.objects.filter(role='VETERINARIAN').count()
        total_animals = Animal.objects.count()
        
        active_subs = Subscription.objects.filter(is_active=True)
        sub_counts = {
            'basic': active_subs.filter(plan_type='BASIC').count(),
            'standard': active_subs.filter(plan_type='STANDARD').count(),
            'premium': active_subs.filter(plan_type='PREMIUM').count(),
            'enterprise': active_subs.filter(plan_type='ENTERPRISE').count(),
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
        target_user = self.get_object()
        
        SystemLog.objects.create(
            level=SystemLog.Level.WARNING,
            service=SystemLog.Service.API,
            message=f"Admin {request.user.email} impersonated {target_user.email}",
            user=request.user,
            ip_address=request.META.get('REMOTE_ADDR')
        )

        refresh = RefreshToken.for_user(target_user)
        refresh.set_exp(lifetime=timezone.timedelta(minutes=15))
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'warning': 'This token expires in 15 minutes. Financial operations restricted.'
        })

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
        
        if action_type == 'approve':
            vet.is_verified = True
            vet.save()
            return Response({'status': 'approved'})
        elif action_type == 'reject':
            return Response({'status': 'rejected'})
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

class SupportTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer

    @action(detail=True, methods=['post'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        content = request.data.get('content')
        TicketMessage.objects.create(ticket=ticket, sender=request.user, content=content)
        return Response({'status': 'message sent'})

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = SystemLog.objects.all().order_by('-timestamp')
    serializer_class = SystemLogSerializer
