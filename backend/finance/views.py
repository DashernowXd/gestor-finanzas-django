from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema, extend_schema_view
from finance.models import Category, Transaction
from finance.serializers import CategorySerializer, TransactionSerializer
from finance.filters import TransactionFilter


@extend_schema_view(
    list=extend_schema(summary="Listar categorías del usuario", tags=["Categorías"]),
    create=extend_schema(summary="Crear nueva categoría", tags=["Categorías"]),
    retrieve=extend_schema(summary="Detalle de categoría", tags=["Categorías"]),
    partial_update=extend_schema(summary="Editar categoría (parcial)", tags=["Categorías"]),
    update=extend_schema(summary="Actualizar categoría", tags=["Categorías"]),
    destroy=extend_schema(
        summary="Eliminar categoría",
        description="Elimina la categoría si no contiene transacciones. Si tiene transacciones asociadas, responde 409 Conflict.",
        tags=["Categorías"],
    ),
)
class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for financial categories.
    Guarantees strict user isolation: each user only interacts with their own categories.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Scope categories strictly to the authenticated user."""
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Implicitly assign the authenticated user to the created category."""
        serializer.save(user=self.request.user)


@extend_schema_view(
    list=extend_schema(
        summary="Listar transacciones (paginadas y filtradas)",
        description="Devuelve el historial de transacciones del usuario autenticado con soporte para filtros por rango de fechas (date_from, date_to), categoría y tipo (kind).",
        tags=["Transacciones"],
    ),
    create=extend_schema(summary="Registrar nueva transacción", tags=["Transacciones"]),
    retrieve=extend_schema(summary="Detalle de transacción", tags=["Transacciones"]),
    partial_update=extend_schema(summary="Editar transacción (parcial)", tags=["Transacciones"]),
    update=extend_schema(summary="Actualizar transacción", tags=["Transacciones"]),
    destroy=extend_schema(summary="Eliminar transacción", tags=["Transacciones"]),
)
class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for financial transactions (Incomes and Expenses).
    Enforces user isolation and optimizes database queries with select_related.
    """
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TransactionFilter

    def get_queryset(self):
        """
        Scope transactions strictly to the authenticated user.
        Uses select_related to eliminate N+1 queries when fetching related Category data.
        """
        return (
            Transaction.objects.filter(user=self.request.user)
            .select_related("category")
            .order_by("-date", "-created_at")
        )

    def perform_create(self, serializer):
        """Implicitly assign the authenticated user to the created transaction."""
        serializer.save(user=self.request.user)
