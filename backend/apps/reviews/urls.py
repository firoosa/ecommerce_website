"""
Reviews app URL configuration.
"""

from django.urls import path
from .views import ReviewListCreateView, ReviewDetailView

urlpatterns = [
    path('product/<int:product_id>/', ReviewListCreateView.as_view(), name='review-list'),
    path('<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
]
