"""
Coupons app serializers.
"""

from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for Coupon."""

    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'discount_percent', 'valid_from', 'valid_to',
            'active', 'is_valid', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_is_valid(self, obj):
        return obj.is_valid()


class ValidateCouponSerializer(serializers.Serializer):
    """Serializer for validating coupon."""

    code = serializers.CharField()

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code=value.upper())
            if not coupon.is_valid():
                raise serializers.ValidationError('Coupon has expired or is inactive.')
            return value.upper()
        except Coupon.DoesNotExist:
            raise serializers.ValidationError('Invalid coupon code.')
