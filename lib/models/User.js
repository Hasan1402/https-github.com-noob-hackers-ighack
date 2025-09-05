import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  tenantId: { 
    type: String, 
    required: true, 
    index: true 
  },
  roles: [{ 
    type: String, 
    required: true 
  }],
  department: { 
    type: String 
  },
  position: { 
    type: String 
  },
  employeeId: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },
  lastLogin: { 
    type: Date 
  },
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockedUntil: { 
    type: Date 
  },
  passwordLastChanged: { 
    type: Date, 
    default: Date.now 
  },
  passwordResetToken: { 
    type: String 
  },
  passwordResetExpires: { 
    type: Date 
  },
  twoFactorEnabled: { 
    type: Boolean, 
    default: false 
  },
  twoFactorSecret: { 
    type: String 
  },
  preferredLanguage: { 
    type: String, 
    default: 'uk' 
  },
  // HRIS Integration
  hrEmployeeId: {
    type: String
  },
  medicalExamDate: {
    type: Date
  },
  certifications: [{
    name: String,
    issueDate: Date,
    expiryDate: Date,
    issuingBody: String
  }],
  // Access Control
  accessLevel: {
    type: String,
    enum: ['basic', 'warehouse', 'branch', 'admin'],
    default: 'basic'
  },
  workLocation: {
    type: String
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

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Create compound index for tenant-specific queries
UserSchema.index({ email: 1, tenantId: 1 }, { unique: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)