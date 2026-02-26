"""
Payments app URL configuration.
"""

from django.urls import path
from .views import CreateRazorpayOrderView, VerifyRazorpayPaymentView

urlpatterns = [
    path('razorpay/create-order/', CreateRazorpayOrderView.as_view(), name='razorpay-create-order'),
    path('razorpay/verify/', VerifyRazorpayPaymentView.as_view(), name='razorpay-verify'),
]
