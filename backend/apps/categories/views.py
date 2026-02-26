"""
Categories app views.
"""

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category
from .serializers import CategorySerializer, CategoryListSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    """List and create categories (Admin only for create)."""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parent']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CategorySerializer
        return CategoryListSerializer

    def get_queryset(self):
        qs = Category.objects.filter(is_active=True)
        if self.request.query_params.get('parent_only'):
            return qs.filter(parent__isnull=True)
        return qs


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Category detail - Get, update, delete."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]
