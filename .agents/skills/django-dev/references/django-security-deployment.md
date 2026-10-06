# Django Security & Production Deployment Guide

This guide establishes production-grade hardening, twelve-factor configuration standards, and deployment architecture for Django applications.

---

## 1. Twelve-Factor Settings Architecture

Never commit credentials, secret keys, or environment-specific values to version control. Load configurations from environment variables.

### Recommended `settings.py` Configuration Pattern
```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() in ("true", "1", "yes")

# Hosts & CSRF
ALLOWED_HOSTS = [host.strip() for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if origin.strip()]

# Database (PostgreSQL example)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "postgres"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "127.0.0.1"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "CONN_MAX_AGE": 600,  # Persistent connections
    }
}
```

---

## 2. Production Security Hardening

When deploying to production (`DEBUG = False`), enforce the following security headers:

```python
if not DEBUG:
    # HTTPS / SSL Enforcements
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Secure Cookies
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

    # HTTP Strict Transport Security (HSTS)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Content Security & Frame Protection
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
```

### Deployment Health Check Command
Always run Django's built-in deployment checker before going live:
```bash
python manage.py check --deploy
```

---

## 3. Static Files with WhiteNoise

In production, Django does not serve static files by default. WhiteNoise allows your WSGI application to serve static assets efficiently without complex Nginx static mappings.

### Installation & Setup
```bash
pip install whitenoise
```

In `settings.py`:
```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Must be right after SecurityMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    # ... other middlewares
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

# Django 4.2+ Storage configuration
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
```

Collect static assets during build:
```bash
python manage.py collectstatic --noinput
```

---

## 4. Production WSGI Server (Gunicorn)

Deploy Django using Gunicorn behind a reverse proxy (e.g., Nginx, Caddy, Cloudflare).

### Installation
```bash
pip install gunicorn
```

### Standard Gunicorn Execution
```bash
gunicorn config.wsgi:application \
    --workers 3 \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile - \
    --timeout 60
```

Formula for workers: `(2 * CPU_CORES) + 1`.

---

## 5. Deployment Pipeline Checklist

1. [ ] Install dependencies: `pip install -r requirements.txt`.
2. [ ] Apply database migrations: `python manage.py migrate --noinput`.
3. [ ] Compile/Collect static files: `python manage.py collectstatic --noinput`.
4. [ ] Run security validation: `python manage.py check --deploy`.
5. [ ] Launch WSGI process via supervisor/systemd/docker container.
