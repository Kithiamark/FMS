from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import Expense, Income, PaymentIntent, Subscription
from .serializers import ExpenseSerializer, IncomeSerializer, PaymentIntentSerializer, PLAN_CATALOG, SubscriptionSerializer
from accounts.permissions import IsFarmer, IsAdmin
from core.models import AuditLog
from core.utils import get_user_farm

class ExpenseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Expense.objects.all()
        return Expense.objects.filter(farm=get_user_farm(user))

    def perform_create(self, serializer):
        serializer.save(farm=get_user_farm(self.request.user), recorded_by=self.request.user)

class IncomeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin]
    serializer_class = IncomeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Income.objects.all()
        return Income.objects.filter(farm=get_user_farm(user))

    def perform_create(self, serializer):
        serializer.save(farm=get_user_farm(self.request.user), recorded_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        farm = get_user_farm(request.user)
        today = timezone.now().date()
        year = int(request.query_params.get('year') or today.year)
        month = int(request.query_params.get('month') or today.month)
        incomes = Income.objects.filter(farm=farm, date__year=year, date__month=month)
        expenses = Expense.objects.filter(farm=farm, date__year=year, date__month=month)
        income_total = incomes.aggregate(total=Sum('amount_kes'))['total'] or 0
        expense_total = expenses.aggregate(total=Sum('amount_kes'))['total'] or 0
        expense_by_category = (
            expenses
            .values('category')
            .annotate(total=Sum('amount_kes'))
            .order_by('-total')
        )
        income_by_source = (
            incomes
            .values('source')
            .annotate(total=Sum('amount_kes'))
            .order_by('-total')
        )
        return Response({
            'year': year,
            'month': month,
            'income_total': income_total,
            'expense_total': expense_total,
            'net_total': income_total - expense_total,
            'expense_by_category': list(expense_by_category),
            'income_by_source': list(income_by_source),
            'recent_income': IncomeSerializer(incomes.order_by('-date', '-created_at')[:8], many=True).data,
            'recent_expenses': ExpenseSerializer(expenses.order_by('-date', '-created_at')[:8], many=True).data,
        })


class SubscriptionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin]

    def _farm(self):
        return get_user_farm(self.request.user)

    def _ensure_subscription(self):
        farm = self._farm()
        subscription, created = Subscription.objects.get_or_create(
            farm=farm,
            defaults={
                'plan': Subscription.Plan.TRIAL,
                'status': Subscription.Status.ACTIVE,
                'start_date': timezone.now().date(),
                'end_date': timezone.now().date() + timedelta(days=30),
                'trial_ends_at': timezone.now().date() + timedelta(days=30),
                'features_snapshot': PLAN_CATALOG[Subscription.Plan.TRIAL],
            },
        )
        if created:
            AuditLog.objects.create(
                user=self.request.user,
                farm=farm,
                event_type=AuditLog.EventType.SUBSCRIPTION,
                action='TRIAL_STARTED',
                model_name='Subscription',
                object_id=str(subscription.id),
                metadata={'plan': subscription.plan},
            )
        return subscription

    def list(self, request):
        subscription = self._ensure_subscription()
        return Response({
            'current': SubscriptionSerializer(subscription).data,
            'plans': PLAN_CATALOG,
            'test_mode': not all([
                getattr(settings, 'MPESA_CONSUMER_KEY', ''),
                getattr(settings, 'MPESA_CONSUMER_SECRET', ''),
                getattr(settings, 'MPESA_SHORTCODE', ''),
                getattr(settings, 'MPESA_PASSKEY', ''),
            ]),
            'notes': 'Payments run in test mode until M-Pesa credentials are configured.',
        })

    @action(detail=False, methods=['post'], url_path='checkout')
    def checkout(self, request):
        subscription = self._ensure_subscription()
        plan = request.data.get('plan')
        phone_number = request.data.get('phone_number', '')
        if plan not in PLAN_CATALOG or plan == Subscription.Plan.TRIAL:
            return Response({'error': 'Choose Basic, Premium, or Enterprise.'}, status=400)

        test_mode = bool(request.data.get('test_mode', True)) or not all([
            getattr(settings, 'MPESA_CONSUMER_KEY', ''),
            getattr(settings, 'MPESA_CONSUMER_SECRET', ''),
            getattr(settings, 'MPESA_SHORTCODE', ''),
            getattr(settings, 'MPESA_PASSKEY', ''),
        ])
        status_value = PaymentIntent.Status.TEST_APPROVED if test_mode else PaymentIntent.Status.PENDING_KEYS
        intent = PaymentIntent.objects.create(
            farm=subscription.farm,
            subscription=subscription,
            plan=plan,
            amount_kes=PLAN_CATALOG[plan]['price_kes'],
            phone_number=phone_number,
            status=status_value,
            test_mode=test_mode,
            provider_reference=f"TEST-{timezone.now().strftime('%Y%m%d%H%M%S')}" if test_mode else '',
            notes='Test mode activated subscription without contacting M-Pesa.' if test_mode else 'Waiting for real M-Pesa API integration.',
        )

        if test_mode:
            today = timezone.now().date()
            subscription.plan = plan
            subscription.status = Subscription.Status.ACTIVE
            subscription.start_date = today
            subscription.end_date = today + timedelta(days=30)
            subscription.amount_kes = PLAN_CATALOG[plan]['price_kes']
            subscription.last_payment_mode = 'test'
            subscription.features_snapshot = PLAN_CATALOG[plan]
            subscription.mpesa_ref = intent.provider_reference
            subscription.save()
            intent.completed_at = timezone.now()
            intent.save(update_fields=['completed_at'])

        AuditLog.objects.create(
            user=request.user,
            farm=subscription.farm,
            event_type=AuditLog.EventType.SUBSCRIPTION,
            action='CHECKOUT_CREATED',
            model_name='PaymentIntent',
            object_id=str(intent.id),
            metadata={'plan': plan, 'amount_kes': intent.amount_kes, 'test_mode': test_mode},
        )
        return Response({
            'subscription': SubscriptionSerializer(subscription).data,
            'payment': PaymentIntentSerializer(intent).data,
            'message': 'Test payment approved and plan activated.' if test_mode else 'Payment intent created. Add M-Pesa keys to complete live checkout.',
        })
