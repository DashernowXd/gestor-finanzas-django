from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from finance.models import Category


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_categories_for_new_user(sender, instance, created, **kwargs):
    """
    Signal handler: Automatically seeds the 4 default categories
    (Alimentos, Servicios, Ocio, Salario) upon new user registration.
    """
    if created:
        default_categories = [
            ("Alimentos", Category.Kind.EXPENSE),
            ("Servicios", Category.Kind.EXPENSE),
            ("Ocio", Category.Kind.EXPENSE),
            ("Salario", Category.Kind.INCOME),
        ]
        Category.objects.bulk_create(
            [
                Category(user=instance, name=name, kind=kind)
                for name, kind in default_categories
            ],
            ignore_conflicts=True,
        )
