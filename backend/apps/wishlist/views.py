"""
Wishlist app views.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Wishlist, WishlistItem
from .serializers import WishlistSerializer


def get_or_create_wishlist(user):
    """Get or create wishlist for user."""
    wishlist, _ = Wishlist.objects.get_or_create(user=user)
    return wishlist


class WishlistView(generics.RetrieveAPIView):
    """Get wishlist."""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if getattr(self, 'swagger_fake_view', False):
            return Wishlist()
        return get_or_create_wishlist(self.request.user)


class AddToWishlistView(generics.GenericAPIView):
    """Add product to wishlist."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.products.models import Product
        if not Product.objects.filter(id=product_id, is_active=True).exists():
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist = get_or_create_wishlist(request.user)
        _, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            product_id=product_id
        )
        return Response(
            WishlistSerializer(wishlist).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class RemoveFromWishlistView(generics.GenericAPIView):
    """Remove product from wishlist."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        wishlist = get_or_create_wishlist(request.user)
        deleted, _ = WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).delete()
        if not deleted:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(WishlistSerializer(wishlist).data)
