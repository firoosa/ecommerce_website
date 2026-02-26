"""
Cart app views.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)


def get_or_create_cart(user):
    """Get or create cart for user."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(generics.RetrieveAPIView):
    """Get cart."""
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if getattr(self, 'swagger_fake_view', False):
            return Cart()
        return get_or_create_cart(self.request.user)


class AddToCartView(generics.GenericAPIView):
    """Add item to cart."""
    serializer_class = AddToCartSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_or_create_cart(request.user)
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        selected_size = serializer.validated_data.get('selected_size', '')
        selected_color = serializer.validated_data.get('selected_color', '')

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id,
            selected_size=selected_size,
            selected_color=selected_color,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class UpdateCartItemView(generics.GenericAPIView):
    """Update cart item quantity."""
    serializer_class = UpdateCartItemSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        cart = get_or_create_cart(request.user)
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(cart_item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        cart_item.quantity = serializer.validated_data['quantity']
        cart_item.save()

        return Response(CartSerializer(cart).data)


class RemoveCartItemView(generics.GenericAPIView):
    """Remove item from cart."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        cart = get_or_create_cart(request.user)
        deleted, _ = CartItem.objects.filter(id=item_id, cart=cart).delete()
        if not deleted:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CartSerializer(cart).data)
