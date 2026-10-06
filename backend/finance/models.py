from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone


class Category(models.Model):
    """
    Financial Category (e.g., Alimentos, Servicios, Ocio, Salario).
    Scoped exclusively to the owning user.
    """

    class Kind(models.TextChoices):
        INCOME = "INCOME", "Ingreso"
        EXPENSE = "EXPENSE", "Gasto"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="unique_user_category_name",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"


class Transaction(models.Model):
    """
    Financial Movement (Income or Expense).
    Stores monetary values strictly with DecimalField (never float).
    Protected from category cascade deletion (PROTECT).
    """

    class Kind(models.TextChoices):
        INCOME = "INCOME", "Ingreso"
        EXPENSE = "EXPENSE", "Gasto"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"), message="El monto debe ser al menos 0.01."),
            MaxValueValidator(Decimal("999999999.99"), message="El monto excede el valor permitido."),
        ],
    )
    kind = models.CharField(max_length=10, choices=Kind.choices)
    date = models.DateField(default=timezone.now)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Transacción"
        verbose_name_plural = "Transacciones"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=Decimal("0.00")),
                name="check_positive_amount",
            )
        ]

    def clean(self):
        super().clean()
        # Validation 2: Model layer validations
        if self.date and self.date > timezone.now().date():
            raise ValidationError({"date": "La fecha de la transacción no puede ser futura."})

        if self.category_id:
            if self.category.user_id != self.user_id:
                raise ValidationError({"category": "La categoría seleccionada no pertenece al usuario autenticado."})
            if self.kind != self.category.kind:
                raise ValidationError({"kind": "El tipo de la transacción debe coincidir con el tipo de su categoría."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} | {self.category.name}: {self.amount} ({self.kind})"
