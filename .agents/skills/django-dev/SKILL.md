---
name: django-dev
description: >-
  Use this skill when developing, structuring, configuring, or debugging Django projects and applications, including models, ORM queries, views (FBV/CBV), templates, forms, Django Admin, authentication, REST APIs with DRF, testing, security, and deployment.
---

# Django Development & Architecture Runbook

## Overview
This skill provides an authoritative, production-grade guide for developing, maintaining, and debugging applications with the **Django** framework (Python). It covers project scaffolding, ORM schema design and query optimization, view architectures (FBV/CBV), templates, secure form handling, Django Admin, authentication, REST APIs with Django REST Framework (DRF), automated testing, and Twelve-Factor production deployment.

## Prerequisites
- Python 3.10+ and package manager (`pip` or `poetry`).
- Virtual environment active (`venv` or `.venv`).
- PowerShell 5.1+ / Core (for configuration audit scripts).

## Directory Structure
- [references/django-orm-queries.md](./references/django-orm-queries.md): Deep guide to model definition, indexes, N+1 query elimination (`select_related`, `prefetch_related`), Q/F expressions, and atomic transactions.
- [references/django-security-deployment.md](./references/django-security-deployment.md): Production checklist, environment-driven settings, WhiteNoise static files, and Gunicorn WSGI deployment.
- [references/django-troubleshooting.md](./references/django-troubleshooting.md): Diagnostic matrix for solving common exceptions (`OperationalError`, `TemplateDoesNotExist`, `IntegrityError`, CSRF, migration conflicts).
- [examples/models-and-views.py](./examples/models-and-views.py): End-to-end reference implementation of models, forms, FBVs, generic CBVs, and ModelAdmin.
- [examples/settings-production.py](./examples/settings-production.py): Twelve-factor production settings module with database and security hardening.
- [resources/django-quick-reference.md](./resources/django-quick-reference.md): Command cheat sheet for `manage.py`, ORM lookup operators, and template tags.
- [resources/drf-api-template.py](./resources/drf-api-template.py): Ready-to-use boilerplate for DRF Serializers, ModelViewSets, and URL routers.
- [scripts/verify-django-setup.ps1](./scripts/verify-django-setup.ps1): Automated auditor for Django project settings and security hygiene.

---

## Step-by-Step Procedure

### 1. Project Initialization & App Scaffolding
1. **Initialize Virtual Environment & Dependencies**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   pip install django djangorestframework whitenoise
   ```
2. **Scaffold Project Directory**:
   ```bash
   django-admin startproject config .
   python manage.py startapp core
   ```
3. **Register App in `settings.py`**:
   Add `"core.apps.CoreConfig"` (or `"core"`) to `INSTALLED_APPS`.
4. **Custom User Model (Critical)**:
   If starting a new project, always configure a custom user model inheriting from `AbstractUser` before the first migration:
   ```python
   # core/models.py
   from django.contrib.auth.models import AbstractUser
   class Usuario(AbstractUser):
       pass

   # config/settings.py
   AUTH_USER_MODEL = "core.Usuario"
   ```

### 2. Models & ORM Schema Design
1. **Model Definition**:
   - Use `TextChoices` or `IntegerChoices` for status/category fields.
   - Always define `__str__()` and `ordering` in `class Meta`.
   - Specify explicit `related_name` and `on_delete` for all ForeignKeys (prefer `CASCADE` or `SET_NULL`).
   - Add database indexes (`models.Index`) for frequently filtered or slug fields.
2. **Migrations Lifecycle**:
   - Inspect changes: `python manage.py makemigrations core`.
   - Review SQL generated: `python manage.py sqlmigrate core 0001`.
   - Apply migrations: `python manage.py migrate`.
   - For merge conflicts across branches: `python manage.py makemigrations --merge`.
3. **Prevent N+1 Queries**:
   - Use `.select_related("foreign_key_field")` for single-valued relationships (ForeignKey, OneToOne).
   - Use `.prefetch_related("m2m_or_reverse_fk")` for multi-valued relationships.

### 3. Views & URL Routing
1. **Choose View Paradigm**:
   - **Function-Based Views (FBV)**: Ideal for custom endpoints, simple redirects, or non-standard flows.
   - **Class-Based Views (CBV)**: Ideal for standard CRUD operations (`ListView`, `DetailView`, `CreateView`, `UpdateView`, `DeleteView`).
2. **Namespaced URL Routing**:
   Define `app_name = "core"` in `core/urls.py` and include it in `config/urls.py`:
   ```python
   # config/urls.py
   path("productos/", include("core.urls", namespace="core")),
   ```
   Reference named URLs dynamically: `{% url 'core:detalle' producto.slug %}` or `reverse("core:lista")`.

### 4. Templates & Forms
1. **Template Inheritance**:
   Create a root `templates/base.html` with `{% block content %}{% endblock %}` and extend it in app templates.
2. **Form Validation**:
   - Use `ModelForm` for database-backed forms.
   - Implement custom field validators with `clean_<fieldname>()` raising `forms.ValidationError`.
3. **CSRF Protection**:
   Always include `{% csrf_token %}` inside `<form method="post">`.

### 5. Django Admin & Authentication
1. **ModelAdmin Customization**:
   Use the `@admin.register(Model)` decorator and customize `list_display`, `list_filter`, `search_fields`, and `prepopulated_fields`.
2. **Protect Views**:
   - FBV: Decorate with `@login_required` or `@permission_required("core.change_producto")`.
   - CBV: Inherit from `LoginRequiredMixin` and `PermissionRequiredMixin`.

### 6. REST API Architecture (DRF)
1. **Serializers**:
   Inherit from `serializers.ModelSerializer`, configure `fields`, `read_only_fields`, and implement `validate_<fieldname>()`.
2. **ViewSets & Routers**:
   Use `ModelViewSet` paired with `DefaultRouter` for complete RESTful endpoints.
   Enforce permissions (`permissions.IsAuthenticatedOrReadOnly`).
   Refer to [resources/drf-api-template.py](./resources/drf-api-template.py) for the standard architecture.

### 7. Testing, Security & Production Deployment
1. **Automated Testing**:
   Write test cases inheriting from `django.test.TestCase` to verify models, views, and status codes.
   ```bash
   python manage.py test core
   ```
2. **Security Audit**:
   Execute the configuration check:
   ```bash
   python manage.py check --deploy
   powershell.exe -ExecutionPolicy Bypass -File .\.agents\skills\django-dev\scripts\verify-django-setup.ps1
   ```
3. **Production Deployment**:
   - Set `DEBUG = False` and configure `ALLOWED_HOSTS`.
   - Serve static assets with WhiteNoise (`python manage.py collectstatic --noinput`).
   - Run WSGI application via Gunicorn: `gunicorn config.wsgi:application --bind 0.0.0.0:8000`.

---

## Anti-Patterns & Common Pitfalls

| Anti-Pattern | Root Risk | Correct Architecture |
| :--- | :--- | :--- |
| Direct import of `User` model (`from django.contrib.auth.models import User`) | Breaks custom user models and causes migration deadlocks. | Use `from django.conf import settings; settings.AUTH_USER_MODEL` in models, or `get_user_model()` in views/tests. |
| Naive loops over related models | Triggers the N+1 database queries problem, severely degrading performance. | Use `.select_related()` for ForeignKeys and `.prefetch_related()` for ManyToMany/reverse relations. |
| Hardcoded secrets in `settings.py` | Credential leakage in version control. | Load `SECRET_KEY`, `DEBUG`, and database credentials from environment variables (`os.environ`). |
| Missing `{% csrf_token %}` | Submissions fail with HTTP 403 Forbidden. | Always insert `{% csrf_token %}` inside `<form method="post">`. |
| Unhandled `.get()` queries | Crashes with `DoesNotExist` or `MultipleObjectsReturned`. | Use `get_object_or_404(Model, ...)` or `.filter(...).first()`. |
| Modifying applied migrations | Database schema out-of-sync across environments. | Always generate a new migration with `makemigrations`. |