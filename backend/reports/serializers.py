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


class HistoricalPeriodSerializer(serializers.Serializer):
    period = serializers.CharField()
    income = serializers.FloatField()
    expense = serializers.FloatField()
    balance = serializers.FloatField()


class ForecastStatisticsSerializer(serializers.Serializer):
    avg_monthly_income = serializers.FloatField()
    avg_monthly_expense = serializers.FloatField()
    std_dev_expense = serializers.FloatField()
    median_expense = serializers.FloatField()
    savings_rate_pct = serializers.FloatField()
    trend_direction = serializers.CharField()
    expense_growth_rate_pct = serializers.FloatField()
    r_squared = serializers.FloatField()


class PredictionPeriodSerializer(serializers.Serializer):
    period = serializers.CharField()
    expected_income = serializers.FloatField()
    expected_expense = serializers.FloatField()
    expected_balance = serializers.FloatField()
    expense_lower_bound = serializers.FloatField()
    expense_upper_bound = serializers.FloatField()
    confidence_level = serializers.IntegerField()


class CategoryPredictionSerializer(serializers.Serializer):
    category_name = serializers.CharField()
    historical_avg = serializers.FloatField()
    predicted_next_month = serializers.FloatField()
    trend_pct = serializers.FloatField()
    risk_level = serializers.CharField()


class ForecastResponseSerializer(serializers.Serializer):
    historical = HistoricalPeriodSerializer(many=True)
    statistics = ForecastStatisticsSerializer()
    predictions = PredictionPeriodSerializer(many=True)
    category_predictions = CategoryPredictionSerializer(many=True)
    insights = serializers.ListField(child=serializers.CharField())
