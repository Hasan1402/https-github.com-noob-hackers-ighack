import { Vehicle, Warehouse, Route, DeliveryZone, Package } from './models/Logistics'
import connectDB from './mongodb'

// Route Optimization Service
export class RouteOptimizer {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY
  }

  // Calculate optimal route for multiple stops
  async optimizeRoute(startLocation, stops, vehicleConstraints = {}) {
    try {
      // Sort stops by distance and priority
      const optimizedStops = await this.calculateOptimalSequence(startLocation, stops)
      
      // Calculate total distance and time
      const metrics = await this.calculateRouteMetrics(startLocation, optimizedStops)
      
      return {
        optimizedStops,
        metrics,
        estimatedDuration: metrics.totalTime,
        estimatedDistance: metrics.totalDistance
      }
    } catch (error) {
      console.error('Route optimization error:', error)
      throw error
    }
  }

  async calculateOptimalSequence(start, stops) {
    // Simple nearest neighbor algorithm for demo
    // In production, use more sophisticated algorithms like OR-Tools
    const unvisited = [...stops]
    const optimized = []
    let currentLocation = start

    while (unvisited.length > 0) {
      let nearestIndex = 0
      let shortestDistance = Number.MAX_VALUE

      for (let i = 0; i < unvisited.length; i++) {
        const distance = this.calculateDistance(
          currentLocation.latitude, currentLocation.longitude,
          unvisited[i].location.latitude, unvisited[i].location.longitude
        )

        if (distance < shortestDistance) {
          shortestDistance = distance
          nearestIndex = i
        }
      }

      const nextStop = unvisited.splice(nearestIndex, 1)[0]
      nextStop.sequence = optimized.length + 1
      optimized.push(nextStop)
      currentLocation = nextStop.location
    }

    return optimized
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula for calculating distance between two points
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180)
  }

  async calculateRouteMetrics(start, stops) {
    let totalDistance = 0
    let totalTime = 0
    let currentLocation = start

    for (const stop of stops) {
      const distance = this.calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        stop.location.latitude, stop.location.longitude
      )
      
      totalDistance += distance
      totalTime += (distance / 40) * 60 // Assume 40 km/h average speed, convert to minutes
      
      currentLocation = stop.location
    }

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTime: Math.round(totalTime)
    }
  }
}

// Fleet Management Service
export class FleetManager {
  async getVehiclesByStatus(tenantId, status = null) {
    await connectDB()
    
    const query = { tenantId, isActive: true }
    if (status) query.status = status
    
    return await Vehicle.find(query).sort({ updatedAt: -1 })
  }

  async updateVehicleLocation(vehicleId, location) {
    await connectDB()
    
    const updateData = {
      'currentLocation.latitude': location.latitude,
      'currentLocation.longitude': location.longitude,
      'currentLocation.timestamp': new Date(),
      'currentLocation.address': location.address || '',
      updatedAt: new Date()
    }

    return await Vehicle.findOneAndUpdate(
      { vehicleId },
      { $set: updateData },
      { new: true }
    )
  }

  async assignDriverToVehicle(vehicleId, driverInfo) {
    await connectDB()
    
    return await Vehicle.findOneAndUpdate(
      { vehicleId },
      { 
        $set: { 
          driver: driverInfo,
          updatedAt: new Date()
        }
      },
      { new: true }
    )
  }

  async getVehicleMetrics(tenantId, dateRange = {}) {
    await connectDB()
    
    const matchQuery = { tenantId }
    if (dateRange.start && dateRange.end) {
      matchQuery.updatedAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    }

    const metrics = await Vehicle.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgFuelLevel: { $avg: '$maintenance.fuelLevel' },
          totalMileage: { $sum: '$maintenance.mileage' }
        }
      }
    ])

    const totalVehicles = await Vehicle.countDocuments({ tenantId })
    
    return {
      totalVehicles,
      byStatus: metrics,
      utilizationRate: metrics.find(m => m._id === 'in_transit')?.count / totalVehicles || 0
    }
  }
}

// Warehouse Management Service
export class WarehouseManager {
  async getWarehouseLoad(warehouseId) {
    await connectDB()
    
    // Get current packages in warehouse
    const packagesCount = await Package.countDocuments({
      'route.currentWarehouseId': warehouseId,
      status: { $in: ['sorting', 'in_transit'] }
    })

    const warehouse = await Warehouse.findOne({ warehouseId })
    
    if (warehouse) {
      const utilizationPercent = (packagesCount / (warehouse.capacity.maxWeight || 1000)) * 100
      
      await Warehouse.updateOne(
        { warehouseId },
        {
          $set: {
            'currentLoad.packagesCount': packagesCount,
            'currentLoad.utilizationPercent': Math.min(utilizationPercent, 100),
            updatedAt: new Date()
          }
        }
      )
    }

    return { packagesCount, utilizationPercent }
  }

  async findNearestWarehouse(latitude, longitude, type = null) {
    await connectDB()
    
    const query = { isActive: true }
    if (type) query.type = type

    const warehouses = await Warehouse.find(query)
    
    let nearest = null
    let shortestDistance = Number.MAX_VALUE

    for (const warehouse of warehouses) {
      const optimizer = new RouteOptimizer()
      const distance = optimizer.calculateDistance(
        latitude, longitude,
        warehouse.location.latitude, warehouse.location.longitude
      )

      if (distance < shortestDistance) {
        shortestDistance = distance
        nearest = { ...warehouse.toObject(), distance }
      }
    }

    return nearest
  }

  async getWarehouseCapacityReport(tenantId) {
    await connectDB()
    
    const warehouses = await Warehouse.find({ tenantId, isActive: true })
    
    const report = await Promise.all(
      warehouses.map(async (warehouse) => {
        const load = await this.getWarehouseLoad(warehouse.warehouseId)
        
        return {
          warehouseId: warehouse.warehouseId,
          name: warehouse.name,
          type: warehouse.type,
          location: warehouse.address,
          capacity: warehouse.capacity,
          currentLoad: load,
          status: load.utilizationPercent > 90 ? 'critical' : 
                  load.utilizationPercent > 70 ? 'high' : 'normal'
        }
      })
    )

    return report
  }
}

// Real-time Tracking Service
export class TrackingService {
  constructor() {
    this.activeTrackers = new Map()
  }

  startRouteTracking(routeId, websocket) {
    this.activeTrackers.set(routeId, {
      websocket,
      startTime: new Date(),
      lastUpdate: new Date()
    })

    console.log(`Started tracking route: ${routeId}`)
  }

  async updateRouteLocation(routeId, location) {
    await connectDB()
    
    // Update route location in database
    await Route.updateOne(
      { routeId },
      {
        $set: {
          'realTimeTracking.currentLocation': {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date()
          },
          'realTimeTracking.lastUpdate': new Date(),
          'realTimeTracking.isTracking': true
        }
      }
    )

    // Send real-time update to connected clients
    const tracker = this.activeTrackers.get(routeId)
    if (tracker && tracker.websocket) {
      const updateData = {
        type: 'location_update',
        routeId,
        location,
        timestamp: new Date()
      }
      
      try {
        tracker.websocket.send(JSON.stringify(updateData))
        tracker.lastUpdate = new Date()
      } catch (error) {
        console.error('WebSocket send error:', error)
        this.activeTrackers.delete(routeId)
      }
    }
  }

  stopRouteTracking(routeId) {
    const tracker = this.activeTrackers.get(routeId)
    if (tracker) {
      this.activeTrackers.delete(routeId)
      console.log(`Stopped tracking route: ${routeId}`)
    }
  }

  getActiveTrackers() {
    return Array.from(this.activeTrackers.keys())
  }
}

// Package Status Service
export class PackageService {
  async updatePackageStatus(trackingNumber, newStatus, location, notes = '', employeeId = '') {
    await connectDB()
    
    const historyEntry = {
      status: newStatus,
      location,
      timestamp: new Date(),
      notes,
      employeeId
    }

    const updateData = {
      status: newStatus,
      $push: { history: historyEntry },
      updatedAt: new Date()
    }

    // Update delivery date for delivered packages
    if (newStatus === 'delivered') {
      updateData['sla.actualDelivery'] = new Date()
    }

    const package = await Package.findOneAndUpdate(
      { trackingNumber },
      updateData,
      { new: true }
    )

    // Check SLA compliance
    if (package && package.sla.promisedDelivery && package.sla.actualDelivery) {
      const isOnTime = package.sla.actualDelivery <= package.sla.promisedDelivery
      await Package.updateOne(
        { trackingNumber },
        { $set: { 'sla.isOnTime': isOnTime } }
      )
    }

    return package
  }

  async getPackagesByStatus(tenantId, status) {
    await connectDB()
    
    return await Package.find({ tenantId, status }).sort({ createdAt: -1 })
  }

  async trackPackage(trackingNumber) {
    await connectDB()
    
    const package = await Package.findOne({ trackingNumber })
    
    if (!package) {
      throw new Error('Package not found')
    }

    // Get current route information if package is in transit
    let routeInfo = null
    if (package.route.currentRouteId) {
      const route = await Route.findOne({ 
        routeId: package.route.currentRouteId 
      }).select('courier vehicle realTimeTracking status')
      
      if (route) {
        routeInfo = {
          courier: route.courier,
          vehicle: route.vehicle,
          currentLocation: route.realTimeTracking.currentLocation,
          status: route.status
        }
      }
    }

    return {
      ...package.toObject(),
      routeInfo
    }
  }
}

// Initialize services
export const routeOptimizer = new RouteOptimizer()
export const fleetManager = new FleetManager()
export const warehouseManager = new WarehouseManager()
export const trackingService = new TrackingService()
export const packageService = new PackageService()