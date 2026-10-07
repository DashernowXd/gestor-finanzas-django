"""
Statistical Forecasting Service for Personal Finance.
Computes central tendency, dispersion metrics, and Ordinary Least Squares (OLS)
linear regression models over historical ledger transactions to project future
income, expenses, and savings rates with confidence bounds.
"""

from collections import defaultdict
from datetime import datetime, date
from decimal import Decimal
import math
import statistics
from typing import Dict, List, Any, Tuple

from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from finance.models import Transaction, Category


def _add_months(sourcedate: date, months: int) -> date:
    """Adds months to a date object while preserving day 1 for monthly periods."""
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    return date(year, month, 1)


def _linear_regression(x: List[float], y: List[float]) -> Tuple[float, float, float]:
    """
    Computes simple Ordinary Least Squares (OLS) linear regression:
    y = slope * x + intercept
    Returns (slope, intercept, r_squared).
    """
    n = len(x)
    if n < 2:
        return 0.0, float(y[0]) if n == 1 else 0.0, 0.0

    mean_x = statistics.mean(x)
    mean_y = statistics.mean(y)

    ss_xx = sum((xi - mean_x) ** 2 for xi in x)
    ss_xy = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    ss_yy = sum((yi - mean_y) ** 2 for yi in y)

    if ss_xx <= 1e-9:
        return 0.0, mean_y, 0.0

    slope = ss_xy / ss_xx
    intercept = mean_y - slope * mean_x

    # Pearson correlation coefficient and R-squared
    if ss_yy <= 1e-9:
        r_squared = 1.0 if abs(ss_xy) < 1e-9 else 0.0
    else:
        denom = math.sqrt(ss_xx * ss_yy)
        r = ss_xy / denom if denom > 0 else 0.0
        r_squared = max(0.0, min(1.0, r ** 2))

    return round(slope, 4), round(intercept, 4), round(r_squared, 4)


def _compute_dispersion(values: List[float]) -> Dict[str, float]:
    """Calculates mean, median, standard deviation, and coefficient of variation."""
    if not values:
        return {"mean": 0.0, "median": 0.0, "std_dev": 0.0, "cv_pct": 0.0}

    mean_val = statistics.mean(values)
    median_val = statistics.median(values)
    std_dev = statistics.stdev(values) if len(values) > 1 else 0.0
    cv_pct = (std_dev / mean_val * 100.0) if mean_val > 0 else 0.0

    return {
        "mean": round(mean_val, 2),
        "median": round(median_val, 2),
        "std_dev": round(std_dev, 2),
        "cv_pct": round(cv_pct, 2),
    }


def calculate_financial_forecast(user, months_ahead: int = 3) -> Dict[str, Any]:
    """
    Analyzes historical transactions of the authenticated user using statistical methods
    and projects future cash flow for the specified number of months ahead (1 to 6).
    """
    months_ahead = max(1, min(6, months_ahead))

    # Retrieve all user transactions ordered by date
    tx_qs = (
        Transaction.objects.filter(user=user)
        .select_related("category")
        .order_by("date", "id")
    )

    if not tx_qs.exists():
        return {
            "historical": [],
            "statistics": {
                "avg_monthly_income": 0.0,
                "avg_monthly_expense": 0.0,
                "std_dev_expense": 0.0,
                "median_expense": 0.0,
                "savings_rate_pct": 0.0,
                "trend_direction": "stable",
                "expense_growth_rate_pct": 0.0,
                "r_squared": 0.0,
            },
            "predictions": [],
            "category_predictions": [],
            "insights": [
                "Aún no hay transacciones en el libro mayor. Asienta tus primeros ingresos o gastos para generar proyecciones estadísticas."
            ],
        }

    # Group transactions by monthly period "YYYY-MM"
    monthly_data: Dict[str, Dict[str, float]] = defaultdict(
        lambda: {"income": 0.0, "expense": 0.0}
    )
    # Track category-level monthly expenses
    cat_monthly_expenses: Dict[str, Dict[str, float]] = defaultdict(
        lambda: defaultdict(float)
    )

    for tx in tx_qs:
        period_key = tx.date.strftime("%Y-%m")
        amount = float(tx.amount)
        if tx.kind == Transaction.Kind.INCOME:
            monthly_data[period_key]["income"] += amount
        else:
            monthly_data[period_key]["expense"] += amount
            cat_name = tx.category.name if tx.category else "Otros"
            cat_monthly_expenses[cat_name][period_key] += amount

    # Sorted list of historical periods
    sorted_periods = sorted(monthly_data.keys())
    historical_series: List[Dict[str, Any]] = []

    income_series: List[float] = []
    expense_series: List[float] = []

    for period in sorted_periods:
        inc = round(monthly_data[period]["income"], 2)
        exp = round(monthly_data[period]["expense"], 2)
        bal = round(inc - exp, 2)
        income_series.append(inc)
        expense_series.append(exp)
        historical_series.append({
            "period": period,
            "income": inc,
            "expense": exp,
            "balance": bal,
        })

    n_periods = len(sorted_periods)
    x_indices = [float(i) for i in range(n_periods)]

    # Compute regression parameters for expenses and income
    exp_slope, exp_intercept, exp_r2 = _linear_regression(x_indices, expense_series)
    inc_slope, inc_intercept, inc_r2 = _linear_regression(x_indices, income_series)

    # Compute dispersion metrics
    exp_dispersion = _compute_dispersion(expense_series)
    inc_dispersion = _compute_dispersion(income_series)

    avg_monthly_income = inc_dispersion["mean"]
    avg_monthly_expense = exp_dispersion["mean"]
    std_dev_expense = exp_dispersion["std_dev"]
    median_expense = exp_dispersion["median"]

    # Savings rate percentage
    savings_rate_pct = 0.0
    if avg_monthly_income > 0:
        savings_rate_pct = round(((avg_monthly_income - avg_monthly_expense) / avg_monthly_income) * 100.0, 2)

    # Expense growth rate based on trend slope
    if avg_monthly_expense > 0:
        growth_rate_pct = round((exp_slope / avg_monthly_expense) * 100.0, 2)
    else:
        growth_rate_pct = 0.0

    if growth_rate_pct > 3.0:
        trend_direction = "increasing"
    elif growth_rate_pct < -3.0:
        trend_direction = "decreasing"
    else:
        trend_direction = "stable"

    # Generate future projections
    predictions: List[Dict[str, Any]] = []
    last_period_date = datetime.strptime(sorted_periods[-1] + "-01", "%Y-%m-%d").date()

    for step in range(1, months_ahead + 1):
        future_x = float(n_periods - 1 + step)
        future_date = _add_months(last_period_date, step)
        future_period = future_date.strftime("%Y-%m")

        # Projected values bounded at zero
        pred_exp = max(0.0, exp_intercept + exp_slope * future_x)
        pred_inc = max(0.0, inc_intercept + inc_slope * future_x)

        # Standard error / confidence interval buffer (1.28 * std_dev for 80% confidence interval)
        confidence_buffer = 1.28 * std_dev_expense
        lower_bound = max(0.0, pred_exp - confidence_buffer)
        upper_bound = pred_exp + confidence_buffer

        pred_balance = pred_inc - pred_exp

        predictions.append({
            "period": future_period,
            "expected_income": round(pred_inc, 2),
            "expected_expense": round(pred_exp, 2),
            "expected_balance": round(pred_balance, 2),
            "expense_lower_bound": round(lower_bound, 2),
            "expense_upper_bound": round(upper_bound, 2),
            "confidence_level": 80,
        })

    # Category predictions for the next month
    category_predictions: List[Dict[str, Any]] = []
    for cat_name, period_vals in cat_monthly_expenses.items():
        cat_history = [period_vals.get(p, 0.0) for p in sorted_periods]
        cat_avg = round(statistics.mean(cat_history), 2)
        cat_slope, cat_intercept, _ = _linear_regression(x_indices, cat_history)
        next_month_x = float(n_periods)
        predicted_next = round(max(0.0, cat_intercept + cat_slope * next_month_x), 2)

        if cat_avg > 0:
            cat_growth = round(((predicted_next - cat_avg) / cat_avg) * 100.0, 1)
        else:
            cat_growth = 0.0

        category_predictions.append({
            "category_name": cat_name,
            "historical_avg": cat_avg,
            "predicted_next_month": predicted_next,
            "trend_pct": cat_growth,
            "risk_level": "alto" if cat_growth > 10.0 else ("moderado" if cat_growth > 0 else "optimo"),
        })

    category_predictions.sort(key=lambda x: x["predicted_next_month"], reverse=True)

    # Automated executive insights
    insights: List[str] = []
    if trend_direction == "increasing":
        insights.append(
            f"Tus gastos tienen una tendencia alcista (+{abs(growth_rate_pct)}% mensual). "
            f"Se proyecta un gasto de ${predictions[0]['expected_expense']:,.2f} para el próximo mes."
        )
    elif trend_direction == "decreasing":
        insights.append(
            f"Excelente disciplina financiera: tus gastos presentan una tendencia a la baja (-{abs(growth_rate_pct)}% mensual)."
        )
    else:
        insights.append(
            f"Tus gastos se mantienen en un rango estable (variación mensual de {growth_rate_pct:+0.1f}%)."
        )

    if savings_rate_pct >= 20.0:
        insights.append(
            f"Tu tasa de ahorro promedio es del {savings_rate_pct}%, cumpliendo con la regla dorada del método 50/30/20."
        )
    elif savings_rate_pct > 0:
        insights.append(
            f"Tu tasa de ahorro es del {savings_rate_pct}%. Podrías optimizar gastos discrecionales para acercarte al 20% recomendado."
        )
    else:
        insights.append(
            "Alerta de liquidez: los gastos superan o igualan los ingresos históricos en los libros analizados."
        )

    if category_predictions:
        top_cat = category_predictions[0]
        insights.append(
            f"Mayor rubro proyectado: '{top_cat['category_name']}' con un gasto estimado de ${top_cat['predicted_next_month']:,.2f} "
            f"({top_cat['trend_pct']:+0.1f}% respecto a su media histórica)."
        )

    return {
        "historical": historical_series,
        "statistics": {
            "avg_monthly_income": avg_monthly_income,
            "avg_monthly_expense": avg_monthly_expense,
            "std_dev_expense": std_dev_expense,
            "median_expense": median_expense,
            "savings_rate_pct": savings_rate_pct,
            "trend_direction": trend_direction,
            "expense_growth_rate_pct": growth_rate_pct,
            "r_squared": exp_r2,
        },
        "predictions": predictions,
        "category_predictions": category_predictions,
        "insights": insights,
    }
