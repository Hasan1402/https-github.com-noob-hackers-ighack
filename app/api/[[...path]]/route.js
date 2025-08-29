import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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