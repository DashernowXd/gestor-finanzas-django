"""
URL configuration for Personal Finance API.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from config.views import HealthCheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Authentication & User Management
    path("api/v1/auth/", include("accounts.urls")),
    # Financial Core (Categories & Transactions)
    path("api/v1/", include("finance.urls")),
    # Infrastructure & Monitoring
    path("api/v1/health/", HealthCheckView.as_view(), name="health-check"),
    # OpenAPI Schema & Interactive Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
