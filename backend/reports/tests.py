from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from finance.models import Category, Transaction

User = get_user_model()


class ReportsAggregationTests(APITestCase):
    """
    Test suite for Phase 4:
    - Summary Report (Income, Expense, Balance in single SQL query with Coalesce)
    - By-Category Report (GROUP BY via ORM values() + annotate())
    - User isolation (User B data never leaks into User A calculations)
    - Zero transactions fallback with Coalesce (Decimal('0.00') instead of null)
    - Date range filtering on aggregations
    - Authentication required (401 without JWT)
    """

    def setUp(self):
        # Create User A
        self.user_a = User.objects.create_user(
            email="usera.reports@example.com",
            username="usera_reports",
            password="StrongPassword123!",
        )
        # Create User B (for isolation check)
        self.user_b = User.objects.create_user(
            email="userb.reports@example.com",
            username="userb_reports",
            password="StrongPassword123!",
        )
        # Create User C (empty user, no transactions)
        self.user_c = User.objects.create_user(
            email="userc.reports@example.com",
            username="userc_reports",
            password="StrongPassword123!",
        )

        self.cat_food_a = Category.objects.get(user=self.user_a, name="Alimentos")
        self.cat_services_a = Category.objects.get(user=self.user_a, name="Servicios")
        self.cat_salary_a = Category.objects.get(user=self.user_a, name="Salario")

        self.cat_food_b = Category.objects.get(user=self.user_b, name="Alimentos")
        self.cat_salary_b = Category.objects.get(user=self.user_b, name="Salario")

        # Seed deterministic dataset for User A
        # Incomes: 3500.00 + 500.00 = 4000.00
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_salary_a,
            amount=Decimal("3500.00"),
            kind=Transaction.Kind.INCOME,
            date="2026-10-01",
            description="Nómina mensual",
        )
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_salary_a,
            amount=Decimal("500.00"),
            kind=Transaction.Kind.INCOME,
            date="2026-10-05",
            description="Bono extraordinario",
        )

        # Expenses: 150.25 + 49.75 (Food) + 300.00 (Services) = 500.00
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_food_a,
            amount=Decimal("150.25"),
            kind=Transaction.Kind.EXPENSE,
            date="2026-10-02",
            description="Supermercado quincenal",
        )
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_food_a,
            amount=Decimal("49.75"),
            kind=Transaction.Kind.EXPENSE,
            date="2026-10-04",
            description="Cafetería y panadería",
        )
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_services_a,
            amount=Decimal("300.00"),
            kind=Transaction.Kind.EXPENSE,
            date="2026-10-03",
            description="Electricidad e internet",
        )

        # Seed transactions for User B (must NOT be counted for User A)
        Transaction.objects.create(
            user=self.user_b,
            category=self.cat_salary_b,
            amount=Decimal("15000.00"),
            kind=Transaction.Kind.INCOME,
            date="2026-10-01",
        )
        Transaction.objects.create(
            user=self.user_b,
            category=self.cat_food_b,
            amount=Decimal("2500.00"),
            kind=Transaction.Kind.EXPENSE,
            date="2026-10-02",
        )

        self.summary_url = reverse("report-summary")
        self.by_category_url = reverse("report-by-category")

    def test_summary_report_computes_exact_amounts_in_database(self):
        """
        Verify that /reports/summary/ computes exact Decimal balance:
        Income: 4000.00, Expense: 500.00, Balance: 3500.00, Count: 5.
        """
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.summary_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["income"], "4000.00")
        self.assertEqual(response.data["expense"], "500.00")
        self.assertEqual(response.data["balance"], "3500.00")
        self.assertEqual(response.data["count"], 5)

    def test_summary_report_with_date_range_filters(self):
        """
        Verify that date_from and date_to parameters correctly filter aggregations.
        Filtering from 2026-10-03 to 2026-10-05:
        - Income: 500.00 (from Oct 5)
        - Expense: 49.75 (Food Oct 4) + 300.00 (Services Oct 3) = 349.75
        - Balance: 500.00 - 349.75 = 150.25
        - Count: 3
        """
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(
            self.summary_url,
            {"date_from": "2026-10-03", "date_to": "2026-10-05"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["income"], "500.00")
        self.assertEqual(response.data["expense"], "349.75")
        self.assertEqual(response.data["balance"], "150.25")
        self.assertEqual(response.data["count"], 3)

    def test_summary_report_empty_user_returns_clean_zero_decimals(self):
        """
        Verify Coalesce behavior: A user without any transactions
        receives '0.00' for income, expense, and balance (not null/None).
        """
        self.client.force_authenticate(user=self.user_c)
        response = self.client.get(self.summary_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["income"], "0.00")
        self.assertEqual(response.data["expense"], "0.00")
        self.assertEqual(response.data["balance"], "0.00")
        self.assertEqual(response.data["count"], 0)

    def test_by_category_report_groups_and_sums_accurately(self):
        """
        Verify that /reports/by-category/ performs SQL GROUP BY:
        - Alimentos: 200.00 (count: 2)
        - Servicios: 300.00 (count: 1)
        - Salario: 4000.00 (count: 2)
        """
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.by_category_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        category_results = {
            item["category_name"]: {
                "total": item["total"],
                "count": item["count"],
                "kind": item["kind"],
            }
            for item in response.data
        }

        self.assertIn("Alimentos", category_results)
        self.assertEqual(category_results["Alimentos"]["total"], "200.00")
        self.assertEqual(category_results["Alimentos"]["count"], 2)
        self.assertEqual(category_results["Alimentos"]["kind"], "EXPENSE")

        self.assertIn("Servicios", category_results)
        self.assertEqual(category_results["Servicios"]["total"], "300.00")
        self.assertEqual(category_results["Servicios"]["count"], 1)

        self.assertIn("Salario", category_results)
        self.assertEqual(category_results["Salario"]["total"], "4000.00")
        self.assertEqual(category_results["Salario"]["count"], 2)

    def test_by_category_report_filter_by_kind(self):
        """Verify filtering by kind=EXPENSE in by-category report."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.by_category_url, {"kind": "EXPENSE"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertEqual(item["kind"], "EXPENSE")

    def test_reports_require_authentication(self):
        """Unauthenticated requests to reports must return 401 Unauthorized."""
        res_summary = self.client.get(self.summary_url)
        self.assertEqual(res_summary.status_code, status.HTTP_401_UNAUTHORIZED)

        res_cat = self.client.get(self.by_category_url)
        self.assertEqual(res_cat.status_code, status.HTTP_401_UNAUTHORIZED)
