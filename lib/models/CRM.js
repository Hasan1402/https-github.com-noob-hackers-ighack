import mongoose from 'mongoose'

// Ліди
const LeadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true }, // Назва ліда
  source: { type: String, enum: ['website', 'phone', 'email', 'social', 'referral', 'import', 'manual'], default: 'manual' },
  status: { type: String, enum: ['new', 'in_progress', 'qualified', 'rejected'], default: 'new' },
  
  // Контактна інформація
  contactPerson: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  company: { type: String },
  position: { type: String },
  
  // Деталі
  description: { type: String },
  expectedAmount: { type: Number, default: 0 },
  probability: { type: Number, default: 0, min: 0, max: 100 }, // Ймовірність закриття
  
  // Відповідальний
  assignedTo: { type: String, required: true }, // User ID
  assignedToName: { type: String, required: true },
  
  // Системні поля
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  
  // Додаткові поля
  tags: [{ type: String }],
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  
  // Активність
  lastContactDate: { type: Date },
  nextFollowUpDate: { type: Date },
  
  // Зв'язки
  relatedDeals: [{ type: String }], // Deal IDs
  
  // Метадані
  tenantId: { type: String, required: true }
}, { 
  timestamps: true,
  collection: 'crm_leads'
})

// Угоди
const DealSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ['negotiation', 'proposal', 'invoice_sent', 'payment_pending', 'closed_won', 'closed_lost'], 
    default: 'negotiation' 
  },
  
  // Клієнт
  clientType: { type: String, enum: ['individual', 'company'], default: 'individual' },
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientPhone: { type: String },
  clientCompany: { type: String },
  
  // Фінансові дані
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'UAH' },
  probability: { type: Number, default: 50, min: 0, max: 100 },
  
  // Дати
  expectedCloseDate: { type: Date },
  actualCloseDate: { type: Date },
  
  // Відповідальний
  assignedTo: { type: String, required: true },
  assignedToName: { type: String, required: true },
  
  // Зв'язки
  leadId: { type: String }, // Якщо угода створена з ліда
  products: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 }
  }],
  
  // Документи
  documents: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['contract', 'invoice', 'proposal', 'other'], required: true },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String }
  }],
  
  // Системні поля
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  
  // Додаткові поля
  notes: { type: String },
  tags: [{ type: String }],
  
  // Метадані
  tenantId: { type: String, required: true }
}, { 
  timestamps: true,
  collection: 'crm_deals'
})

// Товари
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true }, // Артикул
  description: { type: String },
  
  // Категорія
  categoryId: { type: String },
  categoryName: { type: String },
  
  // Фінансові дані
  price: { type: Number, required: true, default: 0 },
  cost: { type: Number, default: 0 }, // Собівартість
  currency: { type: String, default: 'UAH' },
  
  // Складський облік
  stockQuantity: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 0 }, // Мінімальний залишок
  unit: { type: String, default: 'шт' }, // Одиниця вимірювання
  
  // Статус
  isActive: { type: Boolean, default: true },
  isService: { type: Boolean, default: false }, // Товар чи послуга
  
  // Зображення та файли
  images: [{
    url: { type: String },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Податки
  vatRate: { type: Number, default: 20 }, // ПДВ у відсотках
  
  // Системні поля
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  
  // Метадані
  tenantId: { type: String, required: true }
}, { 
  timestamps: true,
  collection: 'crm_products'
})

// Категорії товарів
const ProductCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  parentId: { type: String }, // Для ієрархії категорій
  
  // Системні поля
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  
  // Метадані
  tenantId: { type: String, required: true }
}, { 
  timestamps: true,
  collection: 'crm_product_categories'
})

// Активності (історія змін, коментарі)
const ActivitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  entityType: { type: String, enum: ['lead', 'deal', 'product'], required: true },
  entityId: { type: String, required: true },
  
  type: { 
    type: String, 
    enum: ['status_change', 'comment', 'email', 'call', 'meeting', 'document_upload', 'field_update'],
    required: true 
  },
  
  title: { type: String, required: true },
  description: { type: String },
  
  // Дані активності
  oldValue: { type: String },
  newValue: { type: String },
  
  // Автор
  createdBy: { type: String, required: true },
  createdByName: { type: String, required: true },
  
  // Системні поля
  createdAt: { type: Date, default: Date.now },
  
  // Метадані
  tenantId: { type: String, required: true }
}, { 
  timestamps: true,
  collection: 'crm_activities'
})

// Експорт моделей
const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema)
const Deal = mongoose.models.Deal || mongoose.model('Deal', DealSchema)
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)
const ProductCategory = mongoose.models.ProductCategory || mongoose.model('ProductCategory', ProductCategorySchema)
const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)

export { Lead, Deal, Product, ProductCategory, Activity }