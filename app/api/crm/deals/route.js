import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { Deal, Lead, Activity } from '../../../../lib/models/CRM'
import { verifyToken } from '../../../../lib/ssoAuth'

// GET /api/crm/deals - Отримати всі угоди
export async function GET(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    
    // Фільтри
    const stage = searchParams.get('stage')
    const assignedTo = searchParams.get('assignedTo')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // Побудова запиту
    let query = { tenantId: user.tenantId }
    
    if (stage && stage !== 'all') {
      query.stage = stage
    }
    
    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo
    }
    
    // Пошук по тексту
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientCompany: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const deals = await Deal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Deal.countDocuments(query)
    
    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Помилка завантаження угод' }, { status: 500 })
  }
}

// POST /api/crm/deals - Створити нову угоду
export async function POST(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    // Валідація
    if (!body.title || !body.clientName || body.amount === undefined) {
      return NextResponse.json({ 
        error: 'Обовʼязкові поля: назва угоди, клієнт та сума' 
      }, { status: 400 })
    }
    
    // Створення угоди
    const dealData = {
      id: `deal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: body.title,
      stage: body.stage || 'negotiation',
      clientType: body.clientType || 'individual',
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientPhone: body.clientPhone,
      clientCompany: body.clientCompany,
      amount: body.amount,
      currency: body.currency || 'UAH',
      probability: body.probability || 50,
      expectedCloseDate: body.expectedCloseDate,
      assignedTo: body.assignedTo || user.id,
      assignedToName: body.assignedToName || user.fullName,
      leadId: body.leadId,
      products: body.products || [],
      notes: body.notes,
      tags: body.tags || [],
      createdBy: user.id,
      tenantId: user.tenantId
    }
    
    const deal = await Deal.create(dealData)
    
    // Якщо угода створена з ліда, оновити лід
    if (body.leadId) {
      await Lead.findOneAndUpdate(
        { id: body.leadId, tenantId: user.tenantId },
        { 
          $push: { relatedDeals: deal.id },
          status: 'qualified',
          updatedAt: new Date()
        }
      )
    }
    
    // Створити активність
    await Activity.create({
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'deal',
      entityId: deal.id,
      type: 'status_change',
      title: 'Угоду створено',
      description: `Створено нову угоду "${deal.title}" на суму ${deal.amount} ${deal.currency}`,
      newValue: deal.stage,
      createdBy: user.id,
      createdByName: user.fullName,
      tenantId: user.tenantId
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Угоду створено успішно',
      deal
    })
    
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Помилка створення угоди' }, { status: 500 })
  }
}

// PUT /api/crm/deals - Оновити угоду
export async function PUT(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID угоди обовʼязковий' }, { status: 400 })
    }
    
    const existingDeal = await Deal.findOne({ 
      id: body.id, 
      tenantId: user.tenantId 
    })
    
    if (!existingDeal) {
      return NextResponse.json({ error: 'Угоду не знайдено' }, { status: 404 })
    }
    
    // Збереження старих значень для активності
    const oldStage = existingDeal.stage
    const oldAmount = existingDeal.amount
    
    // Оновлення
    const updateData = {
      ...body,
      updatedAt: new Date(),
      tenantId: user.tenantId
    }
    
    // Якщо угода закрита, встановити дату закриття
    if ((body.stage === 'closed_won' || body.stage === 'closed_lost') && !updateData.actualCloseDate) {
      updateData.actualCloseDate = new Date()
    }
    
    delete updateData.id
    delete updateData.createdAt
    delete updateData.createdBy
    
    const updatedDeal = await Deal.findOneAndUpdate(
      { id: body.id, tenantId: user.tenantId },
      updateData,
      { new: true, lean: true }
    )
    
    // Створити активність при зміні етапу
    if (oldStage !== updatedDeal.stage) {
      await Activity.create({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'deal',
        entityId: updatedDeal.id,
        type: 'status_change',
        title: 'Змінено етап угоди',
        description: `Етап змінено з "${getStageText(oldStage)}" на "${getStageText(updatedDeal.stage)}"`,
        oldValue: oldStage,
        newValue: updatedDeal.stage,
        createdBy: user.id,
        createdByName: user.fullName,
        tenantId: user.tenantId
      })
    }
    
    // Створити активність при зміні суми
    if (oldAmount !== updatedDeal.amount) {
      await Activity.create({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'deal',
        entityId: updatedDeal.id,
        type: 'field_update',
        title: 'Змінено суму угоди',
        description: `Сума змінена з ${oldAmount} на ${updatedDeal.amount} ${updatedDeal.currency}`,
        oldValue: oldAmount.toString(),
        newValue: updatedDeal.amount.toString(),
        createdBy: user.id,
        createdByName: user.fullName,
        tenantId: user.tenantId
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Угоду оновлено успішно',
      deal: updatedDeal
    })
    
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json({ error: 'Помилка оновлення угоди' }, { status: 500 })
  }
}

// Допоміжна функція для отримання тексту етапу
function getStageText(stage) {
  const stageMap = {
    'negotiation': 'Перемовини',
    'proposal': 'Пропозиція',
    'invoice_sent': 'Рахунок відправлено',
    'payment_pending': 'Очікування оплати',
    'closed_won': 'Виграна',
    'closed_lost': 'Програна'
  }
  return stageMap[stage] || stage
}