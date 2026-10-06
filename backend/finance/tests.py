from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from finance.models import Category, Transaction

User = get_user_model()


class FinanceSecurityAndCRUDTests(APITestCase):
    """
    Comprehensive tests for Phase 3:
    - User isolation: User A cannot see, edit, or delete User B's resources (404)
    - Unauthenticated access returns 401
    - 3-layer validation: negative amounts, future dates, mismatched kind/category
    - Using other user's category returns 400
    - Category deletion protection: ProtectedError returns 409 Conflict
    - Filters: date_from, date_to, category, kind
    """

    def setUp(self):
        # Create User A
        self.user_a = User.objects.create_user(
            email="usera@example.com",
            username="usera",
            password="StrongPassword123!",
        )
        # Create User B
        self.user_b = User.objects.create_user(
            email="userb@example.com",
            username="userb",
            password="StrongPassword123!",
        )

        # Grab default categories created by signal for each user
        self.cat_food_a = Category.objects.get(user=self.user_a, name="Alimentos")
        self.cat_salary_a = Category.objects.get(user=self.user_a, name="Salario")
        self.cat_food_b = Category.objects.get(user=self.user_b, name="Alimentos")

        # Authenticate as User A by default
        self.client.force_authenticate(user=self.user_a)

        self.categories_url = reverse("category-list")
        self.transactions_url = reverse("transaction-list")

    # ==========================================
    # CATEGORY TESTS
    # ==========================================

    def test_list_categories_shows_only_authenticated_user_categories(self):
        """User A should only see their own 4 default categories, not User B's."""
        response = self.client.get(self.categories_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 4 default categories for user A
        self.assertEqual(len(response.data["results"]), 4)
        for cat in response.data["results"]:
            category_obj = Category.objects.get(id=cat["id"])
            self.assertEqual(category_obj.user, self.user_a)

    def test_create_category_success(self):
        """User A can create a custom category."""
        data = {"name": "Inversiones", "kind": "INCOME"}
        response = self.client.post(self.categories_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Inversiones")
        self.assertEqual(response.data["kind"], "INCOME")

        created = Category.objects.get(id=response.data["id"])
        self.assertEqual(created.user, self.user_a)

    def test_create_category_duplicate_name_fails(self):
        """User cannot create two categories with the same name."""
        data = {"name": "Alimentos", "kind": "EXPENSE"}
        response = self.client.post(self.categories_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_delete_category_with_transactions_returns_409_conflict(self):
        """
        Integrity rule: Deleting a category that has associated transactions
        must raise ProtectedError and return HTTP 409 Conflict.
        """
        # Create a transaction under Alimentos for User A
        Transaction.objects.create(
            user=self.user_a,
            category=self.cat_food_a,
            amount=Decimal("45.50"),
            kind=Transaction.Kind.EXPENSE,
            date=timezone.now().date(),
            description="Supermercado",
        )

        detail_url = reverse("category-detail", kwargs={"pk": self.cat_food_a.pk})
        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("detail", response.data)
        self.assertIn("transacciones asociadas", response.data["detail"])

    def test_delete_empty_category_succeeds(self):
        """Deleting a category without any transactions succeeds with 204."""
        empty_cat = Category.objects.create(
            user=self.user_a,
            name="Suscripciones",
            kind=Category.Kind.EXPENSE,
        )
        detail_url = reverse("category-detail", kwargs={"pk": empty_cat.pk})
        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(pk=empty_cat.pk).exists())

    # ==========================================
    # TRANSACTION CRUD & VALIDATION TESTS
    # ==========================================

    def test_create_transaction_success(self):
        """Create a valid expense transaction."""
        data = {
            "category": self.cat_food_a.pk,
            "amount": "125.75",
            "kind": "EXPENSE",
            "date": str(timezone.now().date()),
            "description": "Cena familiar",
        }
        response = self.client.post(self.transactions_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["amount"], "125.75")
        self.assertEqual(response.data["category_name"], "Alimentos")

        # Verify DB integrity
        tx = Transaction.objects.get(id=response.data["id"])
        self.assertEqual(tx.user, self.user_a)
        self.assertEqual(tx.amount, Decimal("125.75"))

    def test_create_transaction_zero_or_negative_amount_fails(self):
        """Validation Layer 1 & 3: Amount <= 0 fails with 400."""
        # Zero amount
        res_zero = self.client.post(
            self.transactions_url,
            {
                "category": self.cat_food_a.pk,
                "amount": "0.00",
                "kind": "EXPENSE",
                "date": str(timezone.now().date()),
            },
        )
        self.assertEqual(res_zero.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("amount", res_zero.data)

        # Negative amount
        res_neg = self.client.post(
            self.transactions_url,
            {
                "category": self.cat_food_a.pk,
                "amount": "-50.00",
                "kind": "EXPENSE",
                "date": str(timezone.now().date()),
            },
        )
        self.assertEqual(res_neg.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("amount", res_neg.data)

    def test_create_transaction_future_date_fails(self):
        """Validation Layer 1 & 2: Future date fails with 400."""
        future_date = timezone.now().date() + timedelta(days=2)
        response = self.client.post(
            self.transactions_url,
            {
                "category": self.cat_food_a.pk,
                "amount": "50.00",
                "kind": "EXPENSE",
                "date": str(future_date),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_create_transaction_mismatched_kind_fails(self):
        """
        Integrity rule: Transaction kind must match category kind.
        Submitting kind='INCOME' for an 'EXPENSE' category fails with 400.
        """
        response = self.client.post(
            self.transactions_url,
            {
                "category": self.cat_food_a.pk,  # EXPENSE
                "amount": "500.00",
                "kind": "INCOME",  # Mismatch!
                "date": str(timezone.now().date()),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("kind", response.data)

    def test_create_transaction_with_other_user_category_fails(self):
        """
        Security check: User A cannot create a transaction referencing
        User B's category ID.
        """
        response = self.client.post(
            self.transactions_url,
            {
                "category": self.cat_food_b.pk,  # User B's category!
                "amount": "75.00",
                "kind": "EXPENSE",
                "date": str(timezone.now().date()),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", response.data)

    # ==========================================
    # USER ISOLATION & ACCESS CONTROL TESTS
    # ==========================================

    def test_user_a_cannot_access_user_b_transaction(self):
        """
        Critical Multi-tenant Isolation:
        User A accessing User B's transaction ID returns 404 Not Found (not 403),
        preventing resource ID enumeration.
        """
        tx_b = Transaction.objects.create(
            user=self.user_b,
            category=self.cat_food_b,
            amount=Decimal("200.00"),
            kind=Transaction.Kind.EXPENSE,
            date=timezone.now().date(),
            description="Gasto privado de B",
        )

        detail_url = reverse("transaction-detail", kwargs={"pk": tx_b.pk})

        # GET User B's transaction
        get_res = self.client.get(detail_url)
        self.assertEqual(get_res.status_code, status.HTTP_404_NOT_FOUND)

        # PATCH User B's transaction
        patch_res = self.client.patch(detail_url, {"amount": "10.00"})
        self.assertEqual(patch_res.status_code, status.HTTP_404_NOT_FOUND)

        # DELETE User B's transaction
        del_res = self.client.delete(detail_url)
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_a_cannot_access_user_b_category(self):
        """User A accessing User B's category ID returns 404 Not Found."""
        detail_url = reverse("category-detail", kwargs={"pk": self.cat_food_b.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_request_returns_401(self):
        """Unauthenticated requests without JWT token must return 401."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.transactions_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==========================================
    # FILTERING TESTS
    # ==========================================

    def test_transaction_filters_by_kind_and_category_and_dates(self):
        """Verify transaction filtering by date_from, date_to, category, and kind."""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)

        # Create transactions for User A
        t1 = Transaction.objects.create(
            user=self.user_a,
            category=self.cat_salary_a,
            amount=Decimal("3000.00"),
            kind=Transaction.Kind.INCOME,
            date=two_days_ago,
            description="Salario",
        )
        t2 = Transaction.objects.create(
            user=self.user_a,
            category=self.cat_food_a,
            amount=Decimal("50.00"),
            kind=Transaction.Kind.EXPENSE,
            date=yesterday,
            description="Alimentos Ayer",
        )
        t3 = Transaction.objects.create(
            user=self.user_a,
            category=self.cat_food_a,
            amount=Decimal("75.00"),
            kind=Transaction.Kind.EXPENSE,
            date=today,
            description="Alimentos Hoy",
        )

        # 1. Filter by kind=INCOME
        res_kind = self.client.get(self.transactions_url, {"kind": "INCOME"})
        self.assertEqual(res_kind.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_kind.data["results"]), 1)
        self.assertEqual(res_kind.data["results"][0]["id"], t1.id)

        # 2. Filter by category
        res_cat = self.client.get(self.transactions_url, {"category": self.cat_food_a.id})
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cat.data["results"]), 2)

        # 3. Filter by date range (from yesterday to today)
        res_date = self.client.get(
            self.transactions_url,
            {"date_from": str(yesterday), "date_to": str(today)},
        )
        self.assertEqual(res_date.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_date.data["results"]), 2)
        returned_ids = [item["id"] for item in res_date.data["results"]]
        self.assertIn(t2.id, returned_ids)
        self.assertIn(t3.id, returned_ids)
        self.assertNotIn(t1.id, returned_ids)
