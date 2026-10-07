from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from finance.models import Category

User = get_user_model()


class AuthTests(APITestCase):
    """
    Comprehensive test suite for Phase 2:
    - User Registration & Password Validation
    - Automatic seeding of default categories (Alimentos, Servicios, Ocio, Salario)
    - JWT Login with generic error security
    - JWT Token Refresh
    """

    def setUp(self):
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.refresh_url = reverse("auth-refresh")

        self.valid_user_data = {
            "email": "user.test@example.com",
            "username": "usertest",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
        }

    def test_user_registration_success_and_creates_default_categories(self):
        """
        Verify that registering a user succeeds (201 Created), returns tokens,
        and automatically seeds the 4 default categories for the new user.
        """
        response = self.client.post(self.register_url, self.valid_user_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "user.test@example.com")

        # Verify user in database and password hashed
        user = User.objects.get(email="user.test@example.com")
        self.assertTrue(user.check_password("StrongPassword123!"))

        # Verify the 4 default categories were automatically created
        categories = Category.objects.filter(user=user)
        self.assertEqual(categories.count(), 4)

        expected_categories = {
            "Alimentos": Category.Kind.EXPENSE,
            "Servicios": Category.Kind.EXPENSE,
            "Ocio": Category.Kind.EXPENSE,
            "Salario": Category.Kind.INCOME,
        }

        category_dict = {cat.name: cat.kind for cat in categories}
        self.assertEqual(category_dict, expected_categories)

    def test_registration_duplicate_email_fails(self):
        """Verify that registering with an already existing email returns 400."""
        User.objects.create_user(
            email="existing@example.com",
            username="existinguser",
            password="StrongPassword123!",
        )

        data = {
            "email": "existing@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
        }
        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_registration_password_mismatch_fails(self):
        """Verify that mismatched password and password_confirm returns 400."""
        data = {
            "email": "mismatch@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "DifferentPassword123!",
        }
        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_registration_weak_password_fails(self):
        """Verify that weak passwords violating Django validators fail with 400."""
        data = {
            "email": "weak@example.com",
            "password": "123",
            "password_confirm": "123",
        }
        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_login_success_returns_jwt_tokens(self):
        """Verify that valid credentials return access and refresh JWT tokens."""
        User.objects.create_user(
            email="login.user@example.com",
            username="loginuser",
            password="StrongPassword123!",
        )

        payload = {
            "email": "login.user@example.com",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.login_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_credentials_returns_generic_401(self):
        """
        Verify that invalid credentials return 401 with a generic error
        message that does not leak whether the email exists.
        """
        payload = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!",
        }
        response = self.client.post(self.login_url, payload)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertIn("Credenciales inválidas", response.data["detail"])

    def test_token_refresh_success(self):
        """Verify that a valid refresh token generates a new access token."""
        user = User.objects.create_user(
            email="refresh.user@example.com",
            username="refreshuser",
            password="StrongPassword123!",
        )

        login_res = self.client.post(
            self.login_url,
            {"email": "refresh.user@example.com", "password": "StrongPassword123!"},
        )
        refresh_token = login_res.data["refresh"]

        refresh_res = self.client.post(self.refresh_url, {"refresh": refresh_token})

        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)

    def test_token_refresh_invalid_token_fails(self):
        """Verify that an invalid refresh token returns 401 Unauthorized."""
        response = self.client.post(self.refresh_url, {"refresh": "invalid-token-string"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_profile_success(self):
        """Verify retrieving user profile and statistics (categories & transactions)."""
        user = User.objects.create_user(
            email="profile.user@example.com",
            username="profileuser",
            password="StrongPassword123!",
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("user-profile"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "profile.user@example.com")
        self.assertEqual(response.data["username"], "profileuser")
        self.assertIn("category_count", response.data)
        self.assertIn("transaction_count", response.data)
        self.assertIn("date_joined", response.data)

    def test_update_username_success(self):
        """Verify updating username via PATCH on user profile endpoint."""
        user = User.objects.create_user(
            email="update.user@example.com",
            username="oldname",
            password="StrongPassword123!",
        )
        self.client.force_authenticate(user=user)
        response = self.client.patch(reverse("user-profile"), {"username": "newname"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "newname")
        user.refresh_from_db()
        self.assertEqual(user.username, "newname")

    def test_change_password_success(self):
        """Verify changing password requires old password and updates authentication."""
        user = User.objects.create_user(
            email="pwd.user@example.com",
            username="pwduser",
            password="OldPassword123!",
        )
        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse("user-change-password"),
            {
                "old_password": "OldPassword123!",
                "new_password": "BrandNewPassword123!",
                "new_password_confirm": "BrandNewPassword123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("BrandNewPassword123!"))

    def test_change_password_wrong_old_password_fails(self):
        """Verify changing password fails if old password is incorrect."""
        user = User.objects.create_user(
            email="wrongpwd.user@example.com",
            username="wrongpwduser",
            password="OldPassword123!",
        )
        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse("user-change-password"),
            {
                "old_password": "IncorrectPassword123!",
                "new_password": "BrandNewPassword123!",
                "new_password_confirm": "BrandNewPassword123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data)

    def test_delete_account_irreversible_cascade(self):
        """Verify account deletion deletes user and all associated categories and transactions."""
        user = User.objects.create_user(
            email="delete.me@example.com",
            username="deleteme",
            password="StrongPassword123!",
        )
        # Create category and transaction for this user
        cat = Category.objects.create(user=user, name="Despensa", kind=Category.Kind.EXPENSE)
        user.transactions.create(
            category=cat,
            amount="50.00",
            kind="EXPENSE",
            description="Supermercado",
        )

        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse("user-delete-account"),
            {"password": "StrongPassword123!"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user and related data are completely removed
        self.assertFalse(User.objects.filter(email="delete.me@example.com").exists())
        self.assertEqual(Category.objects.filter(name="Despensa").count(), 0)
