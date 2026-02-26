"""
Coupons app admin registration.
"""

from django.contrib import admin
from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'valid_from', 'valid_to', 'active', 'created_at')
    list_filter = ('active',)
    search_fields = ('code',)
