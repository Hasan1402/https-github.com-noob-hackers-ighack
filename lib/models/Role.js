import mongoose from 'mongoose'

const PermissionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  resource: { 
    type: String, 
    required: true 
  },
  action: { 
    type: String, 
    required: true, 
    enum: ['create', 'read', 'update', 'delete', 'manage'] 
  },
  tenantId: { 
    type: String, 
    required: true 
  }
})

const RoleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  displayName: {
    type: String,
    required: true
  },
  description: { 
    type: String 
  },
  permissions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Permission' 
  }],
  tenantId: { 
    type: String, 
    required: true 
  },
  isSystemRole: { 
    type: Boolean, 
    default: false 
  },
  // Logistics-specific role properties
  accessLevel: {
    type: String,
    enum: ['basic', 'warehouse', 'branch', 'regional', 'admin'],
    default: 'basic'
  },
  canAccessWarehouses: [{
    type: String
  }],
  canAccessBranches: [{
    type: String  
  }],
  workingHours: {
    start: String,
    end: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
})

// Create compound index for tenant-specific roles
RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true })

export const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema)
export const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema)