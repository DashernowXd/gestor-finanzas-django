from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model inheriting from AbstractUser.
    Uses email as the unique identifier for authentication,
    eliminating ambiguity and supporting modern authentication standards.
    """
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
