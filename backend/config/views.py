from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer


class HealthCheckView(APIView):
    """
    Public health check endpoint.
    Used by load balancers, container orchestrators, and deployment services (like Render)
    to detect that the API process is alive and healthy.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="API Health Check",
        description="Public endpoint to confirm the API service is active and responsive.",
        responses={
            200: inline_serializer(
                name="HealthCheckResponse",
                fields={
                    "status": serializers.CharField(),
                    "message": serializers.CharField(),
                },
            )
        },
        tags=["Health"],
    )
    def get(self, request):
        return Response(
            {
                "status": "healthy",
                "message": "Personal Finance API is running smoothly.",
            },
            status=status.HTTP_200_OK,
        )
