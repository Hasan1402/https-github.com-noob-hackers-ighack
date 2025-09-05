import mongoose from 'mongoose'

// Vehicle Model for Fleet Management
const VehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['truck', 'van', 'car', 'motorcycle'],
    required: true
  },
  capacity: {
    weight: { type: Number, required: true }, // kg
    volume: { type: Number, required: true }  // cubic meters
  },
  driver: {
    employeeId: String,
    name: String,
    phone: String,
    licenseNumber: String
  },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date, default: Date.now },
    address: String
  },
  status: {
    type: String,
    enum: ['available', 'in_transit', 'loading', 'maintenance', 'offline'],
    default: 'available'
  },
  maintenance: {
    lastService: Date,
    nextService: Date,
    mileage: { type: Number, default: 0 },
    fuelLevel: { type: Number, min: 0, max: 100 }
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Warehouse Model
const WarehouseSchema = new mongoose.Schema({
  warehouseId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['central', 'regional', 'local', 'sorting'],
    required: true
  },
  address: {
    street: String,
    city: String,
    region: String,
    postalCode: String,
    country: { type: String, default: 'Ukraine' }
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  capacity: {
    totalArea: Number, // square meters
    storageZones: Number,
    loadingDocks: Number,
    maxWeight: Number // kg
  },
  currentLoad: {
    packagesCount: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    utilizationPercent: { type: Number, default: 0 }
  },
  workingHours: {
    weekdays: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '20:00' }
    },
    weekends: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' }
    }
  },
  staff: [{
    employeeId: String,
    name: String,
    position: String,
    shift: String
  }],
  equipment: [{
    type: String, // forklift, scanner, scale, etc.
    id: String,
    status: String,
    lastMaintenance: Date
  }],
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Route Model for Courier Routes
const RouteSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  type: {
    type: String,
    enum: ['delivery', 'pickup', 'mixed', 'scheduled'],
    default: 'mixed'
  },
  courier: {
    employeeId: { type: String, required: true },
    name: String,
    phone: String
  },
  vehicle: {
    vehicleId: String,
    licensePlate: String,
    type: String
  },
  startLocation: {
    warehouseId: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  endLocation: {
    warehouseId: String,
    address: String,
    latitude: Number,
    longitude: Number
  },
  stops: [{
    stopId: String,
    sequence: Number,
    type: { type: String, enum: ['pickup', 'delivery'] },
    address: {
      street: String,
      city: String,
      postalCode: String
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    customerInfo: {
      name: String,
      phone: String,
      notes: String
    },
    packages: [{
      trackingNumber: String,
      weight: Number,
      dimensions: String,
      value: Number
    }],
    timeWindow: {
      earliest: Date,
      latest: Date,
      estimated: Date
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'rescheduled'],
      default: 'pending'
    },
    completedAt: Date,
    notes: String,
    signature: String, // base64 image
    photo: String     // base64 image
  }],
  schedule: {
    plannedStart: Date,
    plannedEnd: Date,
    actualStart: Date,
    actualEnd: Date
  },
  status: {
    type: String,
    enum: ['planned', 'started', 'in_progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  metrics: {
    totalDistance: Number, // km
    estimatedDuration: Number, // minutes
    actualDuration: Number,
    fuelConsumption: Number, // liters
    completedStops: { type: Number, default: 0 },
    totalStops: Number,
    efficiency: Number // percentage
  },
  realTimeTracking: {
    currentLocation: {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    },
    lastUpdate: Date,
    isTracking: { type: Boolean, default: false }
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Delivery Zone Model for Geographic Coverage
const DeliveryZoneSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['city', 'suburban', 'rural', 'express', 'restricted'],
    required: true
  },
  boundaries: {
    // GeoJSON polygon for zone boundaries
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of coordinate arrays
      required: true
    }
  },
  serviceLevel: {
    type: String,
    enum: ['standard', 'express', 'premium', 'economy'],
    default: 'standard'
  },
  deliveryTimes: {
    standard: String, // "1-2 days"
    express: String   // "same day"
  },
  restrictions: {
    maxWeight: Number,
    maxDimensions: String,
    requiresSpecialHandling: Boolean,
    accessRestrictions: [String]
  },
  coverage: {
    postalCodes: [String],
    cities: [String],
    regions: [String]
  },
  assignedWarehouses: [{
    warehouseId: String,
    priority: Number
  }],
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Package Tracking Model
const PackageSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['created', 'collected', 'in_transit', 'sorting', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned'],
    default: 'created'
  },
  sender: {
    name: String,
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      region: String,
      postalCode: String
    }
  },
  recipient: {
    name: String,
    phone: String,
    email: String,
    address: {
      street: String,
      city: String,
      region: String,
      postalCode: String
    }
  },
  packageInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    value: Number,
    description: String,
    fragile: Boolean,
    requiresSignature: Boolean
  },
  route: {
    currentRouteId: String,
    currentWarehouseId: String,
    nextWarehouseId: String,
    estimatedDelivery: Date
  },
  history: [{
    status: String,
    location: String,
    timestamp: Date,
    notes: String,
    employeeId: String
  }],
  sla: {
    promisedDelivery: Date,
    actualDelivery: Date,
    isOnTime: Boolean
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Create indexes for better performance
VehicleSchema.index({ tenantId: 1, status: 1 })
VehicleSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 })

WarehouseSchema.index({ tenantId: 1, type: 1 })
WarehouseSchema.index({ 'location.latitude': 1, 'location.longitude': 1 })

RouteSchema.index({ tenantId: 1, status: 1 })
RouteSchema.index({ 'courier.employeeId': 1 })
RouteSchema.index({ 'schedule.plannedStart': 1 })

DeliveryZoneSchema.index({ tenantId: 1, type: 1 })
DeliveryZoneSchema.index({ boundaries: '2dsphere' })

PackageSchema.index({ tenantId: 1, status: 1 })
PackageSchema.index({ trackingNumber: 1 })
PackageSchema.index({ 'route.currentWarehouseId': 1 })

export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema)
export const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', WarehouseSchema)
export const Route = mongoose.models.Route || mongoose.model('Route', RouteSchema)
export const DeliveryZone = mongoose.models.DeliveryZone || mongoose.model('DeliveryZoneSchema', DeliveryZoneSchema)
export const Package = mongoose.models.Package || mongoose.model('Package', PackageSchema)