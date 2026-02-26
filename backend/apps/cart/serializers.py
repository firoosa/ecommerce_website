"""
Cart app serializers.
"""

from rest_framework import serializers
from apps.products.serializers import ProductListSerializer
from .models import Cart, CartItem


def _split_option_string(value: str):
    if not value:
        return []
    raw = str(value).strip()
    if not raw:
        return []
    for delim in [',', '|', '/']:
        if delim in raw:
            parts = [p.strip() for p in raw.split(delim)]
            return [p for p in parts if p]
    return [raw]


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem."""

    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = (
            'id',
            'product',
            'product_id',
            'selected_size',
            'selected_color',
            'quantity',
            'line_total',
            'created_at',
            'updated_at',
        )


class CartSerializer(serializers.ModelSerializer):
    """Serializer for Cart with items."""

    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'items', 'subtotal', 'tax', 'total', 'created_at', 'updated_at')


class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding item to cart."""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    selected_size = serializers.CharField(required=False, allow_blank=True, default='')
    selected_color = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_product_id(self, value):
        from apps.products.models import Product
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Product not found.')
        return value

    def validate(self, attrs):
        from apps.products.models import Product

        product_id = attrs.get('product_id')
        selected_size = (attrs.get('selected_size') or '').strip()
        selected_color = (attrs.get('selected_color') or '').strip()

        product = Product.objects.filter(id=product_id, is_active=True).first()
        if not product:
            raise serializers.ValidationError({'product_id': 'Product not found.'})

        available_sizes = _split_option_string(getattr(product, 'size', ''))
        available_colors = _split_option_string(getattr(product, 'color', ''))

        # If there's exactly one option, auto-select for backwards compatibility.
        if not selected_size and len(available_sizes) == 1:
            selected_size = available_sizes[0]
        if not selected_color and len(available_colors) == 1:
            selected_color = available_colors[0]

        # If there are multiple options, require a selection.
        if len(available_sizes) > 1 and not selected_size:
            raise serializers.ValidationError({'selected_size': 'Please select a size.'})
        if len(available_colors) > 1 and not selected_color:
            raise serializers.ValidationError({'selected_color': 'Please select a color.'})

        # If selected, ensure it is allowed.
        if selected_size and available_sizes and selected_size not in available_sizes:
            raise serializers.ValidationError({'selected_size': 'Invalid size selection.'})
        if selected_color and available_colors and selected_color not in available_colors:
            raise serializers.ValidationError({'selected_color': 'Invalid color selection.'})

        attrs['selected_size'] = selected_size
        attrs['selected_color'] = selected_color
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity."""

    quantity = serializers.IntegerField(min_value=1)
