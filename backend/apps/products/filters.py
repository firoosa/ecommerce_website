"""
Products app filters.
"""

import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Filter for Product model."""

    category = django_filters.NumberFilter(field_name='category__id')
    category_slug = django_filters.CharFilter(field_name='category__slug')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    age_group = django_filters.CharFilter(field_name='age_group')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Product
        fields = ['category', 'age_group', 'is_featured']

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(name__icontains=value)
        return queryset
