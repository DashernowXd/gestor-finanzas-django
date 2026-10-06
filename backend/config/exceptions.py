"""
Custom DRF Exception Handler.
Converts specific Django exceptions (like ProtectedError) into clean, standard HTTP responses.
"""
from django.db.models import ProtectedError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Handles DRF exceptions and adds custom handling for Integrity / Protected errors.
    """
    response = exception_handler(exc, context)

    # If Django raised ProtectedError on ForeignKey deletion (on_delete=models.PROTECT)
    if isinstance(exc, ProtectedError):
        return Response(
            {
                "detail": "No es posible eliminar esta categoría porque contiene transacciones asociadas. Elimina o reclasifica las transacciones primero."
            },
            status=status.HTTP_409_CONFLICT,
        )

    return response
