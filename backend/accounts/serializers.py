from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer for safe user public representation."""

    class Meta:
        model = User
        fields = ("id", "email", "username")
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """
    User Registration Serializer.
    Enforces email uniqueness, Django password strength validation,
    and automatic username generation if omitted.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ("id", "email", "username", "password", "password_confirm")
        read_only_fields = ("id",)
        extra_kwargs = {
            "email": {"required": True},
            "username": {"required": False},
        }

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Ya existe una cuenta registrada con este correo electrónico.")
        return normalized

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password_confirm is not None and password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden."})

        # Run Django's configured password validators (length, common passwords, etc.)
        try:
            validate_password(password)
        except DjangoValidationError as err:
            raise serializers.ValidationError({"password": list(err.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        email = validated_data["email"]
        username = validated_data.get("username")
        if not username:
            username = email.split("@")[0]

        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            email=email,
            username=username,
            password=validated_data["password"],
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT Login Serializer.
    Returns standard access and refresh tokens, and enforces generic
    error messages for security (prevents user enumeration).
    """
    default_error_messages = {
        "no_active_account": "Credenciales inválidas. Verifica tu correo y contraseña."
    }

    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            # Optionally include user data in login response
            data["user"] = {
                "id": self.user.id,
                "email": self.user.email,
                "username": self.user.username,
            }
            return data
        except AuthenticationFailed:
            raise AuthenticationFailed(
                self.error_messages["no_active_account"],
                code="authentication_failed",
            )
