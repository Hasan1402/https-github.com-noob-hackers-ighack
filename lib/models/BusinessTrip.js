import mongoose from 'mongoose'

// Business Trip Schema - Заявки на відрядження
const BusinessTripSchema = new mongoose.Schema({
  // Основна інформація
  tripNumber: {
    type: String,
    required: true,
    unique: true, // Автоматично генерований номер відрядження
    index: true
  },
  
  // Співробітник
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeePosition: {
    type: String,
    required: true
  },
  departmentId: {
    type: String,
    required: true
  },
  departmentName: {
    type: String,
    required: true
  },
  
  // Деталі поїздки
  destination: {
    city: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    facility: String, // назва відділення/хабу/офісу
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Мета та завдання
  purpose: {
    type: String,
    required: true,
    enum: [
      'warehouse_inspection', // Перевірка складу
      'client_meeting',       // Зустріч з клієнтом
      'partner_negotiations', // Переговори з партнерами
      'audit',               // Аудит
      'training',            // Навчання
      'conference',          // Конференція
      'maintenance',         // Технічне обслуговування
      'other'               // Інше
    ]
  },
  purposeDescription: {
    type: String,
    required: true
  },
  
  // Дати
  departureDate: {
    type: Date,
    required: true,
    index: true
  },
  returnDate: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number, // кількість днів
    required: true
  },
  
  // Транспорт
  transportType: {
    type: String,
    required: true,
    enum: [
      'company_car',    // Службове авто
      'personal_car',   // Особисте авто
      'train',          // Потяг
      'bus',            // Автобус
      'plane',          // Літак
      'other'           // Інше
    ]
  },
  transportDetails: {
    vehicleNumber: String,      // номер службового авто
    driverName: String,         // водій
    route: String,              // маршрут
    estimatedDistance: Number,  // відстань в км
    estimatedFuelCost: Number   // орієнтовна вартість палива
  },
  
  // Бюджет
  estimatedBudget: {
    transport: {
      type: Number,
      default: 0
    },
    accommodation: {
      type: Number,
      default: 0
    },
    meals: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  
  // Статус заявки
  status: {
    type: String,
    required: true,
    enum: [
      'draft',           // Чернетка
      'submitted',       // Подано на розгляд
      'manager_review',  // На розгляді у керівника
      'finance_review',  // На фінансовому погодженні
      'approved',        // Затверджено
      'rejected',        // Відхилено
      'in_progress',     // В процесі (поїздка триває)
      'completed',       // Завершено
      'report_pending'   // Очікує звіту
    ],
    default: 'draft',
    index: true
  },
  
  // Процес узгодження
  approvalWorkflow: [{
    stage: {
      type: String,
      enum: ['manager', 'finance', 'final']
    },
    approverName: String,
    approverId: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    comment: String,
    processedAt: Date
  }],
  
  // Фактичні витрати (заповнюється після поїздки)
  actualExpenses: {
    transport: {
      type: Number,
      default: 0
    },
    accommodation: {
      type: Number,
      default: 0
    },
    meals: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Прикріплені документи
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['application', 'order', 'report', 'receipt', 'invoice', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: String
  }],
  
  // Звіт після відрядження
  tripReport: {
    summary: String,           // загальний підсумок
    tasksCompleted: [String],  // виконані завдання
    results: String,           // результати поїздки
    recommendations: String,   // рекомендації
    reportDate: Date
  },
  
  // Нотатки та коментарі
  notes: String,
  
  // Системні поля
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedBy: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Індекси для оптимізації пошуку
BusinessTripSchema.index({ tenantId: 1, status: 1 })
BusinessTripSchema.index({ tenantId: 1, employeeId: 1 })
BusinessTripSchema.index({ tenantId: 1, departureDate: 1 })
BusinessTripSchema.index({ tenantId: 1, 'destination.city': 1 })

// Trip Expense Schema - Детальні витрати по відрядженню
const TripExpenseSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    index: true
  },
  
  // Деталі витрати
  category: {
    type: String,
    required: true,
    enum: [
      'transport',      // Транспорт
      'fuel',          // Паливо
      'accommodation', // Проживання
      'meals',         // Харчування
      'communication', // Зв'язок
      'materials',     // Матеріали
      'entertainment', // Представницькі витрати
      'other'          // Інше
    ]
  },
  subcategory: String, // деталізація категорії
  
  description: {
    type: String,
    required: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'UAH'
  },
  
  // Дата та час витрати
  expenseDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Документи (чеки, рахунки)
  receipts: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Статус витрати
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Коментарі
  comment: String,
  approverComment: String,
  
  // Системні поля
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Індекси
TripExpenseSchema.index({ tenantId: 1, tripId: 1 })
TripExpenseSchema.index({ tenantId: 1, category: 1 })

// Trip Template Schema - Шаблони для частих поїздок
const TripTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  // Призначення за замовчуванням
  destination: {
    city: String,
    address: String,
    facility: String
  },
  
  purpose: String,
  purposeDescription: String,
  
  // Типовий бюджет
  typicalBudget: {
    transport: Number,
    accommodation: Number,
    meals: Number,
    other: Number,
    total: Number
  },
  
  // Типова тривалість
  typicalDuration: Number,
  
  transportType: String,
  
  // Системні поля
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
})

// Створення моделей
const BusinessTrip = mongoose.models.BusinessTrip || mongoose.model('BusinessTrip', BusinessTripSchema)
const TripExpense = mongoose.models.TripExpense || mongoose.model('TripExpense', TripExpenseSchema)
const TripTemplate = mongoose.models.TripTemplate || mongoose.model('TripTemplate', TripTemplateSchema)

export { BusinessTrip, TripExpense, TripTemplate }