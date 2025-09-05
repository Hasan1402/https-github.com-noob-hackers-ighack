import connectDB from './mongodb'
import Tenant from './models/Tenant'
import User from './models/User'
import { Role, Permission } from './models/Role'

export async function initializeNovaPoshtaTenant() {
  await connectDB()
  
  try {
    // Check if Nova Poshta tenant already exists
    let tenant = await Tenant.findOne({ slug: 'nova-poshta' })
    
    if (!tenant) {
      // Create Nova Poshta tenant
      tenant = new Tenant({
        name: 'Нова Пошта',
        slug: 'nova-poshta',
        type: 'headquarters',
        address: {
          city: 'Київ',
          region: 'Київська область',
          address: 'вул. Космічна, 6',
          zipCode: '02660'
        },
        settings: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false, // More flexible for logistics workers
            passwordExpiryDays: 90,
            preventPasswordReuse: 3
          },
          sessionPolicy: {
            sessionTimeoutMinutes: 60, // Longer sessions for warehouse work
            maxConcurrentSessions: 3
          },
          twoFactorPolicy: {
            enforceForAdmins: true,
            enforceForAllUsers: false
          },
          loginPolicy: {
            maxFailedAttempts: 5,
            lockoutDurationMinutes: 30
          },
          accessControlPolicy: {
            requireCardAccess: true,
            workingHours: {
              start: '06:00',
              end: '22:00'
            },
            allowWeekendAccess: true // Logistics work 24/7
          }
        },
        isActive: true
      })
      
      await tenant.save()
      console.log('✅ Created Nova Poshta tenant')
    }
    
    // Create default permissions
    await createDefaultPermissions(tenant._id.toString())
    
    // Create default roles
    await createDefaultRoles(tenant._id.toString())
    
    // Create default admin user
    await createDefaultUsers(tenant._id.toString())
    
    return tenant
  } catch (error) {
    console.error('Tenant initialization error:', error)
    throw error
  }
}

async function createDefaultPermissions(tenantId) {
  const permissions = [
    // HR Permissions
    { name: 'hr:read', resource: 'hr', action: 'read', description: 'Перегляд HR даних' },
    { name: 'hr:manage', resource: 'hr', action: 'manage', description: 'Управління HR' },
    { name: 'employees:read', resource: 'employees', action: 'read', description: 'Перегляд співробітників' },
    { name: 'employees:manage', resource: 'employees', action: 'manage', description: 'Управління співробітниками' },
    
    // Logistics Permissions
    { name: 'warehouse:read', resource: 'warehouse', action: 'read', description: 'Перегляд складу' },
    { name: 'warehouse:manage', resource: 'warehouse', action: 'manage', description: 'Управління складом' },
    { name: 'routes:read', resource: 'routes', action: 'read', description: 'Перегляд маршрутів' },
    { name: 'routes:manage', resource: 'routes', action: 'manage', description: 'Управління маршрутами' },
    { name: 'shipments:read', resource: 'shipments', action: 'read', description: 'Перегляд відправлень' },
    { name: 'shipments:manage', resource: 'shipments', action: 'manage', description: 'Управління відправленнями' },
    
    // Financial Permissions
    { name: 'finance:read', resource: 'finance', action: 'read', description: 'Перегляд фінансів' },
    { name: 'finance:manage', resource: 'finance', action: 'manage', description: 'Управління фінансами' },
    { name: 'payroll:read', resource: 'payroll', action: 'read', description: 'Перегляд зарплат' },
    { name: 'payroll:manage', resource: 'payroll', action: 'manage', description: 'Управління зарплатами' },
    
    // System Permissions
    { name: 'audit:read', resource: 'audit', action: 'read', description: 'Перегляд аудиту' },
    { name: 'settings:manage', resource: 'settings', action: 'manage', description: 'Управління налаштуваннями' },
    { name: 'reports:read', resource: 'reports', action: 'read', description: 'Перегляд звітів' },
    { name: 'analytics:read', resource: 'analytics', action: 'read', description: 'Перегляд аналітики' }
  ]
  
  for (const perm of permissions) {
    const existing = await Permission.findOne({
      name: perm.name,
      tenantId
    })
    
    if (!existing) {
      await new Permission({
        ...perm,
        tenantId
      }).save()
    }
  }
  
  console.log('✅ Created default permissions')
}

async function createDefaultRoles(tenantId) {
  const roles = [
    {
      name: 'admin',
      displayName: 'Системний адміністратор',
      description: 'Повний доступ до всіх функцій системи',
      accessLevel: 'admin',
      permissions: [
        'hr:manage', 'employees:manage', 'warehouse:manage', 'routes:manage',
        'shipments:manage', 'finance:manage', 'payroll:manage', 'audit:read',
        'settings:manage', 'reports:read', 'analytics:read'
      ],
      isSystemRole: true
    },
    {
      name: 'regional_manager',
      displayName: 'Регіональний менеджер',
      description: 'Управління регіональними операціями',
      accessLevel: 'regional',
      permissions: [
        'hr:read', 'employees:read', 'warehouse:read', 'routes:manage',
        'shipments:read', 'finance:read', 'reports:read', 'analytics:read'
      ],
      isSystemRole: true
    },
    {
      name: 'warehouse_manager',
      displayName: 'Менеджер складу',
      description: 'Управління складськими операціями',
      accessLevel: 'warehouse',
      permissions: [
        'warehouse:manage', 'shipments:manage', 'employees:read', 'reports:read'
      ],
      isSystemRole: true
    },
    {
      name: 'branch_manager',
      displayName: 'Менеджер відділення',
      description: 'Управління відділенням',
      accessLevel: 'branch',
      permissions: [
        'shipments:read', 'employees:read', 'reports:read'
      ],
      isSystemRole: true
    },
    {
      name: 'courier',
      displayName: 'Курʼєр',
      description: 'Доставка та забір відправлень',
      accessLevel: 'basic',
      permissions: [
        'routes:read', 'shipments:read'
      ],
      isSystemRole: true
    },
    {
      name: 'warehouse_operator',
      displayName: 'Оператор складу',
      description: 'Робота зі складськими операціями',
      accessLevel: 'basic',
      permissions: [
        'warehouse:read', 'shipments:read'
      ],
      isSystemRole: true
    },
    {
      name: 'hr_manager',
      displayName: 'HR менеджер',
      description: 'Управління персоналом',
      accessLevel: 'branch',
      permissions: [
        'hr:manage', 'employees:manage', 'payroll:read', 'reports:read'
      ],
      isSystemRole: true
    },
    {
      name: 'employee',
      displayName: 'Співробітник',
      description: 'Базовий користувач системи',
      accessLevel: 'basic',
      permissions: [
        'reports:read'
      ],
      isSystemRole: true
    }
  ]
  
  for (const roleData of roles) {
    let role = await Role.findOne({
      name: roleData.name,
      tenantId
    })
    
    if (!role) {
      // Get permission IDs
      const permissionIds = await Permission.find({
        name: { $in: roleData.permissions },
        tenantId
      }).select('_id')
      
      role = new Role({
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        accessLevel: roleData.accessLevel,
        permissions: permissionIds.map(p => p._id),
        tenantId,
        isSystemRole: roleData.isSystemRole
      })
      
      await role.save()
    }
  }
  
  console.log('✅ Created default roles')
}

async function createDefaultUsers(tenantId) {
  // Create system admin
  const adminExists = await User.findOne({
    email: 'admin@novaposhta.ua',
    tenantId
  })
  
  if (!adminExists) {
    const admin = new User({
      email: 'admin@novaposhta.ua',
      password: 'NovaPoshtaAdmin2025!',
      firstName: 'Системний',
      lastName: 'Адміністратор',
      tenantId,
      roles: ['admin'],
      department: 'IT',
      position: 'Системний адміністратор',
      accessLevel: 'admin',
      employeeId: 'NP-ADMIN-001',
      workLocation: 'Головний офіс',
      isActive: true,
      isEmailVerified: true
    })
    
    await admin.save()
    console.log('✅ Created system admin user')
  }
  
  // Create HR manager
  const hrExists = await User.findOne({
    email: 'hr@novaposhta.ua',
    tenantId
  })
  
  if (!hrExists) {
    const hrManager = new User({
      email: 'hr@novaposhta.ua',
      password: 'NovaPoshtaHR2025!',
      firstName: 'Марія',
      lastName: 'Петренко',
      tenantId,
      roles: ['hr_manager'],
      department: 'HR',
      position: 'HR менеджер',
      accessLevel: 'branch',
      employeeId: 'NP-HR-001',
      workLocation: 'Головний офіс',
      isActive: true,
      isEmailVerified: true
    })
    
    await hrManager.save()
    console.log('✅ Created HR manager user')
  }
  
  // Create warehouse manager
  const warehouseExists = await User.findOne({
    email: 'warehouse@novaposhta.ua',
    tenantId
  })
  
  if (!warehouseExists) {
    const warehouseManager = new User({
      email: 'warehouse@novaposhta.ua',
      password: 'NovaPoshtaWH2025!',
      firstName: 'Олексій',
      lastName: 'Коваленко',
      tenantId,
      roles: ['warehouse_manager'],
      department: 'Логістика',
      position: 'Менеджер складу',
      accessLevel: 'warehouse',
      employeeId: 'NP-WH-001',
      workLocation: 'Центральний склад',
      isActive: true,
      isEmailVerified: true
    })
    
    await warehouseManager.save()
    console.log('✅ Created warehouse manager user')
  }
  
  // Create test courier
  const courierExists = await User.findOne({
    email: 'courier@novaposhta.ua',
    tenantId
  })
  
  if (!courierExists) {
    const courier = new User({
      email: 'courier@novaposhta.ua',
      password: 'NovaPoshta2025!',
      firstName: 'Іван',
      lastName: 'Сидоренко',
      tenantId,
      roles: ['courier'],
      department: 'Доставка',
      position: 'Курʼєр',
      accessLevel: 'basic',
      employeeId: 'NP-COU-001',
      workLocation: 'Відділення №1',
      isActive: true,
      isEmailVerified: true
    })
    
    await courier.save()
    console.log('✅ Created test courier user')
  }
}