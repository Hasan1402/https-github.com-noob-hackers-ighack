import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import { BusinessTrip, TripExpense, TripTemplate } from '../../../lib/models/BusinessTrip'
import { verifyToken } from '../../../lib/ssoAuth'

// GET /api/business-trips - Отримати всі відрядження
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
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employeeId')
    const departmentId = searchParams.get('departmentId')
    const city = searchParams.get('city')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // Побудова запиту
    let query = { tenantId: user.tenantId }
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    if (employeeId && employeeId !== 'all') {
      query.employeeId = employeeId
    }
    
    if (departmentId && departmentId !== 'all') {
      query.departmentId = departmentId
    }
    
    if (city) {
      query['destination.city'] = { $regex: city, $options: 'i' }
    }
    
    // Фільтр по датах
    if (dateFrom || dateTo) {
      query.departureDate = {}
      if (dateFrom) query.departureDate.$gte = new Date(dateFrom)
      if (dateTo) query.departureDate.$lte = new Date(dateTo)
    }
    
    // Пошук по тексту
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { 'destination.city': { $regex: search, $options: 'i' } },
        { 'destination.facility': { $regex: search, $options: 'i' } },
        { purposeDescription: { $regex: search, $options: 'i' } },
        { tripNumber: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const trips = await BusinessTrip.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await BusinessTrip.countDocuments(query)
    
    // Підрахунок статистики
    const stats = await BusinessTrip.aggregate([
      { $match: { tenantId: user.tenantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$estimatedBudget.total' },
          totalExpenses: { $sum: '$actualExpenses.total' }
        }
      }
    ])
    
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalBudget: stat.totalBudget,
        totalExpenses: stat.totalExpenses
      }
      return acc
    }, {})
    
    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics: statusStats
    })
    
  } catch (error) {
    console.error('Error fetching business trips:', error)
    return NextResponse.json(
      { error: 'Помилка завантаження відряджень' },
      { status: 500 }
    )
  }
}

// POST /api/business-trips - Створити нове відрядження
export async function POST(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const data = await request.json()
    
    // Валідація обов'язкових полів
    if (!data.employeeId || !data.destination?.city || !data.purpose || !data.departureDate || !data.returnDate) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: співробітник, місце призначення, мета, дати' },
        { status: 400 }
      )
    }
    
    // Валідація дат
    const departureDate = new Date(data.departureDate)
    const returnDate = new Date(data.returnDate)
    
    if (returnDate <= departureDate) {
      return NextResponse.json(
        { error: 'Дата повернення повинна бути пізніше дати виїзду' },
        { status: 400 }
      )
    }
    
    // Генерація номеру відрядження
    const currentYear = new Date().getFullYear()
    const count = await BusinessTrip.countDocuments({ 
      tenantId: user.tenantId,
      createdAt: { 
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1)
      }
    })
    const tripNumber = `ВД-${currentYear}-${String(count + 1).padStart(4, '0')}`
    
    // Розрахунок тривалості
    const duration = Math.ceil((returnDate - departureDate) / (1000 * 60 * 60 * 24))
    
    // Створення відрядження
    const newTrip = new BusinessTrip({
      ...data,
      tripNumber,
      duration,
      tenantId: user.tenantId,
      createdBy: user.id,
      status: data.status || 'draft',
      approvalWorkflow: [{
        stage: 'manager',
        status: 'pending'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    await newTrip.save()
    
    return NextResponse.json(newTrip, { status: 201 })
    
  } catch (error) {
    console.error('Error creating business trip:', error)
    return NextResponse.json(
      { error: 'Помилка створення відрядження' },
      { status: 500 }
    )
  }
}

// PUT /api/business-trips - Оновити відрядження
export async function PUT(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const data = await request.json()
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID відрядження не вказано' },
        { status: 400 }
      )
    }
    
    // Валідація дат (якщо оновлюються)
    if (updateData.departureDate && updateData.returnDate) {
      const departureDate = new Date(updateData.departureDate)
      const returnDate = new Date(updateData.returnDate)
      
      if (returnDate <= departureDate) {
        return NextResponse.json(
          { error: 'Дата повернення повинна бути пізніше дати виїзду' },
          { status: 400 }
        )
      }
      
      // Оновлення тривалості
      updateData.duration = Math.ceil((returnDate - departureDate) / (1000 * 60 * 60 * 24))
    }
    
    const updatedTrip = await BusinessTrip.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId },
      { 
        ...updateData,
        updatedBy: user.id,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!updatedTrip) {
      return NextResponse.json(
        { error: 'Відрядження не знайдено' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedTrip)
    
  } catch (error) {
    console.error('Error updating business trip:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення відрядження' },
      { status: 500 }
    )
  }
}

// DELETE /api/business-trips - Видалити відрядження
export async function DELETE(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID відрядження не вказано' },
        { status: 400 }
      )
    }
    
    // Перевірка, чи можна видалити відрядження
    const trip = await BusinessTrip.findOne({ _id: id, tenantId: user.tenantId })
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Відрядження не знайдено' },
        { status: 404 }
      )
    }
    
    // Не дозволяти видаляти затверджені або завершені відрядження
    if (['approved', 'in_progress', 'completed'].includes(trip.status)) {
      return NextResponse.json(
        { error: 'Неможливо видалити затверджене або завершене відрядження' },
        { status: 400 }
      )
    }
    
    await BusinessTrip.findByIdAndDelete(id)
    
    // Також видалити пов'язані витрати
    await TripExpense.deleteMany({ tripId: id })
    
    return NextResponse.json({ 
      message: 'Відрядження успішно видалено'
    })
    
  } catch (error) {
    console.error('Error deleting business trip:', error)
    return NextResponse.json(
      { error: 'Помилка видалення відрядження' },
      { status: 500 }
    )
  }
}