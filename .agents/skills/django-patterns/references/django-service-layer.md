# Django Service Layer & Custom QuerySet Patterns

Separating business logic from HTTP views and database models is critical for scalable, maintainable Django applications.

---

## 1. Custom QuerySets & Managers Pattern

Instead of scattering `.filter(...)` across multiple views or serializers, encapsulate queries inside custom `models.QuerySet` and `models.Manager` classes.

### Custom QuerySet (`as_manager()`)
```python
from django.db import models

class ProductQuerySet(models.QuerySet):
    """Encapsulates reusable query filters and joins."""

    def active(self):
        """Returns only active products."""
        return self.filter(is_active=True)

    def with_category(self):
        """Eagerly loads category to eliminate N+1 queries."""
        return self.select_related('category')

    def with_tags(self):
        """Eagerly prefetches many-to-many tags."""
        return self.prefetch_related('tags')

    def in_stock(self):
        """Filters products with available inventory."""
        return self.filter(stock__gt=0)

    def search(self, term):
        """Full-text or partial search across name and description."""
        return self.filter(
            models.Q(name__icontains=term) | models.Q(description__icontains=term)
        )


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey('Category', on_delete=models.CASCADE, related_name='products')
    tags = models.ManyToManyField('Tag', blank=True, related_name='products')

    # Attach custom QuerySet as default manager
    objects = ProductQuerySet.as_manager()

# Fluent chaining usage in views or services:
# Product.objects.active().with_category().in_stock()
```

### Custom Manager for Factory & Utility Methods
```python
class ProductManager(models.Manager):
    """Custom manager for domain helper methods and bulk updates."""

    def get_or_none(self, **kwargs):
        """Safely fetch single object or None without catching DoesNotExist."""
        try:
            return self.get(**kwargs)
        except self.model.DoesNotExist:
            return None

    def bulk_update_stock(self, product_ids, quantity):
        """Atomically update stock levels for a batch of products."""
        return self.filter(id__in=product_ids).update(stock=quantity)
```

---

## 2. The Service Layer Pattern

In complex applications, putting business logic in `views.py` causes bloated views (Fat Views). Putting business logic in `models.py` causes bloated models (Fat Models) with circular dependencies.

The **Service Layer** provides plain Python classes or functions dedicated purely to business processes and multi-model transactions.

### Service Layer Implementation Example
```python
# apps/orders/services.py
from typing import Optional
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Order, OrderItem
from apps.products.models import Product

class OrderService:
    """Service layer orchestrating order creation, payment, and inventory updates."""

    @staticmethod
    @transaction.atomic
    def create_order(user, cart) -> Order:
        """
        Creates an Order from a shopping cart atomically.
        If any product has insufficient stock, the entire transaction rolls back.
        """
        if not cart.items.exists():
            raise ValidationError("Cannot create an order from an empty cart.")

        order = Order.objects.create(
            user=user,
            total_price=cart.total_price,
            status=Order.Status.PENDING
        )

        for item in cart.items.select_related('product').all():
            if item.product.stock < item.quantity:
                raise ValidationError(f"Insufficient stock for {item.product.name}.")

            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.product.price
            )

            # Decrement inventory atomically
            item.product.stock -= item.quantity
            item.product.save(update_fields=['stock'])

        # Clear cart items after successful order creation
        cart.items.all().delete()

        return order

    @staticmethod
    def process_payment(order: Order, payment_token: str) -> bool:
        """Handles third-party payment gateway integration."""
        # Simulated payment gateway charge
        payment_successful = True  # PaymentGateway.charge(...)

        if payment_successful:
            order.status = Order.Status.PAID
            order.save(update_fields=['status'])
            OrderService.send_confirmation_notification(order)
            return True

        order.status = Order.Status.FAILED
        order.save(update_fields=['status'])
        return False

    @staticmethod
    def send_confirmation_notification(order: Order):
        """Dispatches email/SMS notification to the user."""
        # Notification logic
        pass
```
