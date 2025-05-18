#!/bin/bash

# Ожидаем запуск PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "✅ PostgreSQL is up."

# Применяем миграции
echo "🛠 Running migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Собираем статику
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput
python manage.py generate_fake_data

# Создаём пользователей (только если их нет)
echo "👥 Creating default users..."
python manage.py shell << EOF
from django.contrib.auth.models import User

if not User.objects.filter(username='user1').exists():
    User.objects.create_user('user1', 'user1@example.com', 'password1')
    print("✅ Created user1")

if not User.objects.filter(username='user2').exists():
    User.objects.create_user('user2', 'user2@example.com', 'password2')
    print("✅ Created user2")
EOF

# Запуск приложения (передаём всё как есть, например gunicorn ...)
exec "$@"
