"""
Coupons app models.
"""

from django.db import models


class Coupon(models.Model):
    """Discount coupon model."""

    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Coupon'
        verbose_name_plural = 'Coupons'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} - {self.discount_percent}%"

    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        return (
            self.active and
            self.valid_from <= now <= self.valid_to
        )
