"""
Django REST Framework (DRF) Production API Boilerplate
Includes: ModelSerializer with validation, ModelViewSet with search & filters, and Router URLs.
"""

from rest_framework import serializers, viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from django.urls import path, include

# Assuming models from the core app
from core.models import Producto, Categoria


# ==============================================================================
# 1. SERIALIZERS
# ==============================================================================

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre", "slug"]


class ProductoSerializer(serializers.ModelSerializer):
    categoria_detalle = CategoriaSerializer(source="categoria", read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id",
            "nombre",
            "slug",
            "precio",
            "stock",
            "categoria",
            "categoria_detalle",
            "estado",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = ["id", "creado_en", "actualizado_en"]

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0.")
        return value


# ==============================================================================
# 2. VIEWSETS
# ==============================================================================

class ProductoViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Products with built-in search, filtering, and custom actions.
    """
    queryset = Producto.objects.select_related("categoria").all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre", "slug", "categoria__nombre"]
    ordering_fields = ["precio", "creado_en", "stock"]
    ordering = ["-creado_en"]

    def get_queryset(self):
        qs = super().get_queryset()
        # If unauthenticated, only return published products
        if not self.request.user.is_authenticated:
            return qs.filter(estado=Producto.Estado.PUBLICADO)
        return qs

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def publicar(self, request, pk=None):
        """Custom endpoint to mark a draft product as published: POST /api/productos/{id}/publicar/"""
        producto = self.get_object()
        producto.estado = Producto.Estado.PUBLICADO
        producto.save(update_fields=["estado", "actualizado_en"])
        return Response({"status": "Producto publicado con éxito"}, status=status.HTTP_200_OK)


# ==============================================================================
# 3. ROUTER & URLS
# ==============================================================================

router = DefaultRouter()
router.register(r"productos", ProductoViewSet, basename="api-producto")

urlpatterns = [
    path("", include(router.urls)),
]
