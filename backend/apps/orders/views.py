"""
Orders app views.
"""

from decimal import Decimal
from django.conf import settings
from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer
from apps.cart.models import Cart, CartItem
from apps.products.models import ProductVariant


class OrderListCreateView(generics.ListCreateAPIView):
    """List and create orders."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = []  # Disable for schema compatibility

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()
        # Hide cancelled orders from normal listings
        qs = Order.objects.exclude(status=Order.Status.CANCELLED).prefetch_related('items__product').select_related('user')
        # Admin sees all non-cancelled orders; customers see only their own non-cancelled orders
        if getattr(self.request.user, 'role', None) == 'Admin' or self.request.user.is_staff:
            return qs
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        return OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address_id = serializer.validated_data['address_id']

        from apps.accounts.models import Address
        try:
            address = Address.objects.get(id=address_id, user=request.user)
        except Address.DoesNotExist:
            return Response(
                {'error': 'Address not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        shipping_address = f"{address.full_address}, {address.city}, {address.state} - {address.pincode}"

        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate stock before creating anything (variant-aware)
        variant_cache = {}
        for cart_item in cart.items.select_related('product').all():
            key = (
                cart_item.product_id,
                (cart_item.selected_size or '').strip(),
                (cart_item.selected_color or '').strip(),
            )
            variant = None
            if key not in variant_cache:
                variant = ProductVariant.objects.filter(
                    product_id=cart_item.product_id,
                    size=key[1],
                    color=key[2],
                ).first()
                variant_cache[key] = variant
            else:
                variant = variant_cache[key]

            if variant:
                if variant.stock < cart_item.quantity:
                    return Response(
                        {
                            'error': (
                                f'Insufficient stock for {cart_item.product.name} '
                                f'({key[2] or "any color"} - {key[1] or "any size"}). '
                                f'Available: {variant.stock}'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                # Fallback to product-level stock
                if cart_item.product.stock < cart_item.quantity:
                    return Response(
                        {
                            'error': (
                                f'Insufficient stock for {cart_item.product.name}. '
                                f'Available: {cart_item.product.stock}'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # Create order
        order = Order.objects.create(
            user=request.user,
            shipping_address=shipping_address,
            status=Order.Status.PENDING,
            payment_status=Order.PaymentStatus.PENDING
        )

        total = Decimal('0')
        tax_rate = getattr(settings, 'TAX_RATE', 0.18)

        for cart_item in cart.items.select_related('product').all():
            price = cart_item.product.effective_price
            quantity = cart_item.quantity
            v_key = (
                cart_item.product_id,
                (cart_item.selected_size or '').strip(),
                (cart_item.selected_color or '').strip(),
            )
            variant = variant_cache.get(v_key)

            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                price=price,
                quantity=quantity,
                selected_size=getattr(cart_item, 'selected_size', '') or '',
                selected_color=getattr(cart_item, 'selected_color', '') or '',
            )
            total += price * quantity

            # Reduce stock - prioritize variant stock if available
            if variant:
                variant.stock -= quantity
                variant.save(update_fields=['stock'])
            else:
                cart_item.product.stock -= quantity
                cart_item.product.save(update_fields=['stock'])

        order.total_amount = total + (total * Decimal(str(tax_rate)))
        order.save(update_fields=['total_amount'])

        # Clear cart
        cart.items.all().delete()

        return Response(
            OrderSerializer(order, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class OrderDetailView(generics.RetrieveUpdateAPIView):
    """Order detail and status update (admin only for updates)."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()
        qs = Order.objects.all().prefetch_related('items__product').select_related('user')
        # Admin sees all orders; customers see only their own
        if getattr(self.request.user, 'role', None) == 'Admin' or self.request.user.is_staff:
            return qs
        return qs.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        # Only admin/staff can update order (e.g., change status or payment_status)
        if not (getattr(request.user, 'role', None) == 'Admin' or request.user.is_staff):
            return Response(
                {'detail': 'You do not have permission to update orders.'},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = True  # allow PATCH-style partial updates
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class OrderEditToCartView(generics.GenericAPIView):
    """
    Allow a customer to move a pending order back to their cart for editing.

    - Only the owner of the order can do this
    - Only allowed while status is Pending
    - Restores product stock and recreates cart items
    """

    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def post(self, request, *args, **kwargs):
        order_id = kwargs.get('pk')
        try:
            order = Order.objects.prefetch_related('items__product').get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != Order.Status.PENDING:
            return Response(
                {'detail': 'Only pending orders can be edited.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Restore stock (variant-aware)
            for item in order.items.select_related('product').all():
                size = (getattr(item, 'selected_size', '') or '').strip()
                color = (getattr(item, 'selected_color', '') or '').strip()
                variant = ProductVariant.objects.filter(
                    product=item.product, size=size, color=color
                ).first()
                if variant:
                    variant.stock += item.quantity
                    variant.save(update_fields=['stock'])
                else:
                    product = item.product
                    product.stock += item.quantity
                    product.save(update_fields=['stock'])

            # Rebuild cart
            cart, _ = Cart.objects.get_or_create(user=request.user)
            # Clear existing items so the cart exactly matches this order
            cart.items.all().delete()

            for item in order.items.select_related('product').all():
                CartItem.objects.create(
                    cart=cart,
                    product=item.product,
                    quantity=item.quantity,
                    selected_size=getattr(item, 'selected_size', '') or '',
                    selected_color=getattr(item, 'selected_color', '') or '',
                )

            # Cancel the old order
            order.status = Order.Status.CANCELLED
            order.save(update_fields=['status'])

        return Response(
            {
                'detail': 'Order moved back to cart for editing.',
                'order_id': order.id,
            },
            status=status.HTTP_200_OK,
        )
