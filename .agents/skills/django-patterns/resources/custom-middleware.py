"""
Custom Middleware Boilerplate for Django:
- ActiveUserMiddleware: Updates the user's last_active timestamp on authenticated requests.
- RequestLoggingMiddleware: Measures execution time and logs HTTP requests.
"""

import time
import logging
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("django.request")


class ActiveUserMiddleware(MiddlewareMixin):
    """
    Tracks user activity by updating last_active timestamp on authenticated requests.
    Requires a `last_active` DateTimeField on your User or Profile model.
    """

    def process_request(self, request):
        if request.user.is_authenticated:
            now = timezone.now()
            # To minimize DB writes, only update if last active was > 5 minutes ago
            last = getattr(request.user, "last_active", None)
            if not last or (now - last).total_seconds() > 300:
                request.user.last_active = now
                request.user.save(update_fields=["last_active"])


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware that captures and logs response duration and status code.
    """

    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, "_start_time"):
            duration = time.time() - request._start_time
            logger.info(
                f"{request.method} {request.get_full_path()} - {response.status_code} ({duration:.3f}s)"
            )
        return response
