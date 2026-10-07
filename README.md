# 🏛️ Atelier Finanzas — API REST de Presupuesto y Finanzas Personales

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![Django 5.1](https://img.shields.io/badge/Django-5.1-green.svg)](https://www.djangoproject.com/)
[![DRF 3.15+](https://img.shields.io/badge/DRF-3.15%2B-red.svg)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791.svg)](https://www.postgresql.org/)
[![Coverage 94%](https://img.shields.io/badge/Coverage-94%25-brightgreen.svg)](#-pruebas-automatizadas-y-cobertura)
[![OpenAPI / Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-orange.svg)](#-documentación-interactiva-swagger)

> API REST desarrollada para la gestión deliberada de presupuestos y finanzas personales. Permite a los usuarios registrar ingresos y gastos clasificados en categorías esenciales, calculando su balance general y distribución contable directamente en el motor de base de datos.
>
> Diseñada siguiendo estándares de ingeniería backend para portafolio junior: código limpio, arquitectura Twelve-Factor, validación estricta en 3 capas, autenticación JWT segura y aislamiento total multi-inquilino.

---

## 🏗️ Flujo de Arquitectura de una Petición

```mermaid
flowchart LR
    C[Cliente React] -->|HTTPS + Bearer JWT| R[urls.py /api/v1/]
    R --> V[ViewSet / APIView]
    V --> P{¿Autenticado?}
    P -->|No| E1[HTTP 401 Unauthorized]
    P -->|Sí| S[Serializer Valida Capa 1]
    S -->|Inválido| E2[HTTP 400 + Detalle por Campo]
    S -->|Válido| ORM[Django ORM Capa 2]
    ORM --> DB[(PostgreSQL / SQLite Capa 3)]
```

---

## 📊 Modelo de Datos (Diagrama Entidad-Relación)

```mermaid
erDiagram
    USER ||--o{ CATEGORY : "posee (1:N)"
    USER ||--o{ TRANSACTION : "registra (1:N)"
    CATEGORY ||--o{ TRANSACTION : "clasifica (PROTECT)"
    
    USER {
        int id PK
        string email UK "Identificador de autenticación"
        string username
        datetime date_joined
    }
    CATEGORY {
        int id PK
        int user_id FK "Aislamiento por usuario"
        string name "Único por usuario"
        string kind "INCOME | EXPENSE"
        datetime created_at
    }
    TRANSACTION {
        int id PK
        int user_id FK "Aislamiento por usuario"
        int category_id FK "on_delete=PROTECT"
        decimal amount "DecimalField(12, 2) > 0.00"
        string kind "INCOME | EXPENSE"
        date date "No futura"
        string description "Máx 255 chars"
        datetime created_at
    }
```

### Reglas de Integridad Garantizadas:
1. **Precisión Monetaria:** El dinero se maneja estrictamente con `DecimalField(max_digits=12, decimal_places=2)`, evitando para siempre los errores de coma flotante de `float`.
2. **Restricción de Signo:** `CheckConstraint(amount > 0.00)` a nivel de base de datos. La dirección del dinero la define `kind`, nunca signos negativos arbitrarios.
3. **Unicidad por Cuenta:** `UniqueConstraint(fields=["user", "name"])` en `Category` para que un usuario no duplique nombres de categorías.
4. **Protección Histórica (`on_delete=models.PROTECT`):** Si un usuario intenta borrar una categoría con transacciones asociadas, la base de datos bloquea el borrado y la API responde **HTTP 409 Conflict** con mensaje claro.
5. **Categorías Semilla Automáticas:** Al registrarse cualquier usuario, una señal Django (`post_save`) crea inmediatamente sus 4 categorías canónicas: *Alimentos* (`EXPENSE`), *Servicios* (`EXPENSE`), *Ocio* (`EXPENSE`) y *Salario* (`INCOME`).

---

## 🔐 Autenticación JWT: ¿Qué es y por qué dos duraciones?

```mermaid
sequenceDiagram
    participant U as Cliente (React)
    participant API as Django API
    U->>API: POST /api/v1/auth/login/ (email, password)
    API-->>U: access (~15 min) + refresh (~7 días)
    Note over U,API: Peticiones normales
    U->>API: GET /api/v1/transactions/ (Header: Bearer <access>)
    API-->>U: HTTP 200 (Solo datos del usuario autenticado)
    Note over U,API: El Access Token expira tras 15 minutos
    U->>API: POST /api/v1/auth/refresh/ (refresh)
    API-->>U: Nuevo access token (~15 min)
```

### 💡 Concepto Clave:
* **¿Qué es un JWT (JSON Web Token)?**
  Es un estándar abierto (RFC 7519) que contiene un payload JSON firmado criptográficamente por el servidor. Permite autenticación sin estado (*stateless*), por lo que la base de datos no necesita consultar sesiones en cada petición.
* **¿Por qué el Access Token y el Refresh Token duran distinto?**
  El **Access Token** viaja continuamente en la cabecera `Authorization: Bearer <token>` de cada petición HTTP. Al tener una vida corta (**~15 minutos**), si llegara a interceptarse, su ventana de peligro es mínima. El **Refresh Token** se almacena de forma segura y tiene una vida más larga (**~7 días**); solo se envía a un endpoint específico (`/auth/refresh/`) para obtener un nuevo token de acceso sin obligar al usuario a escribir su contraseña constantemente.

---

## 🛡️ Validación en 3 Capas

| Capa | Dónde se ejecuta | Reglas aplicadas |
|---|---|---|
| **Capa 1: Serializer** | `finance/serializers.py` | Formato JSON, monto entre 0.01 y 999,999,999.99, descripción ≤ 255 caracteres, fecha no futura, coherencia obligatoria de tipo (`kind` de transacción igual al `kind` de la categoría) y validación de que la categoría pertenezca al usuario. |
| **Capa 2: Modelo** | `finance/models.py` (`clean()`) | Validación de integridad en el ORM antes de guardar (`full_clean()`), protegiendo operaciones ejecutadas desde scripts, shell o tareas en segundo plano. |
| **Capa 3: Base de Datos** | Motor PostgreSQL / SQLite | Restricciones `CHECK (amount > 0)`, `UNIQUE (user_id, name)` y claves foráneas con `ON DELETE RESTRICT/PROTECT`. |

---

## 🛣️ Catálogo de Endpoints (v1)

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| `GET` | `/` | Redirección automática a la documentación Swagger | Pública |
| `GET` | `/api/v1/health/` | Healthcheck para balanceadores de carga / Render | Pública |
| `POST` | `/api/v1/auth/register/` | Registro de usuario (crea categorías base) | Pública |
| `POST` | `/api/v1/auth/login/` | Iniciar sesión (devuelve `access` y `refresh`) | Pública |
| `POST` | `/api/v1/auth/refresh/` | Renovar `access` token a partir de `refresh` | Refresh Token |
| `GET` | `/api/v1/categories/` | Listar categorías del usuario autenticado | JWT |
| `POST` | `/api/v1/categories/` | Crear nueva categoría personalizada | JWT |
| `GET` | `/api/v1/categories/{id}/` | Detalle de categoría | JWT |
| `PATCH` | `/api/v1/categories/{id}/` | Editar categoría | JWT |
| `DELETE`| `/api/v1/categories/{id}/` | Borrar categoría (409 si tiene transacciones) | JWT |
| `GET` | `/api/v1/transactions/` | Listar transacciones (paginado 20, con filtros) | JWT |
| `POST` | `/api/v1/transactions/` | Crear transacción | JWT |
| `GET` | `/api/v1/transactions/{id}/`| Detalle de transacción | JWT |
| `PATCH` | `/api/v1/transactions/{id}/`| Editar transacción | JWT |
| `DELETE`| `/api/v1/transactions/{id}/`| Eliminar transacción | JWT |
| `GET` | `/api/v1/reports/summary/` | Balance general agregado (Ingresos, Gastos, Neto)| JWT |
| `GET` | `/api/v1/reports/by-category/`| Totales y cantidad agrupados por categoría | JWT |
| `GET` | `/api/docs/` | Interfaz interactiva Swagger UI | Pública |
| `GET` | `/api/schema/` | Esquema OpenAPI 3.0 en formato YAML/JSON | Pública |

### Filtros disponibles en `/api/v1/transactions/`:
* `?date_from=2026-10-01`: Transacciones con fecha mayor o igual a la indicada.
* `?date_to=2026-10-31`: Transacciones con fecha menor o igual a la indicada.
* `?category=3`: Filtrar por el ID de una categoría específica.
* `?kind=EXPENSE` o `?kind=INCOME`: Filtrar por tipo de movimiento.

---

## ⚡ Agregaciones en Base de Datos (Alto Rendimiento)

A diferencia de implementaciones ingenuas que cargan miles de registros en la memoria de Python con un bucle `for`, este proyecto delega los cálculos al motor relacional mediante SQL puro generado por el ORM:

```python
# 1. Balance general calculado en UNA sola consulta SQL:
Transaction.objects.filter(user=request.user).aggregate(
    income=Coalesce(Sum("amount", filter=Q(kind="INCOME")), Decimal("0.00")),
    expense=Coalesce(Sum("amount", filter=Q(kind="EXPENSE")), Decimal("0.00")),
    count=Count("id")
)

# 2. Desglose con GROUP BY en base de datos:
Transaction.objects.filter(user=request.user)
    .values("category__id", "category__name", "kind")
    .annotate(
        total=Coalesce(Sum("amount"), Decimal("0.00")),
        count=Count("id")
    )
    .order_by("kind", "-total")
```

---

## 💻 Instalación y Ejecución en Local

### Opción A: Entorno Virtual (Python 3.12+)

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   cd proyecto1
   ```

2. **Crear y activar el entorno virtual:**
   * En Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * En Linux / macOS:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Instalar dependencias:**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Configurar variables de entorno:**
   Copia el archivo de ejemplo a la carpeta `backend/`:
   ```bash
   # En Windows:
   copy backend\.env.example backend\.env
   # En Linux/macOS:
   cp backend/.env.example backend/.env
   ```
   *(Por defecto, `backend/.env` viene configurado para usar SQLite automáticamente en local).*

5. **Aplicar migraciones:**
   ```bash
   cd backend
   python manage.py migrate
   ```

6. **Iniciar servidor de desarrollo:**
   ```bash
   python manage.py runserver
   ```
   Abre tu navegador en **[http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)** para explorar la API.

---

### Opción B: Docker Compose (API + PostgreSQL)

Si prefieres ejecutar todo en contenedores con PostgreSQL real:
```bash
docker compose up --build
```
El contenedor ejecutará automáticamente las migraciones y levantará el backend en `http://localhost:8000/`.

---

## 🧪 Pruebas Automatizadas y Cobertura

La suite incluye pruebas para autenticación, CRUD, aislamiento por usuario, restricciones en base de datos y agregaciones matemáticas exactas.

Para correr las pruebas con reporte de cobertura detallado:
```bash
pytest --cov=backend --cov-report=term-missing
```

### Resultado de la Auditoría:
* **29 pruebas pasando al 100% (0 errores, 0 fallos).**
* **Cobertura de código: 94%** (superando la meta de ≥ 70%).

---

## ☁️ Guía de Despliegue Gratuito (Render + Neon)

```mermaid
flowchart LR
    GH[GitHub: Repositorio] -->|Push a main| RND[Render: Web Service Django + Gunicorn]
    RND --> DB[(Neon: PostgreSQL Serverless)]
    FE[React Frontend en Vercel / Netlify] -->|HTTPS + CORS| RND
```

### 1. Base de Datos en [Neon](https://neon.tech) (Plan Free)
1. Regístrate en Neon y crea un nuevo proyecto llamado `personal-finance-db`.
2. Copia la cadena de conexión (*Connection String*) en formato PostgreSQL:
   `postgresql://usuario:contraseña@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 2. Backend en [Render](https://render.com) (Plan Free)
1. Crea una cuenta en Render y selecciona **New > Web Service**.
2. Conecta tu repositorio de GitHub.
3. Configura los parámetros:
   * **Root Directory:** `backend` (o dejar vacío si usas la raíz).
   * **Runtime:** `Python 3`.
   * **Build Command:** `./build.sh` (o `bash build.sh`).
   * **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`.
4. En la pestaña **Environment Variables**, añade:
   * `DEBUG`: `False`
   * `SECRET_KEY`: Una cadena segura de más de 50 caracteres generada aleatoriamente.
   * `ALLOWED_HOSTS`: `tu-servicio.onrender.com`
   * `DATABASE_URL`: Pega la URL de conexión de Neon.
   * `CORS_ALLOWED_ORIGINS`: `https://tu-frontend.vercel.app` (URL de tu frontend en React).
   * `JWT_ACCESS_MINUTES`: `15`
   * `JWT_REFRESH_DAYS`: `7`
5. Haz clic en **Create Web Service**.

> [!WARNING]
> ### ⚠️ Aviso sobre los Límites Vigentes de los Planes Gratuitos (Cold Start)
> * **Render (Free Tier):** Los servicios web gratuitos entran en estado de "suspensión" (*sleep*) tras 15 minutos sin recibir peticiones para ahorrar cómputo. Cuando llega una nueva petición tras inactividad, el servidor experimenta un retraso de inicio en frío (*cold start*) de **~50 segundos** mientras se reactiva el contenedor. Esto es normal en planes gratuitos.
> * **Neon (Free Tier):** Ofrece 0.5 GiB de almacenamiento y cómputo serverless con ramas de base de datos. Si no hay conexiones activas, escala a cero recursos.

---

## 📈 Ejemplo de Consumo desde React con Chart.js

Para visualizar el endpoint `/api/v1/reports/by-category/` en tu aplicación de React:

```jsx
import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export function CategoryExpenseChart({ accessToken }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    async function fetchReport() {
      const response = await fetch("http://127.0.0.1:8000/api/v1/reports/by-category/?kind=EXPENSE", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      setChartData({
        labels: data.map((item) => item.category_name),
        datasets: [
          {
            label: "Total Gastado ($)",
            data: data.map((item) => parseFloat(item.total)),
            backgroundColor: ["#9E4535", "#686E78", "#2B5440", "#D97706"],
            borderWidth: 1,
          },
        ],
      });
    }
    fetchReport();
  }, [accessToken]);

  if (!chartData) return <p>Cargando balance por categorías...</p>;

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h3>Distribución de Gastos por Categoría</h3>
      <Doughnut data={chartData} />
    </div>
  );
}
```

---

## 🎨 Sistema de Diseño Táctil y Pantallas Generadas (Stitch)
El proyecto cuenta con especificaciones de interfaz de usuario sobria y táctil (sin componentes de neón, sin métricas inventadas y sin testimonios falsos):
* **Sistema de Diseño:** [`DESIGN.md`](./DESIGN.md)
* **Captura de Landing Page:** [`.stitch/designs/landing-page.png`](./.stitch/designs/landing-page.png)
* **Captura de Dashboard:** [`.stitch/designs/dashboard.png`](./.stitch/designs/dashboard.png)

---

## 📄 Licencia y Créditos
Desarrollado como proyecto de portafolio para demostrar buenas prácticas de arquitectura con **Django REST Framework**. Licencia MIT.
