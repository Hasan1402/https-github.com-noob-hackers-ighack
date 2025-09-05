import mongoose from 'mongoose'

const TenantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  domain: { 
    type: String 
  },
  logo: { 
    type: String 
  },
  type: {
    type: String,
    enum: ['headquarters', 'region', 'branch', 'warehouse'],
    default: 'branch'
  },
  address: {
    city: String,
    region: String,
    address: String,
    zipCode: String
  },
  settings: {
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: true },
      passwordExpiryDays: { type: Number, default: 90 },
      preventPasswordReuse: { type: Number, default: 5 }
    },
    sessionPolicy: {
      sessionTimeoutMinutes: { type: Number, default: 30 },
      maxConcurrentSessions: { type: Number, default: 5 }
    },
    twoFactorPolicy: {
      enforceForAdmins: { type: Boolean, default: true },
      enforceForAllUsers: { type: Boolean, default: false }
    },
    loginPolicy: {
      maxFailedAttempts: { type: Number, default: 5 },
      lockoutDurationMinutes: { type: Number, default: 30 }
    },
    accessControlPolicy: {
      requireCardAccess: { type: Boolean, default: true },
      workingHours: {
        start: { type: String, default: '08:00' },
        end: { type: String, default: '18:00' }
      },
      allowWeekendAccess: { type: Boolean, default: false }
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true })

export default mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema)