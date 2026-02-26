"""
Products app URL configuration.
"""

from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailView,
    ProductImageCreateView,
    ProductImageDeleteView,
)

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('<slug:slug>/images/', ProductImageCreateView.as_view(), name='product-images'),
    path('<slug:slug>/images/<int:id>/', ProductImageDeleteView.as_view(), name='product-image-delete'),
]
