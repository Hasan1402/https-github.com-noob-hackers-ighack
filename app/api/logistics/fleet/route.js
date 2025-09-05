import { NextResponse } from 'next/server'
import { verifyToken, hasAccessLevel } from '../../../../lib/ssoAuth'
import { fleetManager, routeOptimizer } from '../../../../lib/logisticsService'
import { Vehicle } from '../../../../lib/models/Logistics'
import { logAuditEvent } from '../../../../lib/auditLogger'
import connectDB from '../../../../lib/mongodb'

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

// GET /api/logistics/fleet - Get fleet status and vehicles
export async function GET(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    
    // Check access level - warehouse and above can view fleet
    if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
      return NextResponse.json(
        { error: 'Недостатньо прав доступу до автопарку' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'
    const status = searchParams.get('status')
    const vehicleId = searchParams.get('vehicleId')
    
    switch (action) {
      case 'status':
        return await getFleetStatus(auth, status)
      case 'vehicle':
        return await getVehicleDetails(auth, vehicleId)
      case 'metrics':
        return await getFleetMetrics(auth)
      case 'locations':
        return await getVehicleLocations(auth)
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
    
    console.error('Fleet API error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера автопарку' },
      { status: 500 }
    )
  }
}

async function getFleetStatus(auth, statusFilter) {
  const vehicles = await fleetManager.getVehiclesByStatus(auth.tenantId, statusFilter)
  
  const statusCounts = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.status] = (acc[vehicle.status] || 0) + 1
    return acc
  }, {})
  
  return NextResponse.json({
    success: true,
    data: {
      vehicles,
      summary: {
        total: vehicles.length,
        byStatus: statusCounts,
        available: statusCounts.available || 0,
        inTransit: statusCounts.in_transit || 0,
        maintenance: statusCounts.maintenance || 0
      }
    }
  })
}

async function getVehicleDetails(auth, vehicleId) {
  if (!vehicleId) {
    return NextResponse.json(
      { error: 'ID автомобіля обов\'язковий' },
      { status: 400 }
    )
  }
  
  const vehicle = await Vehicle.findOne({
    vehicleId,
    tenantId: auth.tenantId
  })
  
  if (!vehicle) {
    return NextResponse.json(
      { error: 'Автомобіль не знайдено' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({
    success: true,
    data: { vehicle }
  })
}

async function getFleetMetrics(auth) {
  const dateRange = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  }
  
  const metrics = await fleetManager.getVehicleMetrics(auth.tenantId, dateRange)
  
  return NextResponse.json({
    success: true,
    data: { metrics }
  })
}

async function getVehicleLocations(auth) {
  const vehicles = await Vehicle.find({
    tenantId: auth.tenantId,
    status: { $in: ['in_transit', 'loading'] }
  }).select('vehicleId licensePlate currentLocation driver status')
  
  const locations = vehicles.map(vehicle => ({
    vehicleId: vehicle.vehicleId,
    licensePlate: vehicle.licensePlate,
    location: vehicle.currentLocation,
    driver: vehicle.driver?.name || 'Не призначено',
    status: vehicle.status
  }))
  
  return NextResponse.json({
    success: true,
    data: { locations }
  })
}

// POST /api/logistics/fleet - Update fleet data
export async function POST(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    
    // Check permissions - warehouse manager and above can manage fleet
    if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
      return NextResponse.json(
        { error: 'Недостатньо прав для управління автопарком' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { action, vehicleData } = body
    
    switch (action) {
      case 'updateLocation':
        return await updateVehicleLocation(auth, vehicleData, request)
      case 'assignDriver':
        return await assignDriverToVehicle(auth, vehicleData, request)
      case 'updateStatus':
        return await updateVehicleStatus(auth, vehicleData, request)
      case 'addVehicle':
        return await addNewVehicle(auth, vehicleData, request)
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
    
    console.error('Fleet POST error:', error)
    return NextResponse.json(
      { error: 'Помилка управління автопарком' },
      { status: 500 }
    )
  }
}

async function updateVehicleLocation(auth, vehicleData, request) {
  const { vehicleId, location } = vehicleData
  
  const updatedVehicle = await fleetManager.updateVehicleLocation(vehicleId, location)
  
  if (!updatedVehicle) {
    return NextResponse.json(
      { error: 'Автомобіль не знайдено' },
      { status: 404 }
    )
  }
  
  // Log location update
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'VEHICLE_LOCATION_UPDATED',
    resource: 'VEHICLE',
    resourceId: vehicleId,
    details: { location },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Місцезнаходження автомобіля оновлено',
    data: { vehicle: updatedVehicle }
  })
}

async function assignDriverToVehicle(auth, vehicleData, request) {
  const { vehicleId, driver } = vehicleData
  
  const updatedVehicle = await fleetManager.assignDriverToVehicle(vehicleId, driver)
  
  if (!updatedVehicle) {
    return NextResponse.json(
      { error: 'Автомобіль не знайдено' },
      { status: 404 }
    )
  }
  
  // Log driver assignment
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'VEHICLE_DRIVER_ASSIGNED',
    resource: 'VEHICLE',
    resourceId: vehicleId,
    details: { driverName: driver.name, driverPhone: driver.phone },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Водія призначено до автомобіля',
    data: { vehicle: updatedVehicle }
  })
}

async function updateVehicleStatus(auth, vehicleData, request) {
  const { vehicleId, status } = vehicleData
  
  const vehicle = await Vehicle.findOneAndUpdate(
    { vehicleId, tenantId: auth.tenantId },
    { 
      $set: { 
        status,
        updatedAt: new Date()
      }
    },
    { new: true }
  )
  
  if (!vehicle) {
    return NextResponse.json(
      { error: 'Автомобіль не знайдено' },
      { status: 404 }
    )
  }
  
  // Log status change
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'VEHICLE_STATUS_UPDATED',
    resource: 'VEHICLE',
    resourceId: vehicleId,
    details: { newStatus: status },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Статус автомобіля оновлено',
    data: { vehicle }
  })
}

async function addNewVehicle(auth, vehicleData, request) {
  // Generate unique vehicle ID
  const vehicleId = `NP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  
  const newVehicle = new Vehicle({
    ...vehicleData,
    vehicleId,
    tenantId: auth.tenantId,
    status: 'available'
  })
  
  await newVehicle.save()
  
  // Log vehicle addition
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'VEHICLE_ADDED',
    resource: 'VEHICLE',
    resourceId: vehicleId,
    details: { 
      licensePlate: vehicleData.licensePlate,
      type: vehicleData.type
    },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Новий автомобіль додано до автопарку',
    data: { vehicle: newVehicle }
  })
}