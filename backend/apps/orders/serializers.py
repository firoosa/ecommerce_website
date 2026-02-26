"""
Orders app serializers.
"""

from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductListSerializer


class OrderUserSerializer(serializers.Serializer):
    """Lightweight user info for order responses (useful for Admin)."""

    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem."""

    product = ProductListSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'selected_size', 'selected_color', 'price', 'quantity', 'line_total')


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order."""

    items = OrderItemSerializer(many=True, read_only=True)
    user = OrderUserSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'total_amount', 'shipping_address',
            'payment_status', 'items', 'user', 'user_email', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'total_amount', 'created_at', 'updated_at')


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating order."""

    address_id = serializers.IntegerField()

    def validate_address_id(self, value):
        from apps.accounts.models import Address
        if not Address.objects.filter(id=value, user=self.context['request'].user).exists():
            raise serializers.ValidationError('Address not found.')
        return value
