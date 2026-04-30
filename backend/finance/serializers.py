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

    def get_feature_list(self, obj):
        return obj.features_snapshot.get('features', [])

    def get_monthly_price_kes(self, obj):
        return PLAN_CATALOG[obj.plan]['price_kes']

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
            'One month of data entry to train the farm learning profile',
            'Milk, herd, finance, and alert logging',
            'Basic dashboard summaries',
            'Upgrade prompts when AI or vet features need a paid tier',
        ],
    },
    Subscription.Plan.BASIC: {
        'price_kes': 500,
        'name': 'Basic',
        'features': [
            'Vet ratings, direct call, booking, and texting',
            'Better AI production and health analysis',
            'Farmer communities for county trends, alerts, and dairy prices',
            'SMS and in-app notifications',
        ],
    },
    Subscription.Plan.PREMIUM: {
        'price_kes': 1000,
        'name': 'Premium',
        'features': [
            'Everything in Basic',
            'Personalised newsletters',
            'Weather-aware routines',
            'Breed tips and personal vet sections',
            'Deeper AI recommendations from farm history',
        ],
    },
    Subscription.Plan.ENTERPRISE: {
        'price_kes': 2000,
        'name': 'Enterprise',
        'features': [
            'Everything in Premium',
            'Head farmer admin account',
            'Worker accounts for activity logging',
            'Team oversight and farm activity audit trails',
            'Large-farm operating view',
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
