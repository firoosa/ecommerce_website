"""
Reviews app serializers.
"""

from rest_framework import serializers
from .models import Review
from apps.accounts.serializers import UserProfileSerializer


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review."""

    user = UserProfileSerializer(read_only=True)
    # Product is always taken from the URL; don't require it in the payload
    product = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'product', 'rating', 'comment', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'product', 'created_at', 'updated_at')

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate(self, attrs):
        """
        Ensure a user can only review a product once.
        Product comes from URL (view.kwargs['product_id']) for creates.
        """
        user = self.context['request'].user

        # For updates, instance already has product
        if self.instance is not None:
            product = self.instance.product
        else:
            # For creates, resolve product from URL
            view = self.context.get('view')
            product = None
            if view is not None:
                product_id = view.kwargs.get('product_id')
                if product_id is not None:
                    from apps.products.models import Product
                    product = Product.objects.filter(id=product_id).first()

        if product and Review.objects.filter(user=user, product=product).exclude(
            pk=self.instance.pk if self.instance else None
        ).exists():
            raise serializers.ValidationError({'product': 'You have already reviewed this product.'})

        return attrs
