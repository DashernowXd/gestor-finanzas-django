from django.db import transaction
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema

from accounts.serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
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


@extend_schema(tags=["Perfil y Cuenta"], summary="Consultar o actualizar perfil de usuario")
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Allows the authenticated user to view account statistics (member since, total transactions, categories)
    and update their username.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UpdateProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user


@extend_schema(tags=["Perfil y Cuenta"], summary="Cambiar contraseña de la cuenta")
class ChangePasswordView(generics.GenericAPIView):
    """
    Allows the authenticated user to safely change their password by validating the current password.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response(
            {"message": "Contraseña actualizada exitosamente."},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Perfil y Cuenta"],
    summary="Eliminar cuenta de usuario permanentemente",
    description="Elimina la cuenta del usuario de forma irreversible junto con todos sus sobres y transacciones contables.",
)
class DeleteAccountView(generics.GenericAPIView):
    """
    Irreversibly deletes the authenticated user and all associated financial data (categories, transactions)
    within an atomic database transaction.
    Requires providing the account password for confirmation.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DeleteAccountSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        with transaction.atomic():
            # Clean up all transactions and categories before user deletion
            user.transactions.all().delete()
            user.categories.all().delete()
            user.delete()

        return Response(
            {"message": "Tu cuenta y todos tus datos contables han sido eliminados de manera permanente e irreversible."},
            status=status.HTTP_200_OK,
        )

