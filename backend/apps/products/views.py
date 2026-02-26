"""
Products app views.
"""

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Product, ProductImage
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductImageSerializer,
)
from .filters import ProductFilter


class ProductListCreateView(generics.ListCreateAPIView):
    """List products with filtering, search, ordering. Create product (Admin)."""
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'brand']
    ordering_fields = ['price', 'created_at', '-price', '-created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateUpdateSerializer
        return ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('category').prefetch_related('images')


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Product detail - Get, update, delete."""
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    queryset = Product.objects.all().select_related('category').prefetch_related('images')
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer


class ProductImageCreateView(generics.CreateAPIView):
    """Add image to product (Admin only)."""
    parser_classes = [FormParser, MultiPartParser]
    serializer_class = ProductImageSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        product = Product.objects.get(slug=self.kwargs['slug'])
        serializer.save(product=product)


class ProductImageDeleteView(generics.DestroyAPIView):
    """Delete product image (Admin only)."""
    permission_classes = [IsAdminUser]
    lookup_field = 'id'

    def get_queryset(self):
        # Ensure we can only delete images that belong to the product in the URL
        return ProductImage.objects.filter(product__slug=self.kwargs['slug'])
