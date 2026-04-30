from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExpenseViewSet, 
    IncomeViewSet, 
    SubscriptionViewSet,
    # FinanceReportView, 
    # MonthlyPDFReportView,
    # MpesaSTKPushView,
    # MpesaCallbackView
)

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'income', IncomeViewSet, basename='income')
router.register(r'subscription', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
    # path('finance/summary/', FinanceReportView.as_view(), name='finance_summary'),
    # path('finance/report/monthly/', MonthlyPDFReportView.as_view(), name='finance_monthly_report'),
    # path('mpesa/stk-push/', MpesaSTKPushView.as_view(), name='mpesa_stk_push'),
    # path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
]
