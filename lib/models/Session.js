import mongoose from 'mongoose'

const SessionSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  tenantId: { 
    type: String, 
    required: true, 
    index: true 
  },
  token: { 
    type: String, 
    required: true 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  deviceInfo: {
    type: String
  },
  location: {
    warehouse: String,
    branch: String,
    region: String
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: true 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
})

const AuditLogSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  tenantId: { 
    type: String, 
    required: true, 
    index: true 
  },
  action: { 
    type: String, 
    required: true, 
    index: true 
  },
  resource: { 
    type: String 
  },
  resourceId: { 
    type: String 
  },
  details: { 
    type: Object 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  location: {
    warehouse: String,
    branch: String,
    region: String
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
})

// TTL index for automatic session cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// TTL index for audit log cleanup (keep for 2 years)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 })

export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema)
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)