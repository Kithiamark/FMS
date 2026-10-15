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
from accounts.permissions import IsFarmer, IsAdmin, IsAggregator
from farms.models import Farm
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
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin | IsAggregator]

    def _farm(self):
        farm = get_user_farm(self.request.user)
        if not farm:
            user_role = getattr(self.request.user, 'role', '')
            if user_role == 'AGGREGATOR':
                farm, _ = Farm.objects.get_or_create(
                    owner=self.request.user,
                    defaults={'name': f"{self.request.user.full_name}'s Collection Hub"}
                )
            elif user_role == 'ADMIN' or self.request.user.is_staff or self.request.user.is_superuser:
                farm, _ = Farm.objects.get_or_create(
                    owner=self.request.user,
                    defaults={'name': f"{self.request.user.full_name}'s Admin Farm"}
                )
        return farm

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
        user_role = getattr(request.user, 'role', '')
        is_admin = user_role == 'ADMIN' or request.user.is_staff or request.user.is_superuser
        is_buyer = user_role == 'AGGREGATOR'
        buyer_plans = [Subscription.Plan.BUYER_STARTER, Subscription.Plan.BUYER_COMMERCIAL]

        if is_admin:
            filtered_catalog = PLAN_CATALOG
        elif is_buyer:
            filtered_catalog = {k: v for k, v in PLAN_CATALOG.items() if k in buyer_plans}
        else:
            # Regular farmers & farm workers: hide all buyer plans
            filtered_catalog = {k: v for k, v in PLAN_CATALOG.items() if k not in buyer_plans}

        return Response({
            'current': SubscriptionSerializer(subscription).data,
            'plans': filtered_catalog,
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
        mpesa_receipt = (request.data.get('mpesa_receipt') or request.data.get('mpesa_ref') or '').strip().upper()
        mode = request.data.get('mode', 'manual') # 'manual' or 'test'

        if plan not in PLAN_CATALOG or plan == Subscription.Plan.TRIAL:
            return Response({'error': 'Please select a valid tier.'}, status=400)

        # Enforce role plan eligibility
        user_role = getattr(request.user, 'role', '')
        is_admin = user_role == 'ADMIN' or request.user.is_staff or request.user.is_superuser
        is_buyer = user_role == 'AGGREGATOR'
        buyer_plans = [Subscription.Plan.BUYER_STARTER, Subscription.Plan.BUYER_COMMERCIAL]

        if not is_admin:
            if is_buyer and plan not in buyer_plans:
                return Response({'error': 'Selected plan is not valid for aggregator accounts.'}, status=400)
            if not is_buyer and plan in buyer_plans:
                return Response({'error': 'Milk buyer plans are only available for aggregator accounts.'}, status=400)

        # If user is admin or explicitly in test mode with no receipt
        is_test = mode == 'test' and is_admin

        if is_test:
            status_value = PaymentIntent.Status.TEST_APPROVED
            notes = 'Admin test mode activated subscription.'
            provider_ref = f"TEST-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        elif mpesa_receipt:
            status_value = PaymentIntent.Status.PENDING
            notes = f'Manual M-Pesa transaction submitted. Awaiting admin verification. Receipt: {mpesa_receipt}'
            provider_ref = mpesa_receipt
        else:
            status_value = PaymentIntent.Status.PENDING_KEYS
            notes = 'Awaiting payment confirmation.'
            provider_ref = ''

        intent = PaymentIntent.objects.create(
            farm=subscription.farm,
            subscription=subscription,
            plan=plan,
            amount_kes=PLAN_CATALOG[plan]['price_kes'],
            phone_number=phone_number,
            status=status_value,
            test_mode=is_test,
            provider_reference=provider_ref,
            notes=notes,
        )

        if is_test:
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
        elif mpesa_receipt:
            subscription.mpesa_ref = mpesa_receipt
            subscription.last_payment_mode = 'manual_mpesa'
            subscription.save(update_fields=['mpesa_ref', 'last_payment_mode'])

        AuditLog.objects.create(
            user=request.user,
            farm=subscription.farm,
            event_type=AuditLog.EventType.SUBSCRIPTION,
            action='CHECKOUT_SUBMITTED',
            model_name='PaymentIntent',
            object_id=str(intent.id),
            metadata={'plan': plan, 'amount_kes': intent.amount_kes, 'mpesa_ref': provider_ref, 'mode': mode},
        )

        message = (
            'Plan activated in admin test mode.' if is_test
            else f'M-Pesa payment reference {mpesa_receipt} submitted successfully! Your account will be activated upon verification.' if mpesa_receipt
            else 'Payment intent registered. Please submit your M-Pesa confirmation code.'
        )

        return Response({
            'subscription': SubscriptionSerializer(subscription).data,
            'payment': PaymentIntentSerializer(intent).data,
            'message': message,
        })
