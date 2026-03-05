"""
Products app admin registration.
"""

from django.contrib import admin
from .models import Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    min_num = 0
    fields = ("size", "color", "stock")
    verbose_name = "Variant"
    verbose_name_plural = "Variants"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category', 'price', 'stock', 'is_featured', 'is_active', 'created_at')
    list_filter = ('category', 'age_group', 'is_featured', 'is_active')
    search_fields = ('name', 'slug', 'brand')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductVariantInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image')


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'size', 'color', 'stock')
    list_filter = ('product', 'size', 'color')
    search_fields = ('product__name', 'size', 'color')
    raw_id_fields = ('product',)
    list_select_related = ('product',)
    fields = ('product', 'size', 'color', 'stock')
