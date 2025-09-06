import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Helper function to get month name in Ukrainian
function getMonthName(monthNum) {
  const months = [
    '', 'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ]
  return months[monthNum] || ''
}

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db('tis_kis_erp')  // Use correct database name
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

// Helper function to verify JWT token (updated for SSO compatibility)
function verifyToken(request) {
  // First, try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
    console.log('Found token in Authorization header:', token ? 'YES' : 'NO')
  } else {
    // If no Authorization header, try to get token from cookies
    const cookieHeader = request.headers.get('cookie')
    console.log('Cookie header:', cookieHeader ? 'EXISTS' : 'NOT FOUND')
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {})
      
      console.log('Available cookies:', Object.keys(cookies))
      
      // Try different cookie names that SSO might use
      token = cookies.accessToken || cookies.token || cookies.authToken || cookies.access_token
      console.log('Found token in cookies:', token ? 'YES' : 'NO')
    }
  }
  
  if (!token) {
    console.log('No token found in request')
    return null
  }

  console.log('Attempting to verify token, length:', token.length)

  try {
    // Try SSO token first (new format)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    console.log('Successfully decoded token with SSO secret')
    
    // If it's an SSO token, return user info in expected format
    if (decoded.sub && decoded.tenantId && decoded.type === 'access') {
      console.log('Valid SSO token found')
      return {
        userId: decoded.sub,
        email: decoded.email,
        tenantId: decoded.tenantId,
        tenantSlug: decoded.tenantSlug,
        roles: decoded.roles,
        accessLevel: decoded.accessLevel,
        isSSO: true
      }
    }
    
    // Fallback to old format for backwards compatibility
    console.log('Using decoded token as legacy format')
    return decoded
  } catch (error) {
    console.log('SSO token verification failed:', error.message)
    // Try legacy JWT secret as fallback
    try {
      const legacyDecoded = jwt.verify(token, 'tis-kis-secret-key-2024')
      console.log('Successfully decoded token with legacy secret')
      return legacyDecoded
    } catch (legacyError) {
      console.error('Both token verification methods failed. SSO error:', error.message, 'Legacy error:', legacyError.message)
      return null
    }
  }
}

// Helper functions for financial accounting
async function getNextJournalNumber(db) {
  const lastEntry = await db.collection('journal_entries')
    .findOne({}, { sort: { number: -1 } })
  
  return lastEntry ? (lastEntry.number || 0) + 1 : 1
}

async function updateAccountBalances(db, lines) {
  for (const line of lines) {
    const account = await db.collection('chart_of_accounts')
      .findOne({ id: line.accountId })
    
    if (account) {
      let balanceChange = 0
      
      // For asset and expense accounts: debit increases, credit decreases
      if (['asset', 'expense'].includes(account.type)) {
        balanceChange = (line.debit || 0) - (line.credit || 0)
      }
      // For liability, equity, and revenue accounts: credit increases, debit decreases
      else if (['liability', 'equity', 'revenue'].includes(account.type)) {
        balanceChange = (line.credit || 0) - (line.debit || 0)
      }
      
      await db.collection('chart_of_accounts').updateOne(
        { id: line.accountId },
        { 
          $inc: { balance: balanceChange },
          $set: { updatedAt: new Date() }
        }
      )
    }
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path: pathSegments = [] } = params
  const route = `/${pathSegments.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Health check endpoint - GET /api/health
    if (route === '/health' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "ТИС КІС API",
        version: "1.0.0"
      }))
    }

    // Root endpoint - GET /api/
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "ТИС КІС API v1.0",
        status: "working",
        endpoints: [
          "POST /api/auth/register",
          "POST /api/auth/login", 
          "GET /api/auth/verify",
          "GET /api/users",
          "POST /api/documents/upload",
          "GET /api/documents"
        ]
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

    // ENHANCED DOCUMENT ROUTES

    // Upload Document - POST /api/documents/upload
    if (route === '/documents/upload' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      try {
        const formData = await request.formData()
        const file = formData.get('file')
        const title = formData.get('title')
        const description = formData.get('description')

        if (!file || !title) {
          return handleCORS(NextResponse.json(
            { error: "Файл та назва обов'язкові" }, 
            { status: 400 }
          ))
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads')
        try {
          await mkdir(uploadsDir, { recursive: true })
        } catch (e) {
          // Directory might already exist
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name)
        const uniqueFilename = `${uuidv4()}${fileExtension}`
        const filePath = path.join(uploadsDir, uniqueFilename)

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // Create document record
        const document = {
          id: uuidv4(),
          title,
          description: description || '',
          filename: file.name,
          fileSize: file.size,
          filePath: uniqueFilename,
          mimeType: file.type,
          status: 'draft', // draft, review, approved, rejected
          version: 1,
          createdBy: decoded.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedTo: null,
          comments: []
        }

        await db.collection('documents').insertOne(document)

        // Add to workflow history
        const workflowEntry = {
          id: uuidv4(),
          documentId: document.id,
          action: 'created',
          status: 'draft',
          performedBy: decoded.userId,
          comment: 'Документ створено',
          timestamp: new Date()
        }

        await db.collection('workflow_history').insertOne(workflowEntry)

        const { filePath: _, ...documentResponse } = document
        return handleCORS(NextResponse.json({ 
          message: "Документ успішно завантажено",
          document: documentResponse
        }))

      } catch (error) {
        console.error('File upload error:', error)
        return handleCORS(NextResponse.json(
          { error: "Помилка завантаження файлу" }, 
          { status: 500 }
        ))
      }
    }

    // Get Documents with filters - GET /api/documents
    if (route === '/documents' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const assignedToMe = url.searchParams.get('assignedToMe') === 'true'
      const myDocuments = url.searchParams.get('myDocuments') === 'true'

      let filter = {}
      
      if (status && status !== 'all') {
        filter.status = status
      }

      if (assignedToMe) {
        filter.assignedTo = decoded.userId
      }

      if (myDocuments) {
        filter.createdBy = decoded.userId
      }

      // Regular users can only see their own documents or assigned documents
      if (decoded.role === 'user') {
        filter.$or = [
          { createdBy: decoded.userId },
          { assignedTo: decoded.userId }
        ]
      }

      const documents = await db.collection('documents')
        .find(filter, { projection: { filePath: 0 } })
        .sort({ createdAt: -1 })
        .toArray()

      // Get user info for created by field
      const userIds = [...new Set(documents.map(doc => doc.createdBy).filter(Boolean))]
      const users = await db.collection('users')
        .find({ id: { $in: userIds } }, { projection: { password: 0 } })
        .toArray()
      
      const userMap = {}
      users.forEach(user => {
        userMap[user.id] = user
      })

      // Enrich documents with user info
      const enrichedDocuments = documents.map(doc => ({
        ...doc,
        createdByUser: userMap[doc.createdBy] || null
      }))

      return handleCORS(NextResponse.json(enrichedDocuments))
    }

    // Approve Document - PUT /api/documents/:id/approve
    if (route.match(/^\/documents\/(.+)\/approve$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      if (!['admin', 'manager'].includes(decoded.role)) {
        return handleCORS(NextResponse.json(
          { error: "Недостатньо прав для погодження документів" }, 
          { status: 403 }
        ))
      }

      const documentId = route.match(/^\/documents\/(.+)\/approve$/)[1]
      const { comment } = await request.json()

      const document = await db.collection('documents').findOne({ id: documentId })
      if (!document) {
        return handleCORS(NextResponse.json(
          { error: "Документ не знайдено" }, 
          { status: 404 }
        ))
      }

      // Update document status
      await db.collection('documents').updateOne(
        { id: documentId },
        { 
          $set: { 
            status: 'approved',
            updatedAt: new Date(),
            approvedBy: decoded.userId,
            approvedAt: new Date()
          }
        }
      )

      // Add to workflow history
      const workflowEntry = {
        id: uuidv4(),
        documentId,
        action: 'approved',
        status: 'approved',
        performedBy: decoded.userId,
        comment: comment || 'Документ затверджено',
        timestamp: new Date()
      }

      await db.collection('workflow_history').insertOne(workflowEntry)

      return handleCORS(NextResponse.json({ 
        message: "Документ успішно затверджено"
      }))
    }

    // Reject Document - PUT /api/documents/:id/reject
    if (route.match(/^\/documents\/(.+)\/reject$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      if (!['admin', 'manager'].includes(decoded.role)) {
        return handleCORS(NextResponse.json(
          { error: "Недостатньо прав для відхилення документів" }, 
          { status: 403 }
        ))
      }

      const documentId = route.match(/^\/documents\/(.+)\/reject$/)[1]
      const { comment } = await request.json()

      const document = await db.collection('documents').findOne({ id: documentId })
      if (!document) {
        return handleCORS(NextResponse.json(
          { error: "Документ не знайдено" }, 
          { status: 404 }
        ))
      }

      // Update document status
      await db.collection('documents').updateOne(
        { id: documentId },
        { 
          $set: { 
            status: 'rejected',
            updatedAt: new Date(),
            rejectedBy: decoded.userId,
            rejectedAt: new Date()
          }
        }
      )

      // Add to workflow history
      const workflowEntry = {
        id: uuidv4(),
        documentId,
        action: 'rejected',
        status: 'rejected',
        performedBy: decoded.userId,
        comment: comment || 'Документ відхилено',
        timestamp: new Date()
      }

      await db.collection('workflow_history').insertOne(workflowEntry)

      return handleCORS(NextResponse.json({ 
        message: "Документ відхилено"
      }))
    }

    // Send for Review - PUT /api/documents/:id/send-for-review
    if (route.match(/^\/documents\/(.+)\/send-for-review$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const documentId = route.match(/^\/documents\/(.+)\/send-for-review$/)[1]
      const { assignTo, comment } = await request.json()

      const document = await db.collection('documents').findOne({ id: documentId })
      if (!document) {
        return handleCORS(NextResponse.json(
          { error: "Документ не знайдено" }, 
          { status: 404 }
        ))
      }

      // Only document creator can send for review
      if (document.createdBy !== decoded.userId) {
        return handleCORS(NextResponse.json(
          { error: "Тільки автор документа може відправити на перевірку" }, 
          { status: 403 }
        ))
      }

      // Update document status
      await db.collection('documents').updateOne(
        { id: documentId },
        { 
          $set: { 
            status: 'review',
            updatedAt: new Date(),
            assignedTo: assignTo || null
          }
        }
      )

      // Add to workflow history
      const workflowEntry = {
        id: uuidv4(),
        documentId,
        action: 'sent_for_review',
        status: 'review',
        performedBy: decoded.userId,
        comment: comment || 'Документ відправлено на перевірку',
        timestamp: new Date()
      }

      await db.collection('workflow_history').insertOne(workflowEntry)

      return handleCORS(NextResponse.json({ 
        message: "Документ відправлено на перевірку"
      }))
    }

    // Get Document History - GET /api/documents/:id/history
    if (route.match(/^\/documents\/(.+)\/history$/) && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const documentId = route.match(/^\/documents\/(.+)\/history$/)[1]

      const history = await db.collection('workflow_history')
        .find({ documentId })
        .sort({ timestamp: -1 })
        .toArray()

      // Get user info for performed by field
      const userIds = [...new Set(history.map(h => h.performedBy).filter(Boolean))]
      const users = await db.collection('users')
        .find({ id: { $in: userIds } }, { projection: { password: 0 } })
        .toArray()
      
      const userMap = {}
      users.forEach(user => {
        userMap[user.id] = user
      })

      // Enrich history with user info
      const enrichedHistory = history.map(h => ({
        ...h,
        performedByUser: userMap[h.performedBy] || null
      }))

      return handleCORS(NextResponse.json(enrichedHistory))
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

    // CALENDAR AND TASKS ROUTES

    // Create Event - POST /api/calendar/events
    if (route === '/calendar/events' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { title, description, startDate, endDate, type, attendees, location } = await request.json()

      if (!title || !startDate) {
        return handleCORS(NextResponse.json(
          { error: "Назва та дата початку обов'язкові" }, 
          { status: 400 }
        ))
      }

      const event = {
        id: uuidv4(),
        title,
        description: description || '',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        type: type || 'meeting', // meeting, deadline, reminder, holiday
        location: location || '',
        createdBy: decoded.userId,
        attendees: attendees || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('calendar_events').insertOne(event)
      return handleCORS(NextResponse.json({ 
        message: "Подію створено успішно",
        event
      }))
    }

    // Get Events - GET /api/calendar/events
    if (route === '/calendar/events' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')

      let filter = {}
      
      // Filter by date range if provided
      if (startDate && endDate) {
        filter.startDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      // Show user's events and events where user is attendee
      filter.$or = [
        { createdBy: decoded.userId },
        { attendees: { $in: [decoded.userId] } }
      ]

      const events = await db.collection('calendar_events')
        .find(filter)
        .sort({ startDate: 1 })
        .toArray()

      return handleCORS(NextResponse.json(events))
    }

    // Create Task - POST /api/tasks
    if (route === '/tasks' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { title, description, dueDate, priority, assignedTo, status, category } = await request.json()

      if (!title) {
        return handleCORS(NextResponse.json(
          { error: "Назва завдання обов'язкова" }, 
          { status: 400 }
        ))
      }

      const task = {
        id: uuidv4(),
        title,
        description: description || '',
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium', // low, medium, high, urgent
        status: status || 'todo', // todo, in_progress, review, completed, cancelled
        category: category || 'general',
        createdBy: decoded.userId,
        assignedTo: assignedTo || decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null
      }

      await db.collection('tasks').insertOne(task)

      // Create notification for assigned user
      if (assignedTo && assignedTo !== decoded.userId) {
        const notification = {
          id: uuidv4(),
          userId: assignedTo,
          type: 'task_assigned',
          title: 'Нове завдання призначено',
          message: `Вам призначено завдання: ${title}`,
          relatedId: task.id,
          relatedType: 'task',
          read: false,
          createdAt: new Date()
        }
        await db.collection('notifications').insertOne(notification)
      }

      return handleCORS(NextResponse.json({ 
        message: "Завдання створено успішно",
        task
      }))
    }

    // Get Tasks - GET /api/tasks
    if (route === '/tasks' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const assignedToMe = url.searchParams.get('assignedToMe') === 'true'
      const myTasks = url.searchParams.get('myTasks') === 'true'

      let filter = {}

      if (status && status !== 'all') {
        filter.status = status
      }

      if (assignedToMe) {
        filter.assignedTo = decoded.userId
      } else if (myTasks) {
        filter.createdBy = decoded.userId
      } else {
        // Show tasks assigned to user or created by user
        filter.$or = [
          { assignedTo: decoded.userId },
          { createdBy: decoded.userId }
        ]
      }

      const tasks = await db.collection('tasks')
        .find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .toArray()

      // Get user info for assigned to and created by
      const userIds = [...new Set([
        ...tasks.map(task => task.assignedTo).filter(Boolean),
        ...tasks.map(task => task.createdBy).filter(Boolean)
      ])]
      
      const users = await db.collection('users')
        .find({ id: { $in: userIds } }, { projection: { password: 0 } })
        .toArray()
      
      const userMap = {}
      users.forEach(user => {
        userMap[user.id] = user
      })

      // Enrich tasks with user info
      const enrichedTasks = tasks.map(task => ({
        ...task,
        assignedToUser: userMap[task.assignedTo] || null,
        createdByUser: userMap[task.createdBy] || null
      }))

      return handleCORS(NextResponse.json(enrichedTasks))
    }

    // Update Task Status - PUT /api/tasks/:id/status
    if (route.match(/^\/tasks\/(.+)\/status$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const taskId = route.match(/^\/tasks\/(.+)\/status$/)[1]
      const { status, comment } = await request.json()

      const task = await db.collection('tasks').findOne({ id: taskId })
      if (!task) {
        return handleCORS(NextResponse.json(
          { error: "Завдання не знайдено" }, 
          { status: 404 }
        ))
      }

      // Check permissions
      if (task.assignedTo !== decoded.userId && task.createdBy !== decoded.userId) {
        return handleCORS(NextResponse.json(
          { error: "Недостатньо прав для зміни статусу завдання" }, 
          { status: 403 }
        ))
      }

      const updateData = {
        status,
        updatedAt: new Date()
      }

      if (status === 'completed') {
        updateData.completedAt = new Date()
      }

      await db.collection('tasks').updateOne(
        { id: taskId },
        { $set: updateData }
      )

      // Create activity log
      const activity = {
        id: uuidv4(),
        taskId,
        action: 'status_changed',
        oldValue: task.status,
        newValue: status,
        performedBy: decoded.userId,
        comment: comment || '',
        timestamp: new Date()
      }

      await db.collection('task_activities').insertOne(activity)

      return handleCORS(NextResponse.json({ 
        message: "Статус завдання оновлено"
      }))
    }

    // Get Notifications - GET /api/notifications
    if (route === '/notifications' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const notifications = await db.collection('notifications')
        .find({ userId: decoded.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      return handleCORS(NextResponse.json(notifications))
    }

    // Mark Notification as Read - PUT /api/notifications/:id/read
    if (route.match(/^\/notifications\/(.+)\/read$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const notificationId = route.match(/^\/notifications\/(.+)\/read$/)[1]

      await db.collection('notifications').updateOne(
        { id: notificationId, userId: decoded.userId },
        { $set: { read: true, readAt: new Date() } }
      )

      return handleCORS(NextResponse.json({ 
        message: "Повідомлення позначено як прочитане"
      }))
    }

    // ANALYTICS AND REPORTS ROUTES

    // Get Dashboard Analytics - GET /api/analytics/dashboard
    if (route === '/analytics/dashboard' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      try {
        // Get various statistics
        const [
          totalUsers,
          totalDocuments,
          totalTasks,
          totalEvents,
          pendingDocuments,
          completedTasks,
          upcomingEvents,
          recentActivities
        ] = await Promise.all([
          db.collection('users').countDocuments(),
          db.collection('documents').countDocuments(),
          db.collection('tasks').countDocuments(),
          db.collection('calendar_events').countDocuments(),
          db.collection('documents').countDocuments({ status: 'review' }),
          db.collection('tasks').countDocuments({ status: 'completed' }),
          db.collection('calendar_events').countDocuments({
            startDate: { $gte: new Date() }
          }),
          db.collection('workflow_history')
            .find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray()
        ])

        // Calculate completion rates
        const documentCompletionRate = totalDocuments > 0 ? 
          ((await db.collection('documents').countDocuments({ status: 'approved' })) / totalDocuments * 100).toFixed(1) : 0

        const taskCompletionRate = totalTasks > 0 ? 
          (completedTasks / totalTasks * 100).toFixed(1) : 0

        // Get user activity stats (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const userActivity = await db.collection('workflow_history')
          .aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$performedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ])
          .toArray()

        const analytics = {
          overview: {
            totalUsers,
            totalDocuments,
            totalTasks,
            totalEvents,
            pendingDocuments,
            completedTasks,
            upcomingEvents
          },
          performance: {
            documentCompletionRate: parseFloat(documentCompletionRate),
            taskCompletionRate: parseFloat(taskCompletionRate),
            averageProcessingTime: '2.3 дні' // Mock data
          },
          activity: {
            recentActivities: recentActivities.slice(0, 5),
            topUsers: userActivity
          },
          trends: {
            documentsLastWeek: await db.collection('documents')
              .countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }),
            tasksLastWeek: await db.collection('tasks')
              .countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              })
          }
        }

        return handleCORS(NextResponse.json(analytics))

      } catch (error) {
        console.error('Analytics error:', error)
        return handleCORS(NextResponse.json(
          { error: "Помилка отримання аналітики" }, 
          { status: 500 }
        ))
      }
    }

    // Get Document Statistics - GET /api/analytics/documents
    if (route === '/analytics/documents' && method === 'GET') {
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

      try {
        // Document status distribution
        const statusStats = await db.collection('documents')
          .aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ])
          .toArray()

        // Documents by month (last 6 months)
        const monthlyStats = await db.collection('documents')
          .aggregate([
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
              }
            },
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ])
          .toArray()

        // Top document creators
        const topCreators = await db.collection('documents')
          .aggregate([
            { $group: { _id: '$createdBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ])
          .toArray()

        const documentAnalytics = {
          statusDistribution: statusStats,
          monthlyTrends: monthlyStats,
          topCreators: topCreators,
          averageProcessingTime: {
            draft: '1.2 дні',
            review: '2.1 дні',
            approved: '0.8 дні'
          }
        }

        return handleCORS(NextResponse.json(documentAnalytics))

      } catch (error) {
        console.error('Document analytics error:', error)
        return handleCORS(NextResponse.json(
          { error: "Помилка отримання статистики документів" }, 
          { status: 500 }
        ))
      }
    }

    // Generate Report - POST /api/analytics/reports
    if (route === '/analytics/reports' && method === 'POST') {
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

      const { reportType, dateFrom, dateTo, filters } = await request.json()

      if (!reportType || !dateFrom || !dateTo) {
        return handleCORS(NextResponse.json(
          { error: "Тип звіту та діапазон дат обов'язкові" }, 
          { status: 400 }
        ))
      }

      try {
        const report = {
          id: uuidv4(),
          type: reportType,
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
          filters: filters || {},
          generatedBy: decoded.userId,
          generatedAt: new Date(),
          status: 'completed',
          data: {}
        }

        // Generate report data based on type
        if (reportType === 'documents') {
          const documents = await db.collection('documents')
            .find({
              createdAt: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTo)
              }
            })
            .toArray()

          report.data = {
            totalDocuments: documents.length,
            byStatus: documents.reduce((acc, doc) => {
              acc[doc.status] = (acc[doc.status] || 0) + 1
              return acc
            }, {}),
            documents: documents.map(doc => ({
              title: doc.title,
              status: doc.status,
              createdAt: doc.createdAt,
              createdBy: doc.createdBy
            }))
          }
        } else if (reportType === 'tasks') {
          const tasks = await db.collection('tasks')
            .find({
              createdAt: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTo)
              }
            })
            .toArray()

          report.data = {
            totalTasks: tasks.length,
            byStatus: tasks.reduce((acc, task) => {
              acc[task.status] = (acc[task.status] || 0) + 1
              return acc
            }, {}),
            byPriority: tasks.reduce((acc, task) => {
              acc[task.priority] = (acc[task.priority] || 0) + 1
              return acc
            }, {})
          }
        }

        // Save report
        await db.collection('reports').insertOne(report)

        return handleCORS(NextResponse.json({
          message: "Звіт сформовано успішно",
          report: { ...report, data: undefined }, // Don't send data in response
          downloadUrl: `/api/analytics/reports/${report.id}/download`
        }))

      } catch (error) {
        console.error('Report generation error:', error)
        return handleCORS(NextResponse.json(
          { error: "Помилка генерації звіту" }, 
          { status: 500 }
        ))
      }
    }

    // HR AND PERSONNEL MANAGEMENT ROUTES

    // Create Employee - POST /api/hr/employees
    if (route === '/hr/employees' && method === 'POST') {
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

      const { 
        fullName, 
        position, 
        department, 
        employeeId, 
        phoneNumber, 
        email, 
        hireDate,
        salary,
        workSchedule,
        contractType 
      } = await request.json()

      if (!fullName || !position || !department) {
        return handleCORS(NextResponse.json(
          { error: "Обов'язкові поля: ПІБ, посада, підрозділ" }, 
          { status: 400 }
        ))
      }

      const employee = {
        id: uuidv4(),
        fullName,
        position,
        department,
        employeeId: employeeId || `EMP-${Date.now()}`,
        phoneNumber: phoneNumber || '',
        email: email || '',
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        salary: salary || 0,
        workSchedule: workSchedule || '8:00-17:00',
        contractType: contractType || 'permanent', // permanent, temporary, contract
        status: 'active', // active, inactive, fired
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('employees').insertOne(employee)
      return handleCORS(NextResponse.json({ 
        message: "Співробітника додано успішно",
        employee
      }))
    }

    // Get Employees - GET /api/hr/employees
    if (route === '/hr/employees' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const department = url.searchParams.get('department')
      const status = url.searchParams.get('status')

      let filter = {}
      if (department && department !== 'all') {
        filter.department = department
      }
      if (status && status !== 'all') {
        filter.status = status
      }

      const employees = await db.collection('employees')
        .find(filter)
        .sort({ fullName: 1 })
        .toArray()

      return handleCORS(NextResponse.json(employees))
    }

    // TIMESHEET ROUTES

    // Create Timesheet Entry - POST /api/timesheet/entries
    if (route === '/timesheet/entries' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { 
        employeeId, 
        date, 
        startTime, 
        endTime, 
        breakTime, 
        workHours,
        overtime,
        absenceType,
        comments 
      } = await request.json()

      if (!employeeId || !date) {
        return handleCORS(NextResponse.json(
          { error: "Обов'язкові поля: ID співробітника, дата" }, 
          { status: 400 }
        ))
      }

      const entry = {
        id: uuidv4(),
        employeeId,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        breakTime: breakTime || 0,
        workHours: workHours || 0,
        overtime: overtime || 0,
        absenceType: absenceType || null, // sick, vacation, business_trip, personal
        comments: comments || '',
        status: 'submitted', // submitted, approved, rejected
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('timesheet_entries').insertOne(entry)
      return handleCORS(NextResponse.json({ 
        message: "Запис табеля додано успішно",
        entry
      }))
    }

    // Get Timesheet Entries - GET /api/timesheet/entries
    if (route === '/timesheet/entries' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const employeeId = url.searchParams.get('employeeId')
      const dateFrom = url.searchParams.get('dateFrom')
      const dateTo = url.searchParams.get('dateTo')
      const month = url.searchParams.get('month')

      let filter = {}
      
      if (employeeId) {
        filter.employeeId = employeeId
      }

      if (dateFrom && dateTo) {
        filter.date = {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo)
        }
      } else if (month) {
        const monthDate = new Date(month)
        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        filter.date = {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }

      const entries = await db.collection('timesheet_entries')
        .find(filter)
        .sort({ date: -1 })
        .toArray()

      // Get employee details
      const employeeIds = [...new Set(entries.map(entry => entry.employeeId))]
      const employees = await db.collection('employees')
        .find({ id: { $in: employeeIds } })
        .toArray()
      
      const employeeMap = {}
      employees.forEach(emp => {
        employeeMap[emp.id] = emp
      })

      // Enrich entries with employee info
      const enrichedEntries = entries.map(entry => ({
        ...entry,
        employee: employeeMap[entry.employeeId] || null
      }))

      return handleCORS(NextResponse.json(enrichedEntries))
    }

    // BUSINESS TRIP ROUTES

    // Create Business Trip - POST /api/hr/business-trips
    if (route === '/hr/business-trips' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { 
        employeeId, 
        destination, 
        purpose, 
        startDate, 
        endDate, 
        transportType,
        estimatedCost,
        comments 
      } = await request.json()

      if (!employeeId || !destination || !purpose || !startDate || !endDate) {
        return handleCORS(NextResponse.json(
          { error: "Всі основні поля обов'язкові" }, 
          { status: 400 }
        ))
      }

      const businessTrip = {
        id: uuidv4(),
        employeeId,
        destination,
        purpose,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        transportType: transportType || 'car',
        estimatedCost: estimatedCost || 0,
        actualCost: 0,
        comments: comments || '',
        status: 'pending', // pending, approved, rejected, completed
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('business_trips').insertOne(businessTrip)
      return handleCORS(NextResponse.json({ 
        message: "Заяву на відрядження створено",
        businessTrip
      }))
    }

    // Get Business Trips - GET /api/hr/business-trips
    if (route === '/hr/business-trips' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const employeeId = url.searchParams.get('employeeId')

      let filter = {}
      if (status && status !== 'all') {
        filter.status = status
      }
      if (employeeId) {
        filter.employeeId = employeeId
      }

      const trips = await db.collection('business_trips')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray()

      // Get employee details
      const employeeIds = [...new Set(trips.map(trip => trip.employeeId))]
      const employees = await db.collection('employees')
        .find({ id: { $in: employeeIds } })
        .toArray()
      
      const employeeMap = {}
      employees.forEach(emp => {
        employeeMap[emp.id] = emp
      })

      // Enrich trips with employee info
      const enrichedTrips = trips.map(trip => ({
        ...trip,
        employee: employeeMap[trip.employeeId] || null
      }))

      return handleCORS(NextResponse.json(enrichedTrips))
    }

    // DEPARTMENTS ROUTES

    // Create Department - POST /api/hr/departments
    if (route === '/hr/departments' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      if (!['admin'].includes(decoded.role)) {
        return handleCORS(NextResponse.json(
          { error: "Тільки адміністратор може створювати підрозділи" }, 
          { status: 403 }
        ))
      }

      const { name, description, managerId, parentDepartmentId } = await request.json()

      if (!name) {
        return handleCORS(NextResponse.json(
          { error: "Назва підрозділу обов'язкова" }, 
          { status: 400 }
        ))
      }

      const department = {
        id: uuidv4(),
        name,
        description: description || '',
        managerId: managerId || null,
        parentDepartmentId: parentDepartmentId || null,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('departments').insertOne(department)
      return handleCORS(NextResponse.json({ 
        message: "Підрозділ створено успішно",
        department
      }))
    }

    // ENHANCED TIMESHEET ROUTES

    // Get Monthly Timesheet - GET /api/timesheet/monthly
    if (route === '/timesheet/monthly' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const month = url.searchParams.get('month') // YYYY-MM format
      const department = url.searchParams.get('department')
      const responsiblePersonId = url.searchParams.get('responsiblePersonId')

      if (!month) {
        return handleCORS(NextResponse.json(
          { error: "Параметр місяця обов'язковий (YYYY-MM)" }, 
          { status: 400 }
        ))
      }

      try {
        // Parse month
        const [year, monthNum] = month.split('-').map(Number)
        const startOfMonth = new Date(year, monthNum - 1, 1)
        const endOfMonth = new Date(year, monthNum, 0)
        const daysInMonth = endOfMonth.getDate()

        // Get employees for the department
        let employeeFilter = {}
        if (department && department !== 'all') {
          employeeFilter.department = department
        }

        const employees = await db.collection('employees')
          .find(employeeFilter)
          .sort({ fullName: 1 })
          .toArray()

        // Get timesheet entries for the month
        const timesheetEntries = await db.collection('timesheet_entries')
          .find({
            date: {
              $gte: startOfMonth,
              $lte: endOfMonth
            }
          })
          .toArray()

        // Create timesheet grid
        const timesheetGrid = employees.map(employee => {
          const employeeEntries = timesheetEntries.filter(entry => entry.employeeId === employee.id)
          
          // Create daily entries array
          const dailyEntries = []
          let totalWorkHours = 0
          let totalOvertime = 0
          let workDays = 0
          let weekendDays = 0
          let sickDays = 0
          let vacationDays = 0

          for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, monthNum - 1, day)
            const dayOfWeek = currentDate.getDay() // 0 = Sunday, 6 = Saturday
            const dateString = currentDate.toISOString().split('T')[0]
            
            // Find entry for this date
            const dayEntry = employeeEntries.find(entry => 
              entry.date.toISOString().split('T')[0] === dateString
            )

            let dayType = 'work' // work, weekend, sick, vacation, business_trip, personal
            let hours = 0
            let overtime = 0
            let status = 'present'

            if (dayEntry) {
              hours = dayEntry.workHours || 0
              overtime = dayEntry.overtime || 0
              if (dayEntry.absenceType) {
                dayType = dayEntry.absenceType
                status = dayEntry.absenceType
              }
              totalWorkHours += hours
              totalOvertime += overtime
            } else {
              // Default logic for weekends
              if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayType = 'weekend'
                status = 'weekend'
                weekendDays++
              } else {
                // Default work day
                hours = 8
                totalWorkHours += 8
                workDays++
              }
            }

            // Count different types of days
            if (dayType === 'sick') sickDays++
            else if (dayType === 'vacation') vacationDays++
            else if (status === 'present' && dayType === 'work') workDays++

            dailyEntries.push({
              day,
              date: currentDate,
              dayOfWeek,
              hours,
              overtime,
              dayType,
              status,
              comments: dayEntry?.comments || ''
            })
          }

          return {
            employee,
            dailyEntries,
            summary: {
              totalWorkHours,
              totalOvertime,
              workDays,
              weekendDays, 
              sickDays,
              vacationDays,
              plannedHours: workDays * 8, // Assuming 8h work day
              efficiency: workDays > 0 ? (totalWorkHours / (workDays * 8) * 100).toFixed(1) : 0
            }
          }
        })

        return handleCORS(NextResponse.json({
          month,
          year,
          monthNum,
          daysInMonth,
          employees: timesheetGrid,
          monthName: getMonthName(monthNum)
        }))

      } catch (error) {
        console.error('Monthly timesheet error:', error)
        return handleCORS(NextResponse.json(
          { error: "Помилка отримання місячного табеля" }, 
          { status: 500 }
        ))
      }
    }

    // Update Daily Entry - PUT /api/timesheet/daily/:employeeId/:date
    if (route.match(/^\/timesheet\/daily\/(.+)\/(.+)$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const matches = route.match(/^\/timesheet\/daily\/(.+)\/(.+)$/)
      const employeeId = matches[1]
      const dateStr = matches[2] // YYYY-MM-DD format

      const { hours, overtime, dayType, status, comments } = await request.json()

      try {
        const entryDate = new Date(dateStr)
        
        // Find existing entry
        const existingEntry = await db.collection('timesheet_entries').findOne({
          employeeId,
          date: entryDate
        })

        const entryData = {
          employeeId,
          date: entryDate,
          workHours: hours || 0,
          overtime: overtime || 0,
          absenceType: dayType !== 'work' ? dayType : null,
          comments: comments || '',
          status: status || 'submitted',
          updatedBy: decoded.userId,
          updatedAt: new Date()
        }

        if (existingEntry) {
          // Update existing entry
          await db.collection('timesheet_entries').updateOne(
            { _id: existingEntry._id },
            { $set: entryData }
          )
        } else {
          // Create new entry
          entryData.id = uuidv4()
          entryData.createdBy = decoded.userId
          entryData.createdAt = new Date()
          await db.collection('timesheet_entries').insertOne(entryData)
        }

        return handleCORS(NextResponse.json({
          message: "Запис табеля оновлено",
          entry: entryData
        }))

      } catch (error) {
        console.error('Update daily entry error:', error)
        return handleCORS(NextResponse.json(
          { error: "Помилка оновлення запису" }, 
          { status: 500 }
        ))
      }
    }

    // Get Timesheet Templates - GET /api/timesheet/templates
    if (route === '/timesheet/templates' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      // Return predefined timesheet templates and work codes
      const templates = {
        workCodes: {
          '8': { label: 'Робочий день (8 год)', hours: 8, type: 'work', color: '#10B981' },
          '7': { label: 'Скорочений день (7 год)', hours: 7, type: 'work', color: '#059669' },
          '4': { label: 'Неповний день (4 год)', hours: 4, type: 'work', color: '#34D399' },
          'НТ': { label: 'Нічна зміна', hours: 8, type: 'night', color: '#1E40AF' },
          'В': { label: 'Вихідний', hours: 0, type: 'weekend', color: '#DC2626' },
          'Л': { label: 'Лікарняний', hours: 0, type: 'sick', color: '#F59E0B' },
          'ВП': { label: 'Відпустка', hours: 0, type: 'vacation', color: '#8B5CF6' },
          'ВК': { label: 'Відрядження', hours: 8, type: 'business_trip', color: '#EF4444' },
          'НН': { label: 'Неявка з невідомих причин', hours: 0, type: 'absence', color: '#6B7280' },
          'ДВ': { label: 'Додаткові вихідні', hours: 0, type: 'extra_weekend', color: '#DC2626' }
        },
        workSchedules: {
          'standard': { name: 'Стандартний графік', dailyHours: 8, weeklyHours: 40 },
          'part_time': { name: 'Неповний робочий день', dailyHours: 4, weeklyHours: 20 },
          'shift': { name: 'Змінний графік', dailyHours: 12, weeklyHours: 36 },
          'flexible': { name: 'Гнучкий графік', dailyHours: 8, weeklyHours: 40 }
        }
      }

      return handleCORS(NextResponse.json(templates))
    }

    // FINANCIAL ACCOUNTING MODULE ROUTES

    // CHART OF ACCOUNTS
    
    // Create Account - POST /api/finance/accounts
    if (route === '/finance/accounts' && method === 'POST') {
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

      const { 
        code, 
        name, 
        type, 
        parentAccountId, 
        level, 
        isActive, 
        currency,
        description 
      } = await request.json()

      if (!code || !name || !type) {
        return handleCORS(NextResponse.json(
          { error: "Код, назва та тип рахунку обов'язкові" }, 
          { status: 400 }
        ))
      }

      const account = {
        id: uuidv4(),
        code,
        name,
        type, // asset, liability, equity, revenue, expense
        parentAccountId: parentAccountId || null,
        level: level || 1,
        isActive: isActive !== false,
        currency: currency || 'UAH',
        description: description || '',
        balance: 0,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('chart_of_accounts').insertOne(account)
      return handleCORS(NextResponse.json({ 
        message: "Рахунок створено успішно",
        account
      }))
    }

    // Get Chart of Accounts - GET /api/finance/accounts
    if (route === '/finance/accounts' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const accounts = await db.collection('chart_of_accounts')
        .find({ isActive: true })
        .sort({ code: 1 })
        .toArray()

      return handleCORS(NextResponse.json(accounts))
    }

    // COUNTERPARTIES

    // Create Counterparty - POST /api/finance/counterparties
    if (route === '/finance/counterparties' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { 
        name, 
        type, 
        taxId, 
        address, 
        phone, 
        email, 
        bankAccount,
        contactPerson,
        isCustomer,
        isSupplier,
        creditLimit 
      } = await request.json()

      if (!name || !type) {
        return handleCORS(NextResponse.json(
          { error: "Назва та тип контрагента обов'язкові" }, 
          { status: 400 }
        ))
      }

      const counterparty = {
        id: uuidv4(),
        name,
        type, // individual, company
        taxId: taxId || '',
        address: address || '',
        phone: phone || '',
        email: email || '',
        bankAccount: bankAccount || '',
        contactPerson: contactPerson || '',
        isCustomer: isCustomer || false,
        isSupplier: isSupplier || false,
        creditLimit: creditLimit || 0,
        currentBalance: 0,
        isActive: true,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('counterparties').insertOne(counterparty)
      return handleCORS(NextResponse.json({ 
        message: "Контрагента створено успішно",
        counterparty
      }))
    }

    // Get Counterparties - GET /api/finance/counterparties
    if (route === '/finance/counterparties' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const type = url.searchParams.get('type') // customer, supplier, all
      
      let filter = { isActive: true }
      if (type === 'customer') {
        filter.isCustomer = true
      } else if (type === 'supplier') {
        filter.isSupplier = true
      }

      const counterparties = await db.collection('counterparties')
        .find(filter)
        .sort({ name: 1 })
        .toArray()

      return handleCORS(NextResponse.json(counterparties))
    }

    // JOURNAL ENTRIES (ПРОВОДКИ)

    // Create Journal Entry - POST /api/finance/journal-entries
    if (route === '/finance/journal-entries' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      if (!['admin', 'manager'].includes(decoded.role)) {
        return handleCORS(NextResponse.json(
          { error: "Недостатньо прав для створення проводок" }, 
          { status: 403 }
        ))
      }

      const { 
        date, 
        description, 
        reference, 
        lines,
        documentId,
        documentType 
      } = await request.json()

      if (!date || !lines || !Array.isArray(lines) || lines.length < 2) {
        return handleCORS(NextResponse.json(
          { error: "Дата та мінімум 2 рядки проводки обов'язкові" }, 
          { status: 400 }
        ))
      }

      // Validate debit = credit
      const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
      const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0)

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return handleCORS(NextResponse.json(
          { error: "Сума по дебету повинна дорівнювати сумі по кредиту" }, 
          { status: 400 }
        ))
      }

      const journalEntry = {
        id: uuidv4(),
        number: await getNextJournalNumber(db),
        date: new Date(date),
        description: description || '',
        reference: reference || '',
        lines: lines.map(line => ({
          id: uuidv4(),
          accountId: line.accountId,
          debit: line.debit || 0,
          credit: line.credit || 0,
          description: line.description || '',
          counterpartyId: line.counterpartyId || null,
          costCenter: line.costCenter || null,
          project: line.project || null
        })),
        documentId: documentId || null,
        documentType: documentType || null,
        totalAmount: totalDebit,
        status: 'posted', // draft, posted, reversed
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('journal_entries').insertOne(journalEntry)
      
      // Update account balances
      await updateAccountBalances(db, journalEntry.lines)

      return handleCORS(NextResponse.json({ 
        message: "Проводку створено успішно",
        journalEntry
      }))
    }

    // Get Journal Entries - GET /api/finance/journal-entries
    if (route === '/finance/journal-entries' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const dateFrom = url.searchParams.get('dateFrom')
      const dateTo = url.searchParams.get('dateTo')
      const accountId = url.searchParams.get('accountId')
      
      let filter = {}
      
      if (dateFrom && dateTo) {
        filter.date = {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo)
        }
      }

      let entries = await db.collection('journal_entries')
        .find(filter)
        .sort({ date: -1, number: -1 })
        .toArray()

      // Filter by account if specified
      if (accountId) {
        entries = entries.filter(entry => 
          entry.lines.some(line => line.accountId === accountId)
        )
      }

      // Get account details for lines
      const accountIds = [...new Set(
        entries.flatMap(entry => entry.lines.map(line => line.accountId))
      )]
      
      const accounts = await db.collection('chart_of_accounts')
        .find({ id: { $in: accountIds } })
        .toArray()
      
      const accountMap = {}
      accounts.forEach(account => {
        accountMap[account.id] = account
      })

      // Enrich entries with account info
      const enrichedEntries = entries.map(entry => ({
        ...entry,
        lines: entry.lines.map(line => ({
          ...line,
          account: accountMap[line.accountId] || null
        }))
      }))

      return handleCORS(NextResponse.json(enrichedEntries))
    }

    // BANK ACCOUNTS

    // Create Bank Account - POST /api/finance/bank-accounts
    if (route === '/finance/bank-accounts' && method === 'POST') {
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

      const { 
        bankName, 
        accountNumber, 
        currency, 
        iban, 
        swift, 
        accountType,
        initialBalance 
      } = await request.json()

      if (!bankName || !accountNumber || !currency) {
        return handleCORS(NextResponse.json(
          { error: "Назва банку, номер рахунку та валюта обов'язкові" }, 
          { status: 400 }
        ))
      }

      const bankAccount = {
        id: uuidv4(),
        bankName,
        accountNumber,
        currency,
        iban: iban || '',
        swift: swift || '',
        accountType: accountType || 'current', // current, savings, credit
        balance: initialBalance || 0,
        isActive: true,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('bank_accounts').insertOne(bankAccount)
      return handleCORS(NextResponse.json({ 
        message: "Банківський рахунок створено успішно",
        bankAccount
      }))
    }

    // Get Bank Accounts - GET /api/finance/bank-accounts
    if (route === '/finance/bank-accounts' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const bankAccounts = await db.collection('bank_accounts')
        .find({ isActive: true })
        .sort({ bankName: 1 })
        .toArray()

      return handleCORS(NextResponse.json(bankAccounts))
    }

    // CRM AND SALES MODULE ROUTES

    // LEADS MANAGEMENT

    // Create Lead - POST /api/crm/leads
    if (route === '/crm/leads' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { 
        title, 
        contactName, 
        company, 
        email, 
        phone, 
        source, 
        expectedValue,
        description,
        assignedTo 
      } = await request.json()

      if (!title || !contactName) {
        return handleCORS(NextResponse.json(
          { error: "Назва та ім'я контакту обов'язкові" }, 
          { status: 400 }
        ))
      }

      const lead = {
        id: uuidv4(),
        title,
        contactName,
        company: company || '',
        email: email || '',
        phone: phone || '',
        source: source || 'website', // website, referral, cold_call, social_media
        expectedValue: expectedValue || 0,
        description: description || '',
        status: 'new', // new, contacted, qualified, proposal, negotiation, won, lost
        assignedTo: assignedTo || decoded.userId,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('leads').insertOne(lead)
      return handleCORS(NextResponse.json({ 
        message: "Лід створено успішно",
        lead
      }))
    }

    // Get Leads - GET /api/crm/leads
    if (route === '/crm/leads' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const status = url.searchParams.get('status')
      const assignedToMe = url.searchParams.get('assignedToMe') === 'true'
      
      let filter = {}
      
      if (status && status !== 'all') {
        filter.status = status
      }
      
      if (assignedToMe) {
        filter.assignedTo = decoded.userId
      }

      const leads = await db.collection('leads')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray()

      return handleCORS(NextResponse.json(leads))
    }

    // Update Lead Status - PUT /api/crm/leads/:id/status
    if (route.match(/^\/crm\/leads\/(.+)\/status$/) && method === 'PUT') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const leadId = route.match(/^\/crm\/leads\/(.+)\/status$/)[1]
      const { status, comment } = await request.json()

      const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
      if (!validStatuses.includes(status)) {
        return handleCORS(NextResponse.json(
          { error: "Невірний статус ліда" }, 
          { status: 400 }
        ))
      }

      await db.collection('leads').updateOne(
        { id: leadId },
        { 
          $set: { 
            status,
            updatedAt: new Date(),
            updatedBy: decoded.userId
          }
        }
      )

      // Log status change
      const activity = {
        id: uuidv4(),
        leadId,
        type: 'status_change',
        description: `Статус змінено на: ${status}`,
        comment: comment || '',
        performedBy: decoded.userId,
        createdAt: new Date()
      }

      await db.collection('lead_activities').insertOne(activity)

      return handleCORS(NextResponse.json({ 
        message: "Статус ліда оновлено"
      }))
    }

    // OPPORTUNITIES (DEALS)

    // Create Opportunity - POST /api/crm/opportunities
    if (route === '/crm/opportunities' && method === 'POST') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const { 
        name, 
        counterpartyId, 
        expectedValue, 
        probability, 
        expectedCloseDate, 
        stage,
        description,
        products 
      } = await request.json()

      if (!name || !counterpartyId || !expectedValue) {
        return handleCORS(NextResponse.json(
          { error: "Назва, контрагент та очікувана сума обов'язкові" }, 
          { status: 400 }
        ))
      }

      const opportunity = {
        id: uuidv4(),
        name,
        counterpartyId,
        expectedValue,
        probability: probability || 50,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        stage: stage || 'prospecting', // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
        description: description || '',
        products: products || [],
        assignedTo: decoded.userId,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('opportunities').insertOne(opportunity)
      return handleCORS(NextResponse.json({ 
        message: "Угоду створено успішно",
        opportunity
      }))
    }

    // Get Opportunities - GET /api/crm/opportunities
    if (route === '/crm/opportunities' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const stage = url.searchParams.get('stage')
      const assignedToMe = url.searchParams.get('assignedToMe') === 'true'
      
      let filter = {}
      
      if (stage && stage !== 'all') {
        filter.stage = stage
      }
      
      if (assignedToMe) {
        filter.assignedTo = decoded.userId
      }

      const opportunities = await db.collection('opportunities')
        .find(filter)
        .sort({ expectedCloseDate: 1, createdAt: -1 })
        .toArray()

      // Get counterparty details
      const counterpartyIds = opportunities.map(opp => opp.counterpartyId)
      const counterparties = await db.collection('counterparties')
        .find({ id: { $in: counterpartyIds } })
        .toArray()
      
      const counterpartyMap = {}
      counterparties.forEach(cp => {
        counterpartyMap[cp.id] = cp
      })

      // Enrich opportunities with counterparty info
      const enrichedOpportunities = opportunities.map(opp => ({
        ...opp,
        counterparty: counterpartyMap[opp.counterpartyId] || null
      }))

      return handleCORS(NextResponse.json(enrichedOpportunities))
    }

    // PRODUCTS AND PRICING

    // Create Product - POST /api/crm/products
    if (route === '/crm/products' && method === 'POST') {
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

      const { 
        name, 
        sku, 
        category, 
        basePrice, 
        cost, 
        unit, 
        description,
        isActive 
      } = await request.json()

      if (!name || !sku || !basePrice) {
        return handleCORS(NextResponse.json(
          { error: "Назва, артикул та базова ціна обов'язкові" }, 
          { status: 400 }
        ))
      }

      const product = {
        id: uuidv4(),
        name,
        sku,
        category: category || 'general',
        basePrice,
        cost: cost || 0,
        unit: unit || 'шт',
        description: description || '',
        isActive: isActive !== false,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('products').insertOne(product)
      return handleCORS(NextResponse.json({ 
        message: "Товар створено успішно",
        product
      }))
    }

    // Get Products - GET /api/crm/products
    if (route === '/crm/products' && method === 'GET') {
      const decoded = verifyToken(request)
      if (!decoded) {
        return handleCORS(NextResponse.json(
          { error: "Авторизація потрібна" }, 
          { status: 401 }
        ))
      }

      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      
      let filter = { isActive: true }
      
      if (category && category !== 'all') {
        filter.category = category
      }

      const products = await db.collection('products')
        .find(filter)
        .sort({ name: 1 })
        .toArray()

      return handleCORS(NextResponse.json(products))
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