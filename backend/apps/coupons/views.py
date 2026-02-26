"""
Coupons app views.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import Coupon
from .serializers import CouponSerializer, ValidateCouponSerializer


class CouponListCreateView(generics.ListCreateAPIView):
    """List and create coupons (Admin only for create)."""
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]


class CouponDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Coupon detail."""
    serializer_class = CouponSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'code'
    lookup_url_kwarg = 'code'

    def get_queryset(self):
        return Coupon.objects.all()

    def get_object(self):
        code = self.kwargs.get(self.lookup_url_kwarg, '')
        return Coupon.objects.get(code__iexact=code)


class ValidateCouponView(generics.GenericAPIView):
    """Validate coupon and return discount info."""
    serializer_class = ValidateCouponSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        coupon = Coupon.objects.get(code=code)
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_percent': float(coupon.discount_percent),
        })
