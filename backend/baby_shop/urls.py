"""
URL configuration for baby_shop project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from collections import OrderedDict

# Patch drf_yasg to handle duplicate parameters (keep first occurrence)
def _patched_param_list_to_odict(parameters):
    """Deduplicate parameters by (name, in) - keep first occurrence."""
    result = OrderedDict()
    for param in parameters:
        key = (param.name, param.in_)
        if key not in result:
            result[key] = param
    return result

import drf_yasg.utils as yasg_utils
yasg_utils.param_list_to_odict = _patched_param_list_to_odict

schema_view = get_schema_view(
    openapi.Info(
        title="Baby Store API",
        default_version='v1',
        description="API documentation for Newborn Baby eCommerce platform",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@babystore.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('baby_shop.api_urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

