# Django Patterns Quick Reference Table

| Pattern | Problem Solved | Key File / Artifact |
| :--- | :--- | :--- |
| **Split Settings** | Separation of dev, test, and production configs without `if DEBUG` hacks | `config/settings/base.py`, `development.py`, `production.py` |
| **Custom QuerySet** | Eliminates duplicate `.filter()` logic across views and encapsulates joins | `models.QuerySet.as_manager()` |
| **Custom Manager** | Encapsulates table-wide utilities (`get_or_none`, bulk creation helpers) | `models.Manager` |
| **Service Layer** | Prevents "Fat Views" and "Fat Models"; handles atomic transactions | `apps/<app>/services.py` |
| **ViewSet + Router** | Standardizes full REST CRUD endpoints and custom `@action` methods | `rest_framework.viewsets.ModelViewSet` |
| **Field Validation** | Validates incoming payloads at serializer level before hitting DB | `validate_<field>()` / `validate()` |
| **Select / Prefetch** | Solves N+1 database queries for ForeignKey and M2M relations | `select_related()` / `prefetch_related()` |
| **View / Fragment Cache** | Caches full pages or expensive UI components to reduce CPU load | `@cache_page`, `{% cache %}` |
| **Decoupled Signals** | Event-driven side effects without coupling models directly | `signals.py` registered in `apps.py` |
| **Custom Middleware** | Cross-cutting concerns (request logging, activity tracking) | Middleware classes in `middleware/` |
