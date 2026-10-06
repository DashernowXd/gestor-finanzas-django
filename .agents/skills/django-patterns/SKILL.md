---
name: django-patterns
description: >-
  Use this skill when implementing production-grade Django architecture patterns, split settings, custom QuerySets and Managers, DRF ViewSets/Serializers, Service Layer patterns, caching strategies, signals, and middleware.
---

# Django Production Patterns & Architecture Runbook

## Overview
This skill establishes production-grade architecture patterns for scalable, maintainable Django applications. Derived from the [ECC Django Patterns specification](https://github.com/affaan-m/ecc), it guides developers through decoupling business logic from views, isolating configuration environments with split settings, encapsulating reusable queries in custom QuerySets, implementing the Service Layer pattern, and optimizing database performance.

## Prerequisites
- Python 3.10+ and pip/poetry.
- Django 4.2+ or 5.0+, Django REST Framework (`djangorestframework`), and `django-cors-headers`.
- PowerShell 5.1+ / Core (for pattern audit script).

## Directory Structure
- [references/django-service-layer.md](./references/django-service-layer.md): Service layer design, transactional boundaries, and custom QuerySets/Managers.
- [references/django-caching-signals.md](./references/django-caching-signals.md): Multi-tiered caching (view, template, low-level), signals architecture, and custom middleware.
- [examples/split-settings-base.py](./examples/split-settings-base.py): Implementation of split settings (`base.py`, `development.py`, `production.py`).
- [examples/custom-queryset-and-services.py](./examples/custom-queryset-and-services.py): Complete code showing custom QuerySets, DRF Serializers, ViewSets, and Service classes.
- [resources/custom-middleware.py](./resources/custom-middleware.py): Ready-to-use middleware for request logging and active user tracking.
- [resources/django-patterns-cheat-sheet.md](./resources/django-patterns-cheat-sheet.md): Quick reference map of all architectural patterns.
- [scripts/audit-django-patterns.ps1](./scripts/audit-django-patterns.ps1): Automated scanner checking for split settings, service layers, and query optimizations.

---

## Step-by-Step Procedure

### 1. Project Organization & Split Settings
1. **Layout Apps Under `apps/`**:
   Group business domain apps under an `apps/` directory (`apps/users`, `apps/products`, `apps/orders`).
2. **Split Settings Pattern**:
   Replace a monolithic `settings.py` with `config/settings/`:
   - `base.py`: Shared apps, middleware, databases, and password validators.
   - `development.py`: `DEBUG = True`, `debug_toolbar`, console email backend.
   - `production.py`: `DEBUG = False`, SSL redirects, secure cookies, file loggers.
   - Run dev server pointing to specific module:
     ```bash
     python manage.py runserver --settings=config.settings.development
     ```

### 2. Custom QuerySets & Managers
1. **Encapsulate Query Logic**:
   Subclass `models.QuerySet` and declare domain filter methods (`active()`, `in_stock()`, `search()`).
2. **Eliminate N+1 Queries**:
   Include `.select_related()` for ForeignKeys and `.prefetch_related()` for ManyToMany fields inside custom QuerySet methods.
3. **Attach to Model**:
   ```python
   class Product(models.Model):
       ...
       objects = ProductQuerySet.as_manager()
   ```

### 3. Service Layer Architecture
1. **Decouple Business Operations**:
   Place multi-model transactions, external API interactions, and domain calculations inside `apps/<app>/services.py`.
2. **Wrap in Atomic Transactions**:
   Decorate mutating service methods with `@transaction.atomic` to ensure rollbacks upon validation failures.
3. **Keep Views Thin**:
   Controllers (views/viewsets) should only handle HTTP parsing, call the Service, and return HTTP responses.

### 4. REST APIs with DRF ViewSets & Serializers
1. **Serializer Validation**:
   Implement `validate_<field>()` for single-field rules and `validate(data)` for cross-field checks.
2. **Dynamic Serializers**:
   Override `get_serializer_class()` in `ModelViewSet` to return lightweight serializers for listing and detailed serializers for creation/updates.
3. **Custom Actions**:
   Use `@action(detail=True, methods=['post'])` on ViewSets for non-CRUD verbs (e.g., `/api/products/{id}/purchase/`).

### 5. Caching, Signals, & Middleware Integration
1. **Cache Expensive Endpoints**:
   Apply `@cache_page(60 * 15)` on read-heavy, low-churn views, or use low-level `cache.get()` / `cache.set()`.
2. **Clean Signals**:
   Place handlers in `signals.py` and register them inside `apps.py` `ready()` method. Never connect signals in `models.py` or root `__init__.py`.
3. **Cross-Cutting Middleware**:
   Implement `RequestLoggingMiddleware` and `ActiveUserMiddleware` for tracking latency and user sessions.

---

## Verification & Auditing

1. **Automated Pattern Audit**:
   Execute the PowerShell audit script against your repository:
   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\.agents\skills\django-patterns\scripts\audit-django-patterns.ps1 -ProjectRoot "."
   ```
2. **Quality Checklist**:
   - [ ] Settings are split into `base.py`, `development.py`, and `production.py`.
   - [ ] No database filter chains are duplicated across views; custom QuerySets are used instead.
   - [ ] Complex business workflows and checkout flows reside in `services.py` inside an atomic transaction.
   - [ ] All ForeignKey relationships queried in loops use `select_related`.
   - [ ] Signals are imported in `AppConfig.ready()`.

---

## Anti-Patterns & Common Pitfalls

| Anti-Pattern | Root Risk | Correct Architecture |
| :--- | :--- | :--- |
| Fat Views (Business logic in views) | Impossible to reuse logic in celery tasks, management commands, or other views; hard to test. | Extract logic to `services.py` (Service Layer). |
| Fat Models with cross-app imports | Creates tight circular import dependencies between models. | Use the Service Layer to orchestrate multiple models. |
| In-line `if DEBUG:` throughout settings | Accidental leakage of debug flags or credentials to production. | Use dedicated `development.py` and `production.py` modules. |
| Iterating over un-prefetched relations | N+1 database queries causing major latency under production load. | Bundle `select_related()` / `prefetch_related()` into custom QuerySets. |
| Importing signals in `__init__.py` | Triggers `AppRegistryNotReady` during early Django boot sequence. | Place imports exclusively inside `AppConfig.ready()`. |