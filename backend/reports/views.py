from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from finance.models import Transaction
from reports.serializers import (
    SummaryReportSerializer,
    CategoryReportItemSerializer,
    ForecastResponseSerializer,
)
from reports.services.forecast import calculate_financial_forecast


class SummaryReportView(APIView):
    """
    Computes financial income, expense, and net balance in a SINGLE database query.
    Uses ORM aggregate with Coalesce to guarantee Decimal('0.00') instead of None.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Resumen financiero (Balance general)",
        description=(
            "Calcula ingresos totales, gastos totales y balance neto del usuario autenticado "
            "en una sola consulta de base de datos usando agregaciones ORM (Sum, Coalesce, Q)."
        ),
        parameters=[
            OpenApiParameter(name="date_from", type=str, description="Fecha inicial (YYYY-MM-DD)", required=False),
            OpenApiParameter(name="date_to", type=str, description="Fecha final (YYYY-MM-DD)", required=False),
        ],
        responses={200: SummaryReportSerializer},
        tags=["Reportes"],
    )
    def get(self, request):
        qs = Transaction.objects.filter(user=request.user)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        aggregations = qs.aggregate(
            income=Coalesce(
                Sum("amount", filter=Q(kind=Transaction.Kind.INCOME)),
                Decimal("0.00"),
            ),
            expense=Coalesce(
                Sum("amount", filter=Q(kind=Transaction.Kind.EXPENSE)),
                Decimal("0.00"),
            ),
            count=Count("id"),
        )

        income = aggregations["income"]
        expense = aggregations["expense"]
        balance = income - expense

        data = {
            "income": income,
            "expense": expense,
            "balance": balance,
            "count": aggregations["count"],
        }

        serializer = SummaryReportSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ByCategoryReportView(APIView):
    """
    Computes totals and transaction counts grouped by category using SQL GROUP BY in the database.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Totales agregados por categoría",
        description=(
            "Devuelve el desglose de totales acumulados y cantidad de movimientos agrupados "
            "por categoría directamente en la base de datos (GROUP BY con values() y annotate())."
        ),
        parameters=[
            OpenApiParameter(name="date_from", type=str, description="Fecha inicial (YYYY-MM-DD)", required=False),
            OpenApiParameter(name="date_to", type=str, description="Fecha final (YYYY-MM-DD)", required=False),
            OpenApiParameter(name="kind", type=str, description="Filtrar por tipo (INCOME o EXPENSE)", required=False),
        ],
        responses={200: CategoryReportItemSerializer(many=True)},
        tags=["Reportes"],
    )
    def get(self, request):
        qs = Transaction.objects.filter(user=request.user)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        kind = request.query_params.get("kind")

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if kind:
            qs = qs.filter(kind=kind)

        # SQL GROUP BY via ORM values() + annotate()
        grouped_data = (
            qs.values("category__id", "category__name", "kind")
            .annotate(
                total=Coalesce(Sum("amount"), Decimal("0.00")),
                count=Count("id"),
            )
            .order_by("kind", "-total")
        )

        serializer = CategoryReportItemSerializer(grouped_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ForecastReportView(APIView):
    """
    Computes statistical forecasts and trend projections using OLS linear regression,
    dispersion analysis (mean, std dev, CV), and category trend indicators over user ledger books.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Predicciones financieras y tendencias estadísticas",
        description=(
            "Calcula modelos estadísticos basados en el libro mayor del usuario: regresión lineal OLS, "
            "desviación estándar, tasa de ahorro proyectada, intervalos de confianza al 80% y desglose por rubro."
        ),
        parameters=[
            OpenApiParameter(
                name="months_ahead",
                type=int,
                description="Número de meses a proyectar (1 a 6, default 3)",
                required=False,
            ),
        ],
        responses={200: ForecastResponseSerializer},
        tags=["Reportes"],
    )
    def get(self, request):
        months_param = request.query_params.get("months_ahead", 3)
        try:
            months_ahead = int(months_param)
        except (ValueError, TypeError):
            months_ahead = 3

        months_ahead = max(1, min(6, months_ahead))
        data = calculate_financial_forecast(request.user, months_ahead=months_ahead)
        serializer = ForecastResponseSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
