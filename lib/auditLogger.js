import { AuditLog } from './models/Session'

export async function logAuditEvent({
  userId,
  tenantId,
  action,
  resource,
  resourceId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
  location = {}
}) {
  try {
    const auditLog = new AuditLog({
      userId,
      tenantId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      location,
      timestamp: new Date()
    })
    
    await auditLog.save()
    return auditLog
  } catch (error) {
    console.error('Audit logging error:', error)
    // Don't throw - audit logging should not break main functionality
    return null
  }
}

export async function getAuditLogs({
  tenantId,
  userId = null,
  action = null,
  resource = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50
}) {
  const query = { tenantId }
  
  if (userId) query.userId = userId
  if (action) query.action = action
  if (resource) query.resource = resource
  
  if (startDate || endDate) {
    query.timestamp = {}
    if (startDate) query.timestamp.$gte = new Date(startDate)
    if (endDate) query.timestamp.$lte = new Date(endDate)
  }
  
  const skip = (page - 1) * limit
  
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query)
  ])
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}