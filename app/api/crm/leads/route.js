import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { Lead, Activity } from '../../../../lib/models/CRM'
import jwt from 'jsonwebtoken'

// Helper function to verify JWT token
function verifyTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {})
      token = cookies.accessToken || cookies.token || cookies.authToken || cookies.access_token
    }
  }
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    if (decoded.sub && decoded.tenantId && decoded.type === 'access') {
      return {
        userId: decoded.sub,
        email: decoded.email,
        tenantId: decoded.tenantId,
        tenantSlug: decoded.tenantSlug,
        roles: decoded.roles,
        accessLevel: decoded.accessLevel,
        id: decoded.sub,
        fullName: decoded.fullName || decoded.email
      }
    }
    return decoded
  } catch (error) {
    return null
  }
}

// GET /api/crm/leads - Отримати всі ліди
export async function GET(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    
    // Фільтри
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const source = searchParams.get('source')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // Побудова запиту
    let query = { tenantId: user.tenantId }
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (assignedTo && assignedTo !== 'all') {
      query.assignedTo = assignedTo
    }
    
    if (source && source !== 'all') {
      query.source = source
    }
    
    // Пошук по тексту
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Lead.countDocuments(query)
    
    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Помилка завантаження лідів' }, { status: 500 })
  }
}

// POST /api/crm/leads - Створити новий лід
export async function POST(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    // Валідація
    if (!body.title || !body.contactPerson) {
      return NextResponse.json({ 
        error: 'Обовʼязкові поля: назва ліда та контактна особа' 
      }, { status: 400 })
    }
    
    // Створення ліда
    const leadData = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: body.title,
      source: body.source || 'manual',
      status: body.status || 'new',
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      company: body.company,
      position: body.position,
      description: body.description,
      expectedAmount: body.expectedAmount || 0,
      probability: body.probability || 0,
      assignedTo: body.assignedTo || user.id,
      assignedToName: body.assignedToName || user.fullName,
      createdBy: user.id,
      tenantId: user.tenantId,
      tags: body.tags || [],
      nextFollowUpDate: body.nextFollowUpDate,
      customFields: body.customFields || {}
    }
    
    const lead = await Lead.create(leadData)
    
    // Створити активність
    await Activity.create({
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType: 'lead',
      entityId: lead.id,
      type: 'status_change',
      title: 'Лід створено',
      description: `Створено новий лід "${lead.title}"`,
      newValue: lead.status,
      createdBy: user.id,
      createdByName: user.fullName,
      tenantId: user.tenantId
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Лід створено успішно',
      lead
    })
    
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Помилка створення ліда' }, { status: 500 })
  }
}

// PUT /api/crm/leads - Оновити лід
export async function PUT(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID ліда обовʼязковий' }, { status: 400 })
    }
    
    const existingLead = await Lead.findOne({ 
      id: body.id, 
      tenantId: user.tenantId 
    })
    
    if (!existingLead) {
      return NextResponse.json({ error: 'Лід не знайдено' }, { status: 404 })
    }
    
    // Збереження старих значень для активності
    const oldStatus = existingLead.status
    
    // Оновлення
    const updateData = {
      ...body,
      updatedAt: new Date(),
      tenantId: user.tenantId
    }
    
    delete updateData.id // Не можна змінювати ID
    delete updateData.createdAt // Не можна змінювати дату створення
    delete updateData.createdBy // Не можна змінювати автора
    
    const updatedLead = await Lead.findOneAndUpdate(
      { id: body.id, tenantId: user.tenantId },
      updateData,
      { new: true, lean: true }
    )
    
    // Створити активність при зміні статусу
    if (oldStatus !== updatedLead.status) {
      await Activity.create({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'lead',
        entityId: updatedLead.id,
        type: 'status_change',
        title: 'Змінено статус ліда',
        description: `Статус змінено з "${getStatusText(oldStatus)}" на "${getStatusText(updatedLead.status)}"`,
        oldValue: oldStatus,
        newValue: updatedLead.status,
        createdBy: user.id,
        createdByName: user.fullName,
        tenantId: user.tenantId
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Лід оновлено успішно',
      lead: updatedLead
    })
    
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Помилка оновлення ліда' }, { status: 500 })
  }
}

// Допоміжна функція для отримання тексту статусу
function getStatusText(status) {
  const statusMap = {
    'new': 'Новий',
    'in_progress': 'В роботі',
    'qualified': 'Кваліфікований',
    'rejected': 'Відхилений'
  }
  return statusMap[status] || status
}