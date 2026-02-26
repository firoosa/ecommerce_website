"""
Cart app models.
"""

from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.products.models import Product


class Cart(models.Model):
    """User cart - OneToOne with User."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'

    def __str__(self):
        return f"Cart - {self.user.email}"

    @property
    def subtotal(self):
        total = sum(item.line_total for item in self.items.all())
        return total if total else Decimal('0')

    @property
    def tax(self):
        tax_rate = Decimal(str(getattr(settings, 'TAX_RATE', 0.18)))
        return (self.subtotal * tax_rate).quantize(Decimal('0.01'))

    @property
    def total(self):
        return self.subtotal + self.tax


class CartItem(models.Model):
    """Cart item - product with quantity."""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    selected_size = models.CharField(max_length=50, blank=True, default='')
    selected_color = models.CharField(max_length=50, blank=True, default='')
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ['cart', 'product', 'selected_size', 'selected_color']

    def __str__(self):
        opts = []
        if self.selected_size:
            opts.append(f"size={self.selected_size}")
        if self.selected_color:
            opts.append(f"color={self.selected_color}")
        suffix = f" ({', '.join(opts)})" if opts else ""
        return f"{self.product.name}{suffix} x {self.quantity}"

    @property
    def line_total(self):
        price = self.product.effective_price
        return price * self.quantity
