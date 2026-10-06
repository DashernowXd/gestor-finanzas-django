"""
Django Reference Implementation: Models, Forms, Views (FBV & CBV), and Admin.
"""

from django.db import models
from django.conf import settings
from django import forms
from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView
from django.urls import reverse_lazy
from django.contrib import admin
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin


# ==============================================================================
# 1. MODELS
# ==============================================================================

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = "BR", "Borrador"
        PUBLICADO = "PB", "Publicado"
        ARCHIVADO = "AR", "Archivado"

    nombre = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="productos"
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="productos_registrados"
    )
    estado = models.CharField(
        max_length=2,
        choices=Estado.choices,
        default=Estado.BORRADOR
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["estado", "-creado_en"]),
        ]
        ordering = ["-creado_en"]

    def __str__(self):
        return self.nombre


# ==============================================================================
# 2. FORMS
# ==============================================================================

class ProductoForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = ["nombre", "slug", "precio", "stock", "categoria", "estado"]
        widgets = {
            "nombre": forms.TextInput(attrs={"class": "form-control"}),
            "slug": forms.TextInput(attrs={"class": "form-control"}),
            "precio": forms.NumberInput(attrs={"class": "form-control", "step": "0.01"}),
            "stock": forms.NumberInput(attrs={"class": "form-control"}),
            "categoria": forms.Select(attrs={"class": "form-select"}),
            "estado": forms.Select(attrs={"class": "form-select"}),
        }

    def clean_precio(self):
        precio = self.cleaned_data.get("precio")
        if precio is not None and precio <= 0:
            raise forms.ValidationError("El precio debe ser un número estrictamente positivo.")
        return precio


# ==============================================================================
# 3. FUNCTION-BASED VIEWS (FBV)
# ==============================================================================

def lista_productos_fbv(request):
    """Lists published products, optimizing database queries with select_related."""
    productos = Producto.objects.filter(estado=Producto.Estado.PUBLICADO).select_related("categoria")
    return render(request, "core/lista.html", {"productos": productos})


def detalle_producto_fbv(request, slug):
    """Displays a single published product or returns 404."""
    producto = get_object_or_404(
        Producto.objects.select_related("categoria"),
        slug=slug,
        estado=Producto.Estado.PUBLICADO
    )
    return render(request, "core/detalle.html", {"producto": producto})


def crear_producto_fbv(request):
    """Processes product creation with CSRF validation and form saving."""
    if request.method == "POST":
        form = ProductoForm(request.POST)
        if form.is_valid():
            nuevo_producto = form.save(commit=False)
            if request.user.is_authenticated:
                nuevo_producto.creado_por = request.user
            nuevo_producto.save()
            return redirect("core:lista")
    else:
        form = ProductoForm()

    return render(request, "core/formulario.html", {"form": form})


# ==============================================================================
# 4. CLASS-BASED VIEWS (CBV)
# ==============================================================================

class ProductoListView(ListView):
    model = Producto
    template_name = "core/lista.html"
    context_object_name = "productos"
    paginate_by = 25

    def get_queryset(self):
        return Producto.objects.filter(
            estado=Producto.Estado.PUBLICADO
        ).select_related("categoria")


class ProductoDetailView(DetailView):
    model = Producto
    template_name = "core/detalle.html"
    context_object_name = "producto"

    def get_queryset(self):
        return Producto.objects.filter(
            estado=Producto.Estado.PUBLICADO
        ).select_related("categoria")


class ProductoCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    model = Producto
    form_class = ProductoForm
    template_name = "core/formulario.html"
    success_url = reverse_lazy("core:lista")
    permission_required = "core.add_producto"

    def form_valid(self, form):
        form.instance.creado_por = self.request.user
        return super().form_valid(form)


# ==============================================================================
# 5. DJANGO ADMIN REGISTRATION
# ==============================================================================

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "precio", "stock", "categoria", "estado", "creado_en")
    list_filter = ("estado", "categoria", "creado_en")
    search_fields = ("nombre", "slug")
    prepopulated_fields = {"slug": ("nombre",)}
    list_editable = ("precio", "stock", "estado")
    raw_id_fields = ("creado_por",)
    date_hierarchy = "creado_en"


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "slug")
    search_fields = ("nombre",)
    prepopulated_fields = {"slug": ("nombre",)}
