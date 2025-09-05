import { NextResponse } from 'next/server'
import { verifyToken, hasAccessLevel, hasPermission } from '../../../../lib/ssoAuth'
import { routeOptimizer, trackingService } from '../../../../lib/logisticsService'
import { Route, Vehicle, Warehouse } from '../../../../lib/models/Logistics'
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

// GET /api/logistics/routes - Get routes and route management
export async function GET(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    
    // Basic access level can view assigned routes, warehouse+ can view all
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const routeId = searchParams.get('routeId')
    const courierId = searchParams.get('courierId')
    const status = searchParams.get('status')
    
    switch (action) {
      case 'list':
        return await getRoutes(auth, { courierId, status })
      case 'details':
        return await getRouteDetails(auth, routeId)
      case 'optimize':
        return await optimizeRoute(auth, request)
      case 'tracking':
        return await getRouteTracking(auth, routeId)
      case 'performance':
        return await getRoutePerformance(auth)
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
    
    console.error('Routes API error:', error)
    return NextResponse.json(
      { error: 'Помилка маршрутів' },
      { status: 500 }
    )
  }
}

async function getRoutes(auth, filters) {
  const query = { tenantId: auth.tenantId }
  
  // If user is basic level, only show their assigned routes
  if (auth.accessLevel === 'basic') {
    query['courier.employeeId'] = auth.userId
  } else if (filters.courierId) {
    query['courier.employeeId'] = filters.courierId
  }
  
  if (filters.status) {
    query.status = filters.status
  }
  
  const routes = await Route.find(query)
    .sort({ 'schedule.plannedStart': -1 })
    .limit(100)
  
  // Get summary statistics
  const stats = await Route.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgEfficiency: { $avg: '$metrics.efficiency' }
      }
    }
  ])
  
  return NextResponse.json({
    success: true,
    data: {
      routes,
      summary: {
        total: routes.length,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, avgEfficiency: stat.avgEfficiency }
          return acc
        }, {})
      }
    }
  })
}

async function getRouteDetails(auth, routeId) {
  if (!routeId) {
    return NextResponse.json(
      { error: 'ID маршруту обов\'язковий' },
      { status: 400 }
    )
  }
  
  const route = await Route.findOne({ routeId, tenantId: auth.tenantId })
  
  if (!route) {
    return NextResponse.json(
      { error: 'Маршрут не знайдено' },
      { status: 404 }
    )
  }
  
  // Check access - users can only view their own routes
  if (auth.accessLevel === 'basic' && route.courier.employeeId !== auth.userId) {
    return NextResponse.json(
      { error: 'Доступ заборонено' },
      { status: 403 }
    )
  }
  
  return NextResponse.json({
    success: true,
    data: { route }
  })
}

async function optimizeRoute(auth, request) {
  // Only warehouse managers and above can optimize routes
  if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
    return NextResponse.json(
      { error: 'Недостатньо прав для оптимізації маршрутів' },
      { status: 403 }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const startLat = parseFloat(searchParams.get('startLat'))
  const startLng = parseFloat(searchParams.get('startLng'))
  const stopIds = searchParams.get('stops')?.split(',') || []
  
  if (!startLat || !startLng || stopIds.length === 0) {
    return NextResponse.json(
      { error: 'Невірні параметри для оптимізації' },
      { status: 400 }
    )
  }
  
  try {
    // Mock stops data - in production, get from database
    const stops = stopIds.map((id, index) => ({
      stopId: id,
      location: {
        latitude: startLat + (Math.random() - 0.5) * 0.1,
        longitude: startLng + (Math.random() - 0.5) * 0.1
      },
      address: `Адреса зупинки ${index + 1}`,
      timeWindow: {
        earliest: new Date(Date.now() + index * 3600000),
        latest: new Date(Date.now() + (index + 2) * 3600000)
      }
    }))
    
    const startLocation = { latitude: startLat, longitude: startLng }
    const optimized = await routeOptimizer.optimizeRoute(startLocation, stops)
    
    return NextResponse.json({
      success: true,
      data: optimized
    })
    
  } catch (error) {
    console.error('Route optimization error:', error)
    return NextResponse.json(
      { error: 'Помилка оптимізації маршруту' },
      { status: 500 }
    )
  }
}

async function getRouteTracking(auth, routeId) {
  if (!routeId) {
    return NextResponse.json(
      { error: 'ID маршруту обов\'язковий' },
      { status: 400 }
    )
  }
  
  const route = await Route.findOne({ 
    routeId, 
    tenantId: auth.tenantId 
  }).select('realTimeTracking stops status courier vehicle')
  
  if (!route) {
    return NextResponse.json(
      { error: 'Маршрут не знайдено' },
      { status: 404 }
    )
  }
  
  // Check access for basic users
  if (auth.accessLevel === 'basic' && route.courier.employeeId !== auth.userId) {
    return NextResponse.json(
      { error: 'Доступ заборонено' },
      { status: 403 }
    )
  }
  
  const trackingData = {
    routeId,
    status: route.status,
    currentLocation: route.realTimeTracking.currentLocation,
    lastUpdate: route.realTimeTracking.lastUpdate,
    isTracking: route.realTimeTracking.isTracking,
    completedStops: route.stops.filter(stop => stop.status === 'completed').length,
    totalStops: route.stops.length,
    courier: route.courier,
    vehicle: route.vehicle
  }
  
  return NextResponse.json({
    success: true,
    data: trackingData
  })
}

async function getRoutePerformance(auth) {
  // Only managers can view performance analytics
  if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
    return NextResponse.json(
      { error: 'Недостатньо прав для перегляду аналітики' },
      { status: 403 }
    )
  }
  
  const dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  }
  
  const performance = await Route.aggregate([
    {
      $match: {
        tenantId: auth.tenantId,
        createdAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          courier: '$courier.employeeId'
        },
        totalRoutes: { $sum: 1 },
        completedRoutes: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgEfficiency: { $avg: '$metrics.efficiency' },
        totalDistance: { $sum: '$metrics.totalDistance' },
        avgDuration: { $avg: '$metrics.actualDuration' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        routes: { $sum: '$totalRoutes' },
        completed: { $sum: '$completedRoutes' },
        avgEfficiency: { $avg: '$avgEfficiency' },
        totalDistance: { $sum: '$totalDistance' },
        couriers: { $addToSet: '$_id.courier' }
      }
    },
    { $sort: { _id: 1 } }
  ])
  
  return NextResponse.json({
    success: true,
    data: { performance }
  })
}

// POST /api/logistics/routes - Create and manage routes
export async function POST(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    const body = await request.json()
    const { action, routeData } = body
    
    switch (action) {
      case 'create':
        return await createRoute(auth, routeData, request)
      case 'updateStatus':
        return await updateRouteStatus(auth, routeData, request)
      case 'updateLocation':
        return await updateRouteLocation(auth, routeData, request)
      case 'completeStop':
        return await completeStop(auth, routeData, request)
      case 'startTracking':
        return await startRouteTracking(auth, routeData)
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
    
    console.error('Routes POST error:', error)
    return NextResponse.json(
      { error: 'Помилка створення/оновлення маршруту' },
      { status: 500 }
    )
  }
}

async function createRoute(auth, routeData, request) {
  // Only warehouse managers and above can create routes
  if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
    return NextResponse.json(
      { error: 'Недостатньо прав для створення маршрутів' },
      { status: 403 }
    )
  }
  
  // Generate unique route ID
  const routeId = `RT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  
  // Calculate initial metrics
  const optimizer = new routeOptimizer.constructor()
  const metrics = await optimizer.calculateRouteMetrics(
    routeData.startLocation,
    routeData.stops || []
  )
  
  const newRoute = new Route({
    ...routeData,
    routeId,
    tenantId: auth.tenantId,
    metrics: {
      ...metrics,
      totalStops: routeData.stops?.length || 0
    }
  })
  
  await newRoute.save()
  
  // Log route creation
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'ROUTE_CREATED',
    resource: 'ROUTE',
    resourceId: routeId,
    details: {
      courierName: routeData.courier?.name,
      totalStops: routeData.stops?.length || 0
    },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Маршрут створено успішно',
    data: { route: newRoute }
  })
}

async function updateRouteStatus(auth, routeData, request) {
  const { routeId, status } = routeData
  
  const route = await Route.findOne({ routeId, tenantId: auth.tenantId })
  
  if (!route) {
    return NextResponse.json(
      { error: 'Маршрут не знайдено' },
      { status: 404 }
    )
  }
  
  // Users can only update their own routes
  if (auth.accessLevel === 'basic' && route.courier.employeeId !== auth.userId) {
    return NextResponse.json(
      { error: 'Доступ заборонено' },
      { status: 403 }
    )
  }
  
  const updateData = { status, updatedAt: new Date() }
  
  // Set actual start/end times
  if (status === 'started' && !route.schedule.actualStart) {
    updateData['schedule.actualStart'] = new Date()
  } else if (status === 'completed' && !route.schedule.actualEnd) {
    updateData['schedule.actualEnd'] = new Date()
    
    // Calculate actual duration
    if (route.schedule.actualStart) {
      const duration = (new Date() - route.schedule.actualStart) / (1000 * 60) // minutes
      updateData['metrics.actualDuration'] = duration
      
      // Calculate efficiency
      const plannedDuration = route.metrics.estimatedDuration || duration
      updateData['metrics.efficiency'] = Math.min((plannedDuration / duration) * 100, 100)
    }
  }
  
  await Route.updateOne({ routeId }, { $set: updateData })
  
  // Log status update
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'ROUTE_STATUS_UPDATED',
    resource: 'ROUTE',
    resourceId: routeId,
    details: { newStatus: status },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Статус маршруту оновлено'
  })
}

async function updateRouteLocation(auth, routeData, request) {
  const { routeId, location } = routeData
  
  // Update location in tracking service
  await trackingService.updateRouteLocation(routeId, location)
  
  return NextResponse.json({
    success: true,
    message: 'Місцезнаходження оновлено'
  })
}

async function completeStop(auth, routeData, request) {
  const { routeId, stopId, signature, photo, notes } = routeData
  
  const route = await Route.findOne({ routeId, tenantId: auth.tenantId })
  
  if (!route) {
    return NextResponse.json(
      { error: 'Маршрут не знайдено' },
      { status: 404 }
    )
  }
  
  // Users can only update their own routes
  if (auth.accessLevel === 'basic' && route.courier.employeeId !== auth.userId) {
    return NextResponse.json(
      { error: 'Доступ заборонено' },
      { status: 403 }
    )
  }
  
  // Update specific stop
  await Route.updateOne(
    { 
      routeId,
      'stops.stopId': stopId
    },
    {
      $set: {
        'stops.$.status': 'completed',
        'stops.$.completedAt': new Date(),
        'stops.$.signature': signature,
        'stops.$.photo': photo,
        'stops.$.notes': notes,
        updatedAt: new Date()
      },
      $inc: {
        'metrics.completedStops': 1
      }
    }
  )
  
  // Log stop completion
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'ROUTE_STOP_COMPLETED',
    resource: 'ROUTE',
    resourceId: routeId,
    details: { stopId, hasSignature: !!signature, hasPhoto: !!photo },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Зупинку завершено успішно'
  })
}

async function startRouteTracking(auth, routeData) {
  const { routeId } = routeData
  
  // Start tracking in the tracking service
  // Note: WebSocket connection would be established separately
  await Route.updateOne(
    { routeId, tenantId: auth.tenantId },
    {
      $set: {
        'realTimeTracking.isTracking': true,
        'realTimeTracking.lastUpdate': new Date()
      }
    }
  )
  
  return NextResponse.json({
    success: true,
    message: 'Відстеження маршруту розпочато'
  })
}