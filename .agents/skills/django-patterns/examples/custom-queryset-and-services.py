"""
Reference Implementation: Custom QuerySets, DRF ViewSets, and the Service Layer Pattern.
"""

from django.db import models, transaction
from django.core.exceptions import ValidationError
from rest_framework import serializers, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response


# ==============================================================================
# 1. CUSTOM QUERYSET & MODEL
# ==============================================================================

class ProductQuerySet(models.QuerySet):
    """Reusable query expressions for the Product domain."""

    def active(self):
        return self.filter(is_active=True)

    def with_category(self):
        return self.select_related("category")

    def in_stock(self):
        return self.filter(stock__gt=0)

    def search(self, query):
        return self.filter(
            models.Q(name__icontains=query) | models.Q(description__icontains=query)
        )


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=250)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "-created_at"]),
        ]

    def __str__(self):
        return self.name


# ==============================================================================
# 2. DRF SERIALIZERS
# ==============================================================================

class ProductSerializer(serializers.ModelSerializer):
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "discounted_price",
            "stock",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_discounted_price(self, obj):
        # 10% discount on products over $100
        if obj.price > 100:
            return round(float(obj.price) * 0.90, 2)
        return float(obj.price)

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value


# ==============================================================================
# 3. SERVICE LAYER
# ==============================================================================

class ProductService:
    """Encapsulates business operations away from the HTTP controller."""

    @staticmethod
    @transaction.atomic
    def purchase(product: Product, user, quantity: int = 1) -> dict:
        if product.stock < quantity:
            raise ValidationError(f"Insufficient stock for {product.name}.")

        product.stock -= quantity
        product.save(update_fields=["stock"])

        # Log or trigger downstream billing/shipping events
        return {
            "success": True,
            "product_id": product.id,
            "purchased_by": user.username,
            "remaining_stock": product.stock,
        }


# ==============================================================================
# 4. VIEWSET WITH SERVICE INTEGRATION
# ==============================================================================

class ProductViewSet(viewsets.ModelViewSet):
    """API endpoint using custom QuerySet and Service Layer."""

    queryset = Product.objects.active()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=["get"])
    def in_stock(self, request):
        """Custom endpoint returning in-stock active items."""
        in_stock_products = self.get_queryset().in_stock()
        serializer = self.get_serializer(in_stock_products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def purchase(self, request, pk=None):
        """Action delegating execution to the ProductService."""
        product = self.get_object()
        quantity = int(request.data.get("quantity", 1))

        try:
            result = ProductService.purchase(product, request.user, quantity)
            return Response(result, status=status.HTTP_200_OK)
        except ValidationError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)
