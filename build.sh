#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Iniciando proceso de compilación y despliegue (Render / Linux)..."

if [ -f "requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
    python manage.py collectstatic --noinput
    python manage.py migrate
elif [ -f "backend/requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r backend/requirements.txt
    python backend/manage.py collectstatic --noinput
    python backend/manage.py migrate
fi

echo "==> Compilación y migraciones finalizadas exitosamente."
