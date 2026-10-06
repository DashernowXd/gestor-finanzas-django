# Django ORM & Database Querying Reference

This reference covers advanced patterns, query optimization, and transaction handling using the Django Object-Relational Mapper (ORM).

---

## 1. Model Architecture & Definition

### Best Practices for Models
1. **Always define `__str__()`**: Provides readable representations in Django Admin, shell, and logs.
2. **Use `TextChoices` or `IntegerChoices`**: Enforces type safety, human-readable labels, and migrations consistency.
3. **Reference User Model dynamically**: Never import `User` directly from `django.contrib.auth.models` in models. Use `settings.AUTH_USER_MODEL` for ForeignKeys.
4. **Explicit `related_name`**: Always specify `related_name` on ForeignKeys and ManyToMany fields to maintain clear reverse relations.
5. **Database Indexes**: Add `indexes = [models.Index(fields=[...])]` in `Meta` for fields frequently queried or filtered.

```python
from django.db import models
from django.conf import settings

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = "BR", "Borrador"
        PUBLICADO = "PB", "Publicado"
        ARCHIVADO = "AR", "Archivado"

    nombre = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="productos"
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="productos_creados"
    )
    estado = models.CharField(
        max_length=2,
        choices=Estado.choices,
        default=Estado.BORRADOR
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["estado", "-creado_en"]),
        ]

    def __str__(self):
        return self.nombre
```

### ForeignKey `on_delete` Options
- `CASCADE`: Deletes child rows when the referenced parent is deleted.
- `PROTECT`: Raises `ProtectedError` preventing deletion if children exist.
- `SET_NULL`: Sets the FK field to `NULL` (requires `null=True`).
- `SET_DEFAULT`: Sets the field to its specified default value.
- `DO_NOTHING`: Leaves the database constraint handling to PostgreSQL/MySQL (generally not recommended).

---

## 2. Advanced QuerySets & The N+1 Problem

### Solving N+1 Queries
When accessing related models in a loop, naive ORM access executes 1 query for the list + N queries for each related object.

```python
# BAD (N+1 queries executed)
for p in Producto.objects.all():
    print(p.categoria.nombre)

# GOOD: select_related for ForeignKey & OneToOne (performs a SQL JOIN)
productos = Producto.objects.select_related("categoria").all()
for p in productos:
    print(p.categoria.nombre)  # 0 additional queries

# GOOD: prefetch_related for ManyToMany & Reverse ForeignKey (performs batch SQL IN query)
categorias = Categoria.objects.prefetch_related("productos").all()
for c in categorias:
    for p in c.productos.all():
        print(p.nombre)  # 0 additional queries
```

---

## 3. Query Expressions: Q, F, Annotate, and Aggregate

### Complex Lookups with `Q`
Combine conditions with bitwise operators `|` (OR), `&` (AND), and `~` (NOT):
```python
from django.db.models import Q

# Products that are published OR have stock > 0
query = Q(estado="PB") | Q(stock__gt=0)
productos = Producto.objects.filter(query)

# Products published AND NOT authored by user 1
productos = Producto.objects.filter(Q(estado="PB") & ~Q(creado_por_id=1))
```

### Database-Level Operations with `F`
References model field values directly in the database without pulling them into Python memory:
```python
from django.db.models import F

# Atomically decrement stock
Producto.objects.filter(id=1).update(stock=F("stock") - 1)

# Compare two fields on the same record
Producto.objects.filter(precio__gt=F("costo_base") * 2)
```

### Aggregations & Annotations
- `aggregate()`: Calculates summary values over the entire QuerySet (returns a dictionary).
- `annotate()`: Adds calculated columns to each individual object in the QuerySet.

```python
from django.db.models import Count, Avg, Sum, Max

# Annotate each Categoria with count of its published products
categorias = Categoria.objects.annotate(
    total_publicados=Count("productos", filter=Q(productos__estado="PB"))
)

# Overall inventory valuation
resumen = Producto.objects.aggregate(
    promedio_precio=Avg("precio"),
    max_precio=Max("precio"),
    total_stock=Sum("stock")
)
```

---

## 4. Bulk Operations & Atomic Transactions

### Bulk Creation and Updates
Avoid calling `.save()` in loops. Use bulk methods:
```python
nuevos = [
    Producto(nombre=f"Item {i}", slug=f"item-{i}", precio=10.0, categoria=cat)
    for i in range(1000)
]
Producto.objects.bulk_create(nuevos, batch_size=200)

# Bulk update specific fields
for p in productos:
    p.stock += 5
Producto.objects.bulk_update(productos, fields=["stock"], batch_size=200)
```

### Atomic Transactions
Wrap multiple operations that must succeed or fail together:
```python
from django.db import transaction

def transferir_fondos(cuenta_origen, cuenta_destino, monto):
    with transaction.atomic():
        cuenta_origen.saldo -= monto
        cuenta_origen.save()

        cuenta_destino.saldo += monto
        cuenta_destino.save()
```
