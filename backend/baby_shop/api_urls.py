"""
API URL routing for baby_shop project.
"""

from django.urls import path, include

urlpatterns = [
    path('accounts/', include('apps.accounts.urls')),
    path('categories/', include('apps.categories.urls')),
    path('products/', include('apps.products.urls')),
    path('cart/', include('apps.cart.urls')),
    path('orders/', include('apps.orders.urls')),
    path('reviews/', include('apps.reviews.urls')),
    path('wishlist/', include('apps.wishlist.urls')),
    path('coupons/', include('apps.coupons.urls')),
    path('payments/', include('apps.payments.urls')),
]
