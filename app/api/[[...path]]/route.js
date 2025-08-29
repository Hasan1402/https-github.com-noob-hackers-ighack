import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// JWT secret - in production, use a proper secret from env
const JWT_SECRET = process.env.JWT_SECRET || 'tis-kis-secret-key-2024'

// Helper function to verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint - GET /api/
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "ТИС КІС API v1.0",
        status: "working"
      }))
    }

    // AUTH ROUTES
    
    // Register - POST /api/auth/register
    if (route === '/auth/register' && method === 'POST') {
      const { email, password, fullName, role = 'user' } = await request.json()

      if (!email || !password || !fullName) {
        return handleCORS(NextResponse.json(
          { error: "Усі поля обов'язкові" }, 
          { status: 400 }
        ))
      }

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: "Користувач з таким email уже існує" }, 
          { status: 400 }
        ))
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        fullName,
        role: ['admin', 'manager', 'user'].includes(role) ? role : 'user',
        createdAt: new Date(),
        isActive: true
      }

      await db.collection('users').insertOne(user)

      // Remove password from response
      const { password: _, ...userResponse } = user
      return handleCORS(NextResponse.json({ 
        message: "Користувач успішно зареєстрований",
        user: userResponse
      }))
    }

    // Login - POST /api/auth/login
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: "Email та пароль обов'язкові" }, 
          { status: 400 }
        ))
      }

      // Find user
      const user = await db.collection('users').findOne({ email })
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: "Неправильний email або пароль" }, 
          { status: 401 }
        ))
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return handleCORS(NextResponse.json(
          { error: "Неправильний email або пароль" }, 
          { status: 401 }
        ))
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      // Remove password from response
      const { password: _, ...userResponse } = user
      return handleCORS(NextResponse.json({ 
        message: "Успішна авторизація",
        token,
        user: userResponse
      }))
    }

    // Verify Token - GET /api/auth/verify
    if (route === '/auth/verify' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Недійсний токен" }, 
          { status: 401 }
        ))
      }

      // Get current user data
      const user = await db.collection('users').findOne({ id: decoded.userId })
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: "Користувач не знайдений" }, 
          { status: 404 }
        ))
      }

      const { password: _, ...userResponse } = user
      return handleCORS(NextResponse.json({ 
        user: userResponse,
        valid: true
      }))
    }

    // USER ROUTES

    // Get Users - GET /api/users (Admin/Manager only)
    if (route === '/users' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      if (!['admin', 'manager'].includes(decoded.role)) {
        return handleCORS(NextResponse.json(
          { error: "Недостатньо прав доступу" }, 
          { status: 403 }
        ))
      }

      const users = await db.collection('users')
        .find({}, { projection: { password: 0 } })
        .toArray()

      return handleCORS(NextResponse.json(users))
    }

    // Get Current User Profile - GET /api/users/me
    if (route === '/users/me' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const user = await db.collection('users').findOne(
        { id: decoded.userId },
        { projection: { password: 0 } }
      )

      if (!user) {
        return handleCORS(NextResponse.json(
          { error: "Користувач не знайдений" }, 
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json(user))
    }

    // DOCUMENT ROUTES (Basic)

    // Get Documents - GET /api/documents
    if (route === '/documents' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      // For now, return mock documents
      const documents = [
        {
          id: uuidv4(),
          name: "Звіт за грудень",
          type: "PDF",
          size: "2.3 MB",
          uploadedBy: decoded.userId,
          uploadedAt: new Date(),
          folder: "Звіти"
        },
        {
          id: uuidv4(),
          name: "Навчальний план",
          type: "DOCX", 
          size: "1.2 MB",
          uploadedBy: decoded.userId,
          uploadedAt: new Date(),
          folder: "Планування"
        }
      ]

      return handleCORS(NextResponse.json(documents))
    }

    // DASHBOARD STATS

    // Get Dashboard Stats - GET /api/dashboard/stats
    if (route === '/dashboard/stats' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const stats = {
        totalUsers: await db.collection('users').countDocuments(),
        totalDocuments: 0, // Will implement when we have documents
        activeProjects: 0,
        pendingTasks: 0
      }

      return handleCORS(NextResponse.json(stats))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Внутрішня помилка сервера" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute