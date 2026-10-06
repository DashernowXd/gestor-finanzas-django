from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema

from accounts.serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
)


@extend_schema(tags=["Autenticación"], summary="Registro de nuevo usuario")
class RegisterView(generics.CreateAPIView):
    """
    Public registration endpoint.
    Creates a new user account, applies Django password validation,
    and automatically seeds the 4 default categories (Alimentos, Servicios, Ocio, Salario).
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "message": "Usuario registrado exitosamente.",
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Autenticación"], summary="Iniciar sesión (Obtener tokens JWT)")
class CustomLoginView(TokenObtainPairView):
    """
    Public login endpoint.
    Accepts email and password, and returns access (~15 min) and refresh (~7 days) tokens.
    Returns generic error messages on failure to prevent user enumeration.
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


@extend_schema(tags=["Autenticación"], summary="Renovar access token")
class CustomRefreshView(TokenRefreshView):
    """
    Renews the short-lived access token using a valid refresh token.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"
