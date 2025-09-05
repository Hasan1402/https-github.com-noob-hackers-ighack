import jwt from 'jsonwebtoken'
import User from './models/User'
import Tenant from './models/Tenant'
import { logAuditEvent } from './auditLogger'

// Enhanced authentication with tenant support
export async function authenticateUser(email, password, tenantSlug = 'nova-poshta') {
  try {
    // Find tenant by slug
    const tenant = await Tenant.findOne({ 
      slug: tenantSlug, 
      isActive: true 
    })
    
    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND')
    }
    
    // Find user in tenant
    const user = await User.findOne({
      email: email.toLowerCase(),
      tenantId: tenant._id.toString(),
      isActive: true
    })
    
    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }
    
    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60))
      throw new Error(`ACCOUNT_LOCKED:${remainingMinutes}`)
    }
    
    // Verify password
    const isValidPassword = await user.comparePassword(password)
    
    if (!isValidPassword) {
      // Handle failed login attempt
      await handleFailedLogin(user, tenant)
      throw new Error('INVALID_CREDENTIALS')
    }
    
    // Check if password expired
    if (isPasswordExpired(user.passwordLastChanged, tenant.settings.passwordPolicy.passwordExpiryDays)) {
      throw new Error('PASSWORD_EXPIRED')
    }
    
    // Reset failed attempts and update login
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLogin = new Date()
    await user.save()
    
    // Generate tokens
    const accessToken = generateAccessToken(user, tenant)
    const refreshToken = generateRefreshToken(user, tenant)
    
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        department: user.department,
        position: user.position,
        accessLevel: user.accessLevel,
        workLocation: user.workLocation,
        tenantId: tenant._id.toString(),
        preferredLanguage: user.preferredLanguage
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour
      },
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

async function handleFailedLogin(user, tenant) {
  user.failedLoginAttempts += 1
  
  // Check if account should be locked
  const maxAttempts = tenant.settings.loginPolicy.maxFailedAttempts
  if (user.failedLoginAttempts >= maxAttempts) {
    const lockoutMinutes = tenant.settings.loginPolicy.lockoutDurationMinutes
    user.lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000)
    
    await logAuditEvent({
      userId: user._id.toString(),
      tenantId: user.tenantId,
      action: 'ACCOUNT_LOCKED',
      resource: 'USER',
      resourceId: user._id.toString(),
      details: { 
        reason: 'Too many failed login attempts',
        attemptCount: user.failedLoginAttempts
      }
    })
  }
  
  await user.save()
}

function isPasswordExpired(lastChanged, expiryDays) {
  if (!expiryDays || expiryDays === 0) return false
  
  const expiryDate = new Date(lastChanged)
  expiryDate.setDate(expiryDate.getDate() + expiryDays)
  
  return new Date() > expiryDate
}

function generateAccessToken(user, tenant) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      tenantId: user.tenantId,
      tenantSlug: tenant.slug,
      roles: user.roles,
      accessLevel: user.accessLevel,
      type: 'access'
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { 
      expiresIn: '1h',
      issuer: 'nova-poshta-erp',
      audience: 'nova-poshta-employees'
    }
  )
}

function generateRefreshToken(user, tenant) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.tenantId,
      type: 'refresh'
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { 
      expiresIn: '7d',
      issuer: 'nova-poshta-erp'
    }
  )
}

// Verify and decode token
export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    
    // Check if user still exists and is active
    const user = await User.findOne({
      _id: decoded.sub,
      tenantId: decoded.tenantId,
      isActive: true
    })
    
    if (!user) {
      throw new Error('USER_NOT_FOUND')
    }
    
    return {
      userId: decoded.sub,
      email: decoded.email,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      roles: decoded.roles,
      accessLevel: decoded.accessLevel,
      user
    }
  } catch (error) {
    throw new Error('INVALID_TOKEN')
  }
}

// Role-based authorization check
export function hasPermission(userRoles, requiredRoles) {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (!userRoles || userRoles.length === 0) return false
  
  return requiredRoles.some(role => userRoles.includes(role))
}

// Access level check
export function hasAccessLevel(userAccessLevel, requiredLevel) {
  const levels = {
    'basic': 0,
    'warehouse': 1,
    'branch': 2,
    'regional': 3,
    'admin': 4
  }
  
  const userLevel = levels[userAccessLevel] || 0
  const requiredLevelNum = levels[requiredLevel] || 0
  
  return userLevel >= requiredLevelNum
}