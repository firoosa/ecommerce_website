"""
Orders app URL configuration.
"""

from django.urls import path
from .views import OrderListCreateView, OrderDetailView, OrderEditToCartView

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/edit/', OrderEditToCartView.as_view(), name='order-edit-to-cart'),
]
