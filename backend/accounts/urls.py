from django.urls import path
from accounts.views import (
    RegisterView,
    CustomLoginView,
    CustomRefreshView,
    UserProfileView,
    ChangePasswordView,
    DeleteAccountView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", CustomLoginView.as_view(), name="auth-login"),
    path("refresh/", CustomRefreshView.as_view(), name="auth-refresh"),
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="user-change-password"),
    path("delete-account/", DeleteAccountView.as_view(), name="user-delete-account"),
]
