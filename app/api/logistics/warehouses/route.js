import { NextResponse } from 'next/server'
import { verifyToken, hasAccessLevel } from '../../../../lib/ssoAuth'
import { warehouseManager } from '../../../../lib/logisticsService'
import { Warehouse, Package } from '../../../../lib/models/Logistics'
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

// GET /api/logistics/warehouses - Warehouse management
export async function GET(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    
    // Basic access can view warehouse info, warehouse+ can manage
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const warehouseId = searchParams.get('warehouseId')
    const type = searchParams.get('type')
    
    switch (action) {
      case 'list':
        return await getWarehouses(auth, type)
      case 'details':
        return await getWarehouseDetails(auth, warehouseId)
      case 'capacity':
        return await getWarehouseCapacity(auth)
      case 'nearest':
        const lat = parseFloat(searchParams.get('lat'))
        const lng = parseFloat(searchParams.get('lng'))
        return await findNearestWarehouse(auth, lat, lng, type)
      case 'inventory':
        return await getWarehouseInventory(auth, warehouseId)
      case 'performance':
        return await getWarehousePerformance(auth)
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
    
    console.error('Warehouses API error:', error)
    return NextResponse.json(
      { error: 'Помилка складів' },
      { status: 500 }
    )
  }
}

async function getWarehouses(auth, typeFilter) {
  const query = { tenantId: auth.tenantId, isActive: true }
  if (typeFilter) query.type = typeFilter
  
  const warehouses = await Warehouse.find(query).sort({ name: 1 })
  
  // Get summary statistics
  const summary = {
    total: warehouses.length,
    byType: {},
    totalCapacity: 0,
    totalCurrentLoad: 0
  }
  
  warehouses.forEach(warehouse => {
    const type = warehouse.type
    if (!summary.byType[type]) {
      summary.byType[type] = { count: 0, totalArea: 0 }
    }
    summary.byType[type].count++
    summary.byType[type].totalArea += warehouse.capacity.totalArea || 0
    summary.totalCapacity += warehouse.capacity.maxWeight || 0
    summary.totalCurrentLoad += warehouse.currentLoad.weight || 0
  })
  
  summary.utilizationRate = summary.totalCapacity > 0 
    ? (summary.totalCurrentLoad / summary.totalCapacity * 100) 
    : 0
  
  return NextResponse.json({
    success: true,
    data: {
      warehouses,
      summary
    }
  })
}

async function getWarehouseDetails(auth, warehouseId) {
  if (!warehouseId) {
    return NextResponse.json(
      { error: 'ID складу обов\'язковий' },
      { status: 400 }
    )
  }
  
  const warehouse = await Warehouse.findOne({
    warehouseId,
    tenantId: auth.tenantId
  })
  
  if (!warehouse) {
    return NextResponse.json(
      { error: 'Склад не знайдено' },
      { status: 404 }
    )
  }
  
  // Get current load information
  const currentLoad = await warehouseManager.getWarehouseLoad(warehouseId)
  
  // Get recent activity (packages in/out)
  const recentPackages = await Package.find({
    'route.currentWarehouseId': warehouseId
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .select('trackingNumber status updatedAt sender recipient')
  
  return NextResponse.json({
    success: true,
    data: {
      warehouse,
      currentLoad,
      recentPackages
    }
  })
}

async function getWarehouseCapacity(auth) {
  // Only managers can view capacity reports
  if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
    return NextResponse.json(
      { error: 'Недостатньо прав для перегляду звітів' },
      { status: 403 }
    )
  }
  
  const report = await warehouseManager.getWarehouseCapacityReport(auth.tenantId)
  
  return NextResponse.json({
    success: true,
    data: { report }
  })
}

async function findNearestWarehouse(auth, latitude, longitude, type) {
  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: 'Координати обов\'язкові' },
      { status: 400 }
    )
  }
  
  const nearest = await warehouseManager.findNearestWarehouse(
    latitude, longitude, type
  )
  
  if (!nearest) {
    return NextResponse.json(
      { error: 'Склади не знайдено' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({
    success: true,
    data: { warehouse: nearest }
  })
}

async function getWarehouseInventory(auth, warehouseId) {
  if (!warehouseId) {
    return NextResponse.json(
      { error: 'ID складу обов\'язковий' },
      { status: 400 }
    )
  }
  
  // Get packages currently in warehouse
  const inventory = await Package.aggregate([
    {
      $match: {
        'route.currentWarehouseId': warehouseId,
        status: { $in: ['sorting', 'in_transit'] }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalWeight: { $sum: '$packageInfo.weight' },
        packages: {
          $push: {
            trackingNumber: '$trackingNumber',
            sender: '$sender.name',
            recipient: '$recipient.name',
            weight: '$packageInfo.weight',
            createdAt: '$createdAt'
          }
        }
      }
    }
  ])
  
  // Get daily flow statistics
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dailyFlow = await Package.aggregate([
    {
      $match: {
        'route.currentWarehouseId': warehouseId,
        updatedAt: {
          $gte: today,
          $lt: tomorrow
        }
      }
    },
    {
      $group: {
        _id: { $hour: '$updatedAt' },
        incoming: {
          $sum: { $cond: [{ $eq: ['$status', 'sorting'] }, 1, 0] }
        },
        outgoing: {
          $sum: { $cond: [{ $eq: ['$status', 'out_for_delivery'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ])
  
  return NextResponse.json({
    success: true,
    data: {
      inventory,
      dailyFlow
    }
  })
}

async function getWarehousePerformance(auth) {
  // Only managers can view performance analytics
  if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
    return NextResponse.json(
      { error: 'Недостатньо прав для перегляду аналітики' },
      { status: 403 }
    )
  }
  
  const dateRange = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  }
  
  // Get performance metrics per warehouse
  const performance = await Package.aggregate([
    {
      $match: {
        tenantId: auth.tenantId,
        updatedAt: {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      }
    },
    {
      $group: {
        _id: {
          warehouse: '$route.currentWarehouseId',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }
        },
        processed: { $sum: 1 },
        avgProcessingTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
      }
    },
    {
      $group: {
        _id: '$_id.warehouse',
        dailyVolumes: {
          $push: {
            date: '$_id.date',
            processed: '$processed',
            avgProcessingTime: '$avgProcessingTime'
          }
        },
        totalProcessed: { $sum: '$processed' },
        avgProcessingTime: { $avg: '$avgProcessingTime' }
      }
    }
  ])
  
  // Get warehouse names
  const warehouseNames = await Warehouse.find({
    tenantId: auth.tenantId
  }).select('warehouseId name')
  
  const warehouseMap = {}
  warehouseNames.forEach(w => {
    warehouseMap[w.warehouseId] = w.name
  })
  
  // Add warehouse names to performance data
  performance.forEach(p => {
    p.warehouseName = warehouseMap[p._id] || 'Unknown'
  })
  
  return NextResponse.json({
    success: true,
    data: { performance }
  })
}

// POST /api/logistics/warehouses - Manage warehouses
export async function POST(request) {
  await connectDB()
  
  try {
    const auth = await authenticate(request)
    const body = await request.json()
    const { action, warehouseData } = body
    
    // Only warehouse managers and above can manage warehouses
    if (!hasAccessLevel(auth.accessLevel, 'warehouse')) {
      return NextResponse.json(
        { error: 'Недостатньо прав для управління складами' },
        { status: 403 }
      )
    }
    
    switch (action) {
      case 'create':
        return await createWarehouse(auth, warehouseData, request)
      case 'update':
        return await updateWarehouse(auth, warehouseData, request)
      case 'updateLoad':
        return await updateWarehouseLoad(auth, warehouseData, request)
      case 'addEquipment':
        return await addEquipment(auth, warehouseData, request)
      case 'updateStaff':
        return await updateStaff(auth, warehouseData, request)
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
    
    console.error('Warehouses POST error:', error)
    return NextResponse.json(
      { error: 'Помилка управління складами' },
      { status: 500 }
    )
  }
}

async function createWarehouse(auth, warehouseData, request) {
  // Generate unique warehouse ID
  const warehouseId = `WH-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  
  const newWarehouse = new Warehouse({
    ...warehouseData,
    warehouseId,
    tenantId: auth.tenantId
  })
  
  await newWarehouse.save()
  
  // Log warehouse creation
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'WAREHOUSE_CREATED',
    resource: 'WAREHOUSE',
    resourceId: warehouseId,
    details: {
      name: warehouseData.name,
      type: warehouseData.type,
      city: warehouseData.address?.city
    },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Склад створено успішно',
    data: { warehouse: newWarehouse }
  })
}

async function updateWarehouse(auth, warehouseData, request) {
  const { warehouseId, ...updates } = warehouseData
  
  const warehouse = await Warehouse.findOneAndUpdate(
    { warehouseId, tenantId: auth.tenantId },
    { 
      $set: { 
        ...updates,
        updatedAt: new Date()
      }
    },
    { new: true }
  )
  
  if (!warehouse) {
    return NextResponse.json(
      { error: 'Склад не знайдено' },
      { status: 404 }
    )
  }
  
  // Log warehouse update
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'WAREHOUSE_UPDATED',
    resource: 'WAREHOUSE',
    resourceId: warehouseId,
    details: updates,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Склад оновлено успішно',
    data: { warehouse }
  })
}

async function updateWarehouseLoad(auth, warehouseData, request) {
  const { warehouseId } = warehouseData
  
  // Recalculate current load
  const load = await warehouseManager.getWarehouseLoad(warehouseId)
  
  return NextResponse.json({
    success: true,
    message: 'Завантаження складу оновлено',
    data: { load }
  })
}

async function addEquipment(auth, warehouseData, request) {
  const { warehouseId, equipment } = warehouseData
  
  const warehouse = await Warehouse.findOneAndUpdate(
    { warehouseId, tenantId: auth.tenantId },
    { 
      $push: { equipment },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  )
  
  if (!warehouse) {
    return NextResponse.json(
      { error: 'Склад не знайдено' },
      { status: 404 }
    )
  }
  
  // Log equipment addition
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'WAREHOUSE_EQUIPMENT_ADDED',
    resource: 'WAREHOUSE',
    resourceId: warehouseId,
    details: { equipment },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Обладнання додано успішно'
  })
}

async function updateStaff(auth, warehouseData, request) {
  const { warehouseId, staff } = warehouseData
  
  const warehouse = await Warehouse.findOneAndUpdate(
    { warehouseId, tenantId: auth.tenantId },
    { 
      $set: { 
        staff,
        updatedAt: new Date()
      }
    },
    { new: true }
  )
  
  if (!warehouse) {
    return NextResponse.json(
      { error: 'Склад не знайдено' },
      { status: 404 }
    )
  }
  
  // Log staff update
  await logAuditEvent({
    userId: auth.userId,
    tenantId: auth.tenantId,
    action: 'WAREHOUSE_STAFF_UPDATED',
    resource: 'WAREHOUSE',
    resourceId: warehouseId,
    details: { staffCount: staff.length },
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Персонал складу оновлено'
  })
}