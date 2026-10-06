from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    """Tests for the infrastructure and monitoring health check endpoint."""

    def test_health_check_returns_200_publicly(self):
        """
        Verify that the health check endpoint is publicly accessible
        without authentication and returns 200 with healthy status.
        """
        url = reverse("health-check")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "healthy")
        self.assertIn("message", response.data)
