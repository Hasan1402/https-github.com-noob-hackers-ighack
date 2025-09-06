import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { verifyToken } from '../../../../lib/ssoAuth'

// GET /api/hr/employees - Отримати всіх співробітників
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
    
    // Filters
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    
    // Get MongoDB connection
    const db = (await import('../../../../lib/mongodb')).default
    const connection = await db()
    const employeesCollection = connection.db('tis_kis_erp').collection('employees')
    
    // Build query
    let query = {}
    
    if (department && department !== 'all') {
      query.department = { $regex: department, $options: 'i' }
    }
    
    if (isActive !== null && isActive !== 'all') {
      query.isActive = isActive === 'true'
    }
    
    // Search
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const employees = await employeesCollection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await employeesCollection.countDocuments(query)
    
    // Statistics
    const totalActive = await employeesCollection.countDocuments({ isActive: true })
    const totalInactive = await employeesCollection.countDocuments({ isActive: false })
    
    // Department statistics
    const departmentStats = await employeesCollection.aggregate([
      { $match: { isActive: true } },
      { 
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]).toArray()
    
    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics: {
        totalActive,
        totalInactive,
        departmentStats: departmentStats.reduce((acc, dept) => {
          acc[dept._id] = dept.count
          return acc
        }, {})
      }
    })
    
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Помилка завантаження співробітників' },
      { status: 500 }
    )
  }
}

// POST /api/hr/employees - Створити нового співробітника
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
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.department || !data.position) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: ім\'я, прізвище, email, відділ, посада' },
        { status: 400 }
      )
    }
    
    // Get MongoDB connection
    const db = (await import('../../../../lib/mongodb')).default
    const connection = await db()
    const employeesCollection = connection.db('tis_kis_erp').collection('employees')
    
    // Check if email already exists
    const existingEmployee = await employeesCollection.findOne({ email: data.email })
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Співробітник з таким email вже існує' },
        { status: 400 }
      )
    }
    
    // Generate employee ID
    const count = await employeesCollection.countDocuments({})
    const employeeId = `NP-${String(count + 1).padStart(3, '0')}`
    
    // Generate unique ID
    const id = `emp-${Date.now()}`
    
    // Create new employee
    const newEmployee = {
      id,
      employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone || '',
      department: data.department,
      position: data.position,
      salary: parseFloat(data.salary) || 0,
      accessLevel: data.accessLevel || 'employee',
      hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id
    }
    
    await employeesCollection.insertOne(newEmployee)
    
    return NextResponse.json({
      employee: newEmployee,
      message: 'Співробітника створено успішно'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Помилка створення співробітника' },
      { status: 500 }
    )
  }
}

// PUT /api/hr/employees - Оновити співробітника
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
        { error: 'ID співробітника не вказано' },
        { status: 400 }
      )
    }
    
    // Get MongoDB connection
    const db = (await import('../../../../lib/mongodb')).default
    const connection = await db()
    const employeesCollection = connection.db('tis_kis_erp').collection('employees')
    
    // Check if employee exists
    const employee = await employeesCollection.findOne({ id })
    if (!employee) {
      return NextResponse.json(
        { error: 'Співробітника не знайдено' },
        { status: 404 }
      )
    }
    
    // Update full name if first/last name changed
    if (updateData.firstName || updateData.lastName) {
      const firstName = updateData.firstName || employee.firstName
      const lastName = updateData.lastName || employee.lastName
      updateData.fullName = `${firstName} ${lastName}`
    }
    
    // Check email uniqueness if changed
    if (updateData.email && updateData.email !== employee.email) {
      const existingEmployee = await employeesCollection.findOne({ 
        email: updateData.email,
        id: { $ne: id }
      })
      if (existingEmployee) {
        return NextResponse.json(
          { error: 'Співробітник з таким email вже існує' },
          { status: 400 }
        )
      }
    }
    
    // Update employee
    const updatedEmployee = await employeesCollection.findOneAndUpdate(
      { id },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date(),
          updatedBy: user.id
        }
      },
      { returnDocument: 'after' }
    )
    
    return NextResponse.json({
      employee: updatedEmployee.value,
      message: 'Співробітника оновлено успішно'
    })
    
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення співробітника' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/employees - Видалити співробітника
export async function DELETE(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID співробітника не вказано' },
        { status: 400 }
      )
    }
    
    // Get MongoDB connection
    const db = (await import('../../../../lib/mongodb')).default
    const connection = await db()
    const employeesCollection = connection.db('tis_kis_erp').collection('employees')
    
    // Soft delete - mark as inactive instead of removing
    const updatedEmployee = await employeesCollection.findOneAndUpdate(
      { id },
      { 
        $set: {
          isActive: false,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )
    
    if (!updatedEmployee.value) {
      return NextResponse.json(
        { error: 'Співробітника не знайдено' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Співробітника деактивовано успішно'
    })
    
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: 'Помилка видалення співробітника' },
      { status: 500 }
    )
  }
}