from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model inheriting from AbstractUser.
    Configured from day one to adhere to Django best practices and prevent
    future database migration deadlocks.
    """
    pass
