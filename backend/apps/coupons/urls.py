"""
Coupons app URL configuration.
"""

from django.urls import path
from .views import CouponListCreateView, CouponDetailView, ValidateCouponView

urlpatterns = [
    path('', CouponListCreateView.as_view(), name='coupon-list'),
    path('validate/', ValidateCouponView.as_view(), name='coupon-validate'),
    path('<str:code>/', CouponDetailView.as_view(), name='coupon-detail'),
]
