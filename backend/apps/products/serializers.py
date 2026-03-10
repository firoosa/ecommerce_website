"""
Products app serializers.
"""

from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant
from apps.categories.serializers import CategoryListSerializer


def _split_option_string(value: str):
    """
    Normalize a size/color string into a list.

    Supports:
    - Comma separated: "S, M, L"
    - Slash separated: "Red/Blue"
    - Pipe separated: "Red | Blue"
    """
    if not value:
        return []
    raw = str(value).strip()
    if not raw:
        return []

    # Pick a delimiter if present, otherwise single value
    for delim in [',', '|', '/']:
        if delim in raw:
            parts = [p.strip() for p in raw.split(delim)]
            return [p for p in parts if p]
    return [raw]


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage."""

    class Meta:
        model = ProductImage
        fields = ('id', 'image')

    def to_representation(self, instance):
        """
        Return absolute URL for image while still allowing uploads via the 'image' field.
        """
        rep = super().to_representation(instance)
        try:
            if not instance.image or not getattr(instance.image, 'name', None):
                rep['image'] = None
                return rep

            url = instance.image.url
            request = self.context.get('request')
            rep['image'] = request.build_absolute_uri(url) if request else url
            return rep
        except ValueError:
            # Handles: "The 'image' attribute has no file associated with it."
            rep['image'] = None
            return rep


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for ProductVariant - mainly for admin / detailed views."""

    class Meta:
        model = ProductVariant
        fields = ("id", "size", "color", "stock")


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists."""

    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    available_sizes = serializers.SerializerMethodField()
    available_colors = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'price', 'discount_price', 'effective_price',
            'stock', 'brand', 'age_group', 'is_featured', 'category', 'category_name',
            'size', 'color', 'available_sizes', 'available_colors',
            'primary_image', 'images', 'created_at'
        )

    def get_primary_image(self, obj):
        # Pick the first valid image that has an associated file
        for img in obj.images.all():
            if not img.image or not getattr(img.image, 'name', None):
                continue
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(img.image.url)
                return img.image.url
            except ValueError:
                # Skip invalid/missing file references
                continue
        return None

    def get_available_sizes(self, obj):
        sizes = _split_option_string(getattr(obj, 'size', ''))
        # If product.size is empty but variants exist, get sizes from variants
        if not sizes:
            variant_sizes = set(
                ProductVariant.objects.filter(product=obj)
                .exclude(size='')
                .values_list('size', flat=True)
                .distinct()
            )
            if variant_sizes:
                sizes = sorted(variant_sizes)
        return sizes

    def get_available_colors(self, obj):
        colors = _split_option_string(getattr(obj, 'color', ''))
        # If product.color is empty but variants exist, get colors from variants
        if not colors:
            variant_colors = set(
                ProductVariant.objects.filter(product=obj)
                .exclude(color='')
                .values_list('color', flat=True)
                .distinct()
            )
            if variant_colors:
                colors = sorted(variant_colors)
        return colors


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for product detail."""

    category = CategoryListSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    available_sizes = serializers.SerializerMethodField()
    available_colors = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description', 'price', 'discount_price', 'effective_price',
            'stock', 'brand', 'age_group', 'size', 'color', 'material', 'is_featured',
            'available_sizes', 'available_colors', 'variants',
            'category', 'images', 'is_active', 'created_at', 'updated_at'
        )

    def get_available_sizes(self, obj):
        sizes = _split_option_string(getattr(obj, 'size', ''))
        # If product.size is empty but variants exist, get sizes from variants
        if not sizes:
            variant_sizes = set(
                ProductVariant.objects.filter(product=obj)
                .exclude(size='')
                .values_list('size', flat=True)
                .distinct()
            )
            if variant_sizes:
                sizes = sorted(variant_sizes)
        return sizes

    def get_available_colors(self, obj):
        colors = _split_option_string(getattr(obj, 'color', ''))
        # If product.color is empty but variants exist, get colors from variants
        if not colors:
            variant_colors = set(
                ProductVariant.objects.filter(product=obj)
                .exclude(color='')
                .values_list('color', flat=True)
                .distinct()
            )
            if variant_colors:
                colors = sorted(variant_colors)
        return colors


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products."""

    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )
    # Nested variant data when product is created/updated via JSON
    variants = ProductVariantSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Product
        fields = (
            'name', 'slug', 'description', 'price', 'discount_price', 'stock',
            'brand', 'age_group', 'size', 'color', 'material', 'is_featured',
            'category', 'is_active', 'images', 'variants'
        )
        extra_kwargs = {'slug': {'required': False}}

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        variants_data = validated_data.pop('variants', [])
        product = super().create(validated_data)

        # Create images
        for img in images:
            ProductImage.objects.create(product=product, image=img)

        # Create variants
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)

        return product

    def update(self, instance, validated_data):
        images = validated_data.pop('images', [])
        variants_data = validated_data.pop('variants', None)
        product = super().update(instance, validated_data)

        # Create images
        for img in images:
            ProductImage.objects.create(product=product, image=img)

        # Update variants if provided
        if variants_data is not None:
            ProductVariant.objects.filter(product=product).delete()
            for variant_data in variants_data:
                ProductVariant.objects.create(product=product, **variant_data)

        return product
