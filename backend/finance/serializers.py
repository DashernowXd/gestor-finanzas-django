from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from finance.models import Category, Transaction


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model.
    Ensures name uniqueness per user and explicit field definitions.
    """

    class Meta:
        model = Category
        fields = ("id", "name", "kind", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        normalized = value.strip()
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            qs = Category.objects.filter(user=request.user, name__iexact=normalized)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "Ya existe una categoría con este nombre para tu usuario."
                )
        return normalized


class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for Transaction model.
    Enforces the first layer of validation:
    - Amount > 0 and <= 999,999,999.99
    - Date cannot be in the future
    - Description max 255 chars
    - Selected category must belong to current user
    - Transaction kind must strictly match Category kind
    """
    category_name = serializers.CharField(source="category.name", read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=True,
    )

    class Meta:
        model = Transaction
        fields = (
            "id",
            "category",
            "category_name",
            "amount",
            "kind",
            "date",
            "description",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "category_name")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Scope category choices to the authenticated user if request is available
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(user=request.user)

    def validate_amount(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("El monto debe ser estrictamente mayor a 0.00.")
        if value > Decimal("999999999.99"):
            raise serializers.ValidationError("El monto no puede exceder 999,999,999.99.")
        return value

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("La fecha de la transacción no puede ser futura.")
        return value

    def validate_description(self, value):
        if len(value) > 255:
            raise serializers.ValidationError("La descripción no puede exceder los 255 caracteres.")
        return value.strip()

    def validate_category(self, value):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if value.user_id != request.user.id:
                raise serializers.ValidationError("La categoría seleccionada no pertenece a tu cuenta.")
        return value

    def validate(self, attrs):
        category = attrs.get("category") or (self.instance.category if self.instance else None)
        kind = attrs.get("kind") or (self.instance.kind if self.instance else None)

        if category and kind and category.kind != kind:
            raise serializers.ValidationError(
                {
                    "kind": (
                        f"El tipo de transacción ({kind}) debe coincidir con el tipo "
                        f"de la categoría seleccionada '{category.name}' ({category.kind})."
                    )
                }
            )
        return attrs
