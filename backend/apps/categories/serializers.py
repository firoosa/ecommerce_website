"""
Categories app serializers.
"""

from rest_framework import serializers
from django.db import IntegrityError
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""

    children = serializers.SerializerMethodField()
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
        error_messages={'does_not_exist': 'Category with this id does not exist. Create parent categories first, or omit for top-level.'}
    )

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'slug', 'image', 'parent',
            'is_active', 'created_at', 'updated_at', 'children'
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError as e:
            if 'slug' in str(e):
                raise serializers.ValidationError(
                    {'slug': 'A category with this name already exists. Choose a different name.'}
                )
            raise

    def get_children(self, obj):
        if obj.children.filter(is_active=True).exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


class CategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for category lists."""

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'image', 'parent', 'is_active')
