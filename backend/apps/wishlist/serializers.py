"""
Wishlist app serializers.
"""

from rest_framework import serializers
from apps.products.serializers import ProductListSerializer
from .models import Wishlist, WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    """Serializer for WishlistItem."""

    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'product_id', 'created_at')


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for Wishlist."""

    items = WishlistItemSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'items', 'created_at', 'updated_at')
