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


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Profile serializer with account statistics.
    Provides user metadata, creation date, and total active categories & transactions.
    """
    category_count = serializers.SerializerMethodField()
    transaction_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "date_joined",
            "category_count",
            "transaction_count",
        )
        read_only_fields = (
            "id",
            "email",
            "date_joined",
            "category_count",
            "transaction_count",
        )

    def get_category_count(self, obj):
        return obj.categories.count()

    def get_transaction_count(self, obj):
        return obj.transactions.count()


class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Serializer to update user profile information (e.g. username).
    """
    class Meta:
        model = User
        fields = ("username",)

    def validate_username(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("El nombre de usuario no puede estar vacío.")
        if len(normalized) < 3:
            raise serializers.ValidationError("El nombre de usuario debe tener al menos 3 caracteres.")
        if len(normalized) > 150:
            raise serializers.ValidationError("El nombre de usuario no puede exceder 150 caracteres.")
        
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if User.objects.filter(username__iexact=normalized).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return normalized


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer to safely change password.
    Requires validating existing old_password and enforces Django's password validators.
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_old_password(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Las nuevas contraseñas no coinciden."}
            )
        request = self.context.get("request")
        user = getattr(request, "user", None)
        try:
            validate_password(attrs["new_password"], user=user)
        except DjangoValidationError as err:
            raise serializers.ValidationError({"new_password": list(err.messages)})
        return attrs


class DeleteAccountSerializer(serializers.Serializer):
    """
    Serializer for irreversible account deletion.
    Requires password verification to prevent unauthorized or accidental deletion.
    """
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_password(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and not user.check_password(value):
            raise serializers.ValidationError(
                "Contraseña incorrecta. Se requiere verificar tu identidad para eliminar la cuenta."
            )
        return value
