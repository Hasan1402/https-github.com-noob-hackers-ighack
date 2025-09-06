import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { TripExpense, BusinessTrip } from '../../../../lib/models/BusinessTrip'
import { verifyToken } from '../../../../lib/ssoAuth'

// GET /api/business-trips/expenses - Отримати витрати по відрядженню
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
    
    const tripId = searchParams.get('tripId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    
    // Побудова запиту
    let query = { tenantId: user.tenantId }
    
    if (tripId) {
      query.tripId = tripId
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (status && status !== 'all') {
      query.status = status
    }
    
    const skip = (page - 1) * limit
    
    const expenses = await TripExpense.find(query)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await TripExpense.countDocuments(query)
    
    // Підрахунок сум по категоріях
    const categoryTotals = await TripExpense.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
    
    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      categoryTotals: categoryTotals.reduce((acc, cat) => {
        acc[cat._id] = {
          total: cat.total,
          count: cat.count
        }
        return acc
      }, {})
    })
    
  } catch (error) {
    console.error('Error fetching trip expenses:', error)
    return NextResponse.json(
      { error: 'Помилка завантаження витрат' },
      { status: 500 }
    )
  }
}

// POST /api/business-trips/expenses - Додати витрату по відрядженню
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
    if (!data.tripId || !data.category || !data.description || !data.amount || !data.expenseDate) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: відрядження, категорія, опис, сума, дата' },
        { status: 400 }
      )
    }
    
    // Перевірка існування відрядження
    const trip = await BusinessTrip.findOne({ 
      _id: data.tripId, 
      tenantId: user.tenantId 
    })
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Відрядження не знайдено' },
        { status: 404 }
      )
    }
    
    // Валідація суми
    if (data.amount <= 0) {
      return NextResponse.json(
        { error: 'Сума витрати повинна бути більше нуля' },
        { status: 400 }
      )
    }
    
    // Перевірка дати витрати
    const expenseDate = new Date(data.expenseDate)
    const tripStart = new Date(trip.departureDate)
    const tripEnd = new Date(trip.returnDate)
    
    if (expenseDate < tripStart || expenseDate > tripEnd) {
      return NextResponse.json(
        { error: 'Дата витрати повинна бути в межах періоду відрядження' },
        { status: 400 }
      )
    }
    
    const newExpense = new TripExpense({
      ...data,
      tenantId: user.tenantId,
      createdBy: user.id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    await newExpense.save()
    
    // Оновити загальну суму витрат у відрядженні
    await updateTripTotalExpenses(data.tripId)
    
    return NextResponse.json(newExpense, { status: 201 })
    
  } catch (error) {
    console.error('Error creating trip expense:', error)
    return NextResponse.json(
      { error: 'Помилка додавання витрати' },
      { status: 500 }
    )
  }
}

// PUT /api/business-trips/expenses - Оновити витрату
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
        { error: 'ID витрати не вказано' },
        { status: 400 }
      )
    }
    
    // Валідація суми
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return NextResponse.json(
        { error: 'Сума витрати повинна бути більше нуля' },
        { status: 400 }
      )
    }
    
    const updatedExpense = await TripExpense.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!updatedExpense) {
      return NextResponse.json(
        { error: 'Витрату не знайдено' },
        { status: 404 }
      )
    }
    
    // Оновити загальну суму витрат у відрядженні
    await updateTripTotalExpenses(updatedExpense.tripId)
    
    return NextResponse.json(updatedExpense)
    
  } catch (error) {
    console.error('Error updating trip expense:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення витрати' },
      { status: 500 }
    )
  }
}

// DELETE /api/business-trips/expenses - Видалити витрату
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
        { error: 'ID витрати не вказано' },
        { status: 400 }
      )
    }
    
    const expense = await TripExpense.findOne({ _id: id, tenantId: user.tenantId })
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Витрату не знайдено' },
        { status: 404 }
      )
    }
    
    const tripId = expense.tripId
    
    await TripExpense.findByIdAndDelete(id)
    
    // Оновити загальну суму витрат у відрядженні
    await updateTripTotalExpenses(tripId)
    
    return NextResponse.json({ 
      message: 'Витрату успішно видалено'
    })
    
  } catch (error) {
    console.error('Error deleting trip expense:', error)
    return NextResponse.json(
      { error: 'Помилка видалення витрати' },
      { status: 500 }
    )
  }
}

// Допоміжна функція для оновлення загальної суми витрат у відрядженні
async function updateTripTotalExpenses(tripId) {
  try {
    // Підрахувати суми по категоріях
    const categoryTotals = await TripExpense.aggregate([
      { $match: { tripId: tripId, status: { $ne: 'rejected' } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ])
    
    const actualExpenses = {
      transport: 0,
      accommodation: 0,
      meals: 0,
      other: 0,
      total: 0
    }
    
    categoryTotals.forEach(cat => {
      switch (cat._id) {
        case 'transport':
        case 'fuel':
          actualExpenses.transport += cat.total
          break
        case 'accommodation':
          actualExpenses.accommodation += cat.total
          break
        case 'meals':
          actualExpenses.meals += cat.total
          break
        default:
          actualExpenses.other += cat.total
          break
      }
    })
    
    actualExpenses.total = Object.values(actualExpenses).reduce((sum, val) => sum + val, 0) - actualExpenses.total
    
    // Оновити відрядження
    await BusinessTrip.findByIdAndUpdate(tripId, {
      actualExpenses,
      updatedAt: new Date()
    })
    
  } catch (error) {
    console.error('Error updating trip total expenses:', error)
  }
}