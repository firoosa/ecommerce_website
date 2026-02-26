"""
WSGI config for baby_shop project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'baby_shop.settings')

application = get_wsgi_application()
