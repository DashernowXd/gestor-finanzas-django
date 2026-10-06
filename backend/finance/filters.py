import django_filters
from finance.models import Transaction


class TransactionFilter(django_filters.FilterSet):
    """
    FilterSet for Transaction listing.
    Supports filtering by:
    - date_from (date >= date_from)
    - date_to (date <= date_to)
    - category (category ID)
    - kind (INCOME | EXPENSE)
    """
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    category = django_filters.NumberFilter(field_name="category_id")
    kind = django_filters.ChoiceFilter(choices=Transaction.Kind.choices)

    class Meta:
        model = Transaction
        fields = ["date_from", "date_to", "category", "kind"]
