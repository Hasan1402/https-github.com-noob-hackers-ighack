import { NextResponse } from 'next/server'
import { verifyToken, hasPermission, hasAccessLevel } from '../../../lib/ssoAuth'
import User from '../../../lib/models/User'
import Tenant from '../../../lib/models/Tenant'
import { Role } from '../../../lib/models/Role'
import { logAuditEvent } from '../../../lib/auditLogger'
import connectDB from '../../../lib/mongodb'

// Middleware for authentication
async function authenticate(request) {
  const cookieToken = request.cookies.get('access_token')?.value
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const token = cookieToken || headerToken
  
  if (!token) {
    throw new Error('UNAUTHORIZED')
  }
  
  return await verifyToken(token)
}

// GET /api/sso/hr - Get HR dashboard data
export async function GET(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    
    // Check permissions
    if (!hasPermission(auth.roles, ['hr_manager', 'admin']) && 
        !hasAccessLevel(auth.accessLevel, 'branch')) {
      return NextResponse.json(
        { error: 'Недостатньо прав доступу' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'dashboard'
    
    switch (action) {
      case 'dashboard':
        return await getHRDashboard(auth)
      case 'employees':
        return await getEmployees(auth, searchParams)
      case 'departments':
        return await getDepartments(auth)
      case 'roles':
        return await getRoles(auth)
      case 'audit':
        return await getHRAuditLogs(auth, searchParams)
      default:
        return NextResponse.json(
          { error: 'Невідома дія' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }
    
    console.error('HR API error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    )
  }
}

async function getHRDashboard(auth) {
  const stats = await Promise.all([
    // Total employees
    User.countDocuments({ 
      tenantId: auth.tenantId, 
      isActive: true 
    }),
    
    // New employees this month
    User.countDocuments({
      tenantId: auth.tenantId,
      isActive: true,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }),
    
    // Employees by department
    User.aggregate([
      {
        $match: { 
          tenantId: auth.tenantId, 
          isActive: true 
        }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Employees by access level
    User.aggregate([
      {
        $match: { 
          tenantId: auth.tenantId, 
          isActive: true 
        }
      },
      {
        $group: {
          _id: '$accessLevel',
          count: { $sum: 1 }
        }
      }
    ])
  ])
  
  return NextResponse.json({
    success: true,
    data: {
      totalEmployees: stats[0],
      newEmployeesThisMonth: stats[1],
      employeesByDepartment: stats[2],
      employeesByAccessLevel: stats[3],
      lastUpdated: new Date()
    }
  })
}

async function getEmployees(auth, searchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const department = searchParams.get('department') || ''
  const accessLevel = searchParams.get('accessLevel') || ''
  
  const query = { 
    tenantId: auth.tenantId,
    isActive: true
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ]
  }
  
  if (department) {
    query.department = department
  }
  
  if (accessLevel) {
    query.accessLevel = accessLevel
  }
  
  const skip = (page - 1) * limit
  
  const [employees, total] = await Promise.all([
    User.find(query)
      .select('-password -twoFactorSecret -passwordResetToken')
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query)
  ])
  
  return NextResponse.json({
    success: true,
    data: {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
}

async function getDepartments(auth) {
  const departments = await User.distinct('department', {
    tenantId: auth.tenantId,
    isActive: true,
    department: { $ne: null }
  })
  
  return NextResponse.json({
    success: true,
    data: { departments }
  })
}

async function getRoles(auth) {
  const roles = await Role.find({
    tenantId: auth.tenantId
  }).populate('permissions')
  
  return NextResponse.json({
    success: true,
    data: { roles }
  })
}

async function getHRAuditLogs(auth, searchParams) {
  // Implementation for HR audit logs
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  // For now, return empty array - full implementation would use AuditLog model
  return NextResponse.json({
    success: true,
    data: {
      logs: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    }
  })
}

// POST /api/sso/hr - Create new employee or update existing
export async function POST(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    
    // Check permissions - only HR managers and admins can create/update employees
    if (!hasPermission(auth.roles, ['hr_manager', 'admin'])) {
      return NextResponse.json(
        { error: 'Недостатньо прав для управління співробітниками' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { action, employeeData } = body
    
    switch (action) {
      case 'create':
        return await createEmployee(auth, employeeData, request)
      case 'update':
        return await updateEmployee(auth, employeeData, request)
      case 'deactivate':
        return await deactivateEmployee(auth, employeeData.id, request)
      default:
        return NextResponse.json(
          { error: 'Невідома дія' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Необхідна авторизація' },
        { status: 401 }
      )
    }
    
    console.error('HR POST error:', error)
    return NextResponse.json(
      { error: 'Помилка створення/оновлення співробітника' },
      { status: 500 }
    )
  }
}

async function createEmployee(auth, employeeData, request) {
  const {
    firstName,
    lastName,
    email,
    department,
    position,
    accessLevel = 'basic',
    roles = ['employee'],
    employeeId,
    workLocation
  } = employeeData
  
  // Check if email already exists
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
    tenantId: auth.tenantId
  })
  
  if (existingUser) {
    return NextResponse.json(
      { error: 'Користувач з таким email вже існує' },
      { status: 400 }
    )
  }
  
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-10)
  
  const newUser = new User({
    email: email.toLowerCase(),
    password: tempPassword,
    firstName,
    lastName,
    tenantId: auth.tenantId,
    department,
    position,
    accessLevel,
    roles,
    employeeId,
    workLocation,
    isActive: true,
    isEmailVerified: false,
    requiresPasswordChange: true
  })
  
  await newUser.save()
  
  // Log employee creation
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'EMPLOYEE_CREATED',
    resource: 'USER',
    resourceId: newUser._id.toString(),
    details: {
      employeeEmail: email,
      department,
      position,
      accessLevel
    },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    data: {
      employee: {
        id: newUser._id.toString(),
        email: newUser.email,
        fullName: `${newUser.firstName} ${newUser.lastName}`,
        department: newUser.department,
        position: newUser.position,
        accessLevel: newUser.accessLevel
      },
      tempPassword // In production, this should be sent via secure email
    }
  })
}

async function updateEmployee(auth, employeeData, request) {
  const { id, ...updates } = employeeData
  
  const employee = await User.findOne({
    _id: id,
    tenantId: auth.tenantId
  })
  
  if (!employee) {
    return NextResponse.json(
      { error: 'Співробітника не знайдено' },
      { status: 404 }
    )
  }
  
  // Update only allowed fields
  const allowedUpdates = [
    'firstName', 'lastName', 'department', 'position', 
    'accessLevel', 'roles', 'employeeId', 'workLocation'
  ]
  
  const actualUpdates = {}
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      actualUpdates[field] = updates[field]
    }
  })
  
  actualUpdates.updatedAt = new Date()
  
  await User.updateOne({ _id: id }, { $set: actualUpdates })
  
  // Log employee update
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'EMPLOYEE_UPDATED',
    resource: 'USER',
    resourceId: id,
    details: actualUpdates,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Співробітника оновлено успішно'
  })
}

async function deactivateEmployee(auth, employeeId, request) {
  const employee = await User.findOne({
    _id: employeeId,
    tenantId: auth.tenantId
  })
  
  if (!employee) {
    return NextResponse.json(
      { error: 'Співробітника не знайдено' },
      { status: 404 }
    )
  }
  
  employee.isActive = false
  employee.updatedAt = new Date()
  await employee.save()
  
  // Log employee deactivation
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'EMPLOYEE_DEACTIVATED',
    resource: 'USER',
    resourceId: employeeId,
    details: {
      employeeEmail: employee.email
    },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Співробітника деактивовано'
  })
}