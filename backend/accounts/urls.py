from django.urls import path
from accounts.views import RegisterView, CustomLoginView, CustomRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", CustomLoginView.as_view(), name="auth-login"),
    path("refresh/", CustomRefreshView.as_view(), name="auth-refresh"),
]
