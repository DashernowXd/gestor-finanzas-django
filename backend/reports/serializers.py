from rest_framework import serializers


class SummaryReportSerializer(serializers.Serializer):
    """
    Response schema for the financial summary report.
    Calculated in a single SQL query using ORM aggregate with Coalesce and Q.
    """
    income = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    count = serializers.IntegerField()


class CategoryReportItemSerializer(serializers.Serializer):
    """
    Response schema for a single category total aggregation.
    """
    category_id = serializers.IntegerField(source="category__id")
    category_name = serializers.CharField(source="category__name")
    kind = serializers.CharField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    count = serializers.IntegerField()
