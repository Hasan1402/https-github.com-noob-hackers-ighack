#!/bin/bash

echo "🚀 Тестування системи ТИС КІС"
echo "=============================="

# Перевірка сервісів
echo "📋 Статус сервісів:"
sudo supervisorctl status

echo -e "\n🔍 Тестування API:"

# Тест локального API
echo "Локальний API (http://localhost:3000):"
curl -s http://localhost:3000/api/health | jq .

# Тест зовнішнього API  
echo -e "\nЗовнішній API (https://logistix-erp.preview.emergentagent.com):"
curl -s -w "HTTP_CODE: %{http_code}\n" https://logistix-erp.preview.emergentagent.com/api/health

# Створення тестових користувачів
echo -e "\n👤 Створення тестових користувачів:"

# Admin користувач
echo "Створення адміністратора..."
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tiskis.test",
    "password": "Admin123!",
    "fullName": "Тестовий Адміністратор",
    "role": "admin"
  }' | jq '.message // .error'

# Manager користувач
echo "Створення менеджера..."
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@tiskis.test", 
    "password": "Manager123!",
    "fullName": "Тестовий Менеджер",
    "role": "manager"
  }' | jq '.message // .error'

# User користувач
echo "Створення користувача..."
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@tiskis.test",
    "password": "User123!",
    "fullName": "Тестовий Користувач", 
    "role": "user"
  }' | jq '.message // .error'

echo -e "\n✅ Система готова до тестування!"
echo "🌐 Frontend URL: https://logistix-erp.preview.emergentagent.com"
echo ""
echo "🔑 Тестові акаунти:"
echo "   👑 Admin:   admin@tiskis.test   / Admin123!"
echo "   👨‍💼 Manager: manager@tiskis.test / Manager123!"  
echo "   👤 User:    user@tiskis.test    / User123!"
echo ""
echo "📝 Примітка: Якщо API не працює через браузер, спробуйте:"
echo "   1. Оновіть сторінку кілька разів"
echo "   2. Перевірте консоль браузера (F12)"
echo "   3. Спробуйте інкогніто режим"

# Отримання токена для демо
echo -e "\n🔐 Тест авторизації адміністратора:"
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tiskis.test",
    "password": "Admin123!"
  }' | jq -r '.token // empty')

if [ ! -z "$ADMIN_TOKEN" ]; then
    echo "✅ Авторизація успішна, токен отримано"
    
    echo -e "\n📊 Тест аналітики:"
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/analytics/dashboard | jq '.overview // .error'
    
else
    echo "❌ Помилка авторизації"
fi