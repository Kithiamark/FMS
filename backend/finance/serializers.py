from rest_framework import serializers
from .models import Expense, Income, PaymentIntent, Subscription, MpesaTransaction

class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('farm', 'recorded_by')

class IncomeSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ('farm', 'recorded_by')

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_label = serializers.CharField(source='get_plan_display', read_only=True)
    feature_list = serializers.SerializerMethodField()
    monthly_price_kes = serializers.SerializerMethodField()
    effective_end_date = serializers.DateField(read_only=True)
    is_sabbath_active = serializers.SerializerMethodField()
    is_in_grace_period = serializers.BooleanField(read_only=True)
    is_data_logging_only = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = (
            'farm',
            'status',
            'start_date',
            'end_date',
            'trial_ends_at',
            'features_snapshot',
            'mpesa_ref',
            'mpesa_checkout_id',
        )

    def get_is_sabbath_active(self, obj):
        return Subscription.is_sabbath_window()

    def get_feature_list(self, obj):
        if obj.features_snapshot and 'features' in obj.features_snapshot:
            return obj.features_snapshot.get('features', [])
        return PLAN_CATALOG.get(obj.plan, {}).get('features', [])

    def get_monthly_price_kes(self, obj):
        return PLAN_CATALOG.get(obj.plan, {}).get('price_kes', 0)

class MpesaTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaTransaction
        fields = '__all__'
        read_only_fields = ('farm', 'result_code', 'result_desc', 'mpesa_receipt', 'completed_at')


PLAN_CATALOG = {
    Subscription.Plan.TRIAL: {
        'price_kes': 0,
        'name': 'Free first month',
        'features': [
            'One month full trial to train the farm learning profile',
            'Daily milk yield and herd record logging',
            'Expenses, revenues, and cashflow tracking',
            'Full AI assistant and vet directory access during trial',
        ],
    },
    Subscription.Plan.BASIC: {
        'price_kes': 750,
        'name': 'Basic',
        'features': [
            'Unlimited milk, herd, and financial record logging',
            'Direct vet consultation requests, texting, and reviews',
            'AI herd production & disease risk advisory',
            'County community dairy trends and milk pricing alerts',
        ],
    },
    Subscription.Plan.PREMIUM: {
        'price_kes': 1500,
        'name': 'Premium',
        'features': [
            'Everything in Basic',
            'Personalised breeding and lactation optimization tips',
            'Weather-aware herd management routines',
            'Automated SMS notifications and vaccination reminders',
            'Deeper AI diagnostic recommendations from historical yields',
        ],
    },
    Subscription.Plan.ENTERPRISE: {
        'price_kes': 3000,
        'name': 'Enterprise',
        'features': [
            'Everything in Premium',
            'Multi-user farm management with worker sub-accounts',
            'Worker activity logging and audit trail controls',
            'Commercial bulk reporting and exportable tax ledgers',
            'Dedicated agricultural support desk',
        ],
    },
    Subscription.Plan.BUYER_STARTER: {
        'price_kes': 3500,
        'name': 'Milk Buyer Starter Route',
        'features': [
            'Single collection route and chilling station management',
            'Digital milk intake logging and supplier farmer directory',
            'Automated milk collection SMS receipts for farmers',
            'Lactometer and quality rejection recording',
        ],
    },
    Subscription.Plan.BUYER_COMMERCIAL: {
        'price_kes': 7500,
        'name': 'Milk Buyer Commercial Co-op',
        'features': [
            'Multi-route collection and bulk chilling tank tracking',
            'Batch quality, density, and fat testing ledger',
            'Automated M-Pesa farmer payroll and payout export files',
            'Unlimited supplier farmers and cooperative dispatch manifests',
        ],
    },
}


class PaymentIntentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentIntent
        fields = '__all__'
        read_only_fields = (
            'farm',
            'subscription',
            'amount_kes',
            'status',
            'provider',
            'test_mode',
            'checkout_request_id',
            'provider_reference',
            'notes',
            'completed_at',
        )
