#!/bin/bash

echo "📊 Створення демонстраційних даних для ТИС КІС..."

# Отримуємо токени
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@tiskis.test","password":"Admin123!"}' | jq -r '.token')
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"manager@tiskis.test","password":"Manager123!"}' | jq -r '.token')
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"user@tiskis.test","password":"User123!"}' | jq -r '.token')

echo "✅ Токени отримано"

# Створюємо події в календарі
echo "📅 Створення подій в календарі..."

curl -s -X POST http://localhost:3000/api/calendar/events \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Річна нарада керівництва",
    "description": "Підбиття підсумків року та планування на наступний",
    "startDate": "2024-12-15T10:00:00Z",
    "endDate": "2024-12-15T12:00:00Z",
    "type": "meeting",
    "location": "Конференц-зал"
  }' >/dev/null

curl -s -X POST http://localhost:3000/api/calendar/events \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Дедлайн квартальних звітів",
    "description": "Останній день подачі звітів за 4 квартал",
    "startDate": "2024-12-31T23:59:00Z",
    "type": "deadline"
  }' >/dev/null

curl -s -X POST http://localhost:3000/api/calendar/events \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новорічні свята",
    "description": "Офіційні вихідні дні",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-08T23:59:00Z",
    "type": "holiday"
  }' >/dev/null

# Створюємо завдання
echo "📋 Створення завдань..."

curl -s -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Оновити систему безпеки",
    "description": "Встановити останні патчі та оновлення безпеки",
    "dueDate": "2024-12-20T17:00:00Z",
    "priority": "high",
    "category": "security"
  }' >/dev/null

curl -s -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Підготувати бюджет на 2025 рік",
    "description": "Розрахувати витрати та доходи на наступний рік",
    "dueDate": "2024-12-25T12:00:00Z",
    "priority": "urgent",
    "category": "planning"
  }' >/dev/null

curl -s -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Перевірити документацію проекту",
    "description": "Переглянути та оновити технічну документацію",
    "dueDate": "2024-12-18T15:00:00Z",
    "priority": "medium",
    "category": "documentation"
  }' >/dev/null

# Оновлюємо статус завдань
echo "🔄 Оновлення статусів завдань..."

# Отримаємо ID завдань
TASKS_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/api/tasks)
TASK_ID=$(echo $TASKS_RESPONSE | jq -r '.[0].id // empty')

if [ ! -z "$TASK_ID" ]; then
    curl -s -X PUT http://localhost:3000/api/tasks/$TASK_ID/status \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "status": "completed",
        "comment": "Завдання успішно завершено"
      }' >/dev/null
fi

echo "✅ Демонстраційні дані створено!"
echo ""
echo "📊 Статистика:"
echo "   - Події в календарі: 3"
echo "   - Завдання: 3+"
echo "   - Користувачі: 3"
echo ""
echo "🎯 Тепер можна тестувати всі функції системи!"