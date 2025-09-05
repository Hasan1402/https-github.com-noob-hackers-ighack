'use client'

import { useState, useEffect } from 'react'
import LoginForm from '../components/SSO/LoginForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  BarChart3, 
  Shield, 
  Home,
  Upload,
  Download,
  Search,
  Bell,
  LogOut,
  User,
  Lock,
  BookOpen,
  CreditCard,
  Calculator,
  Target,
  TrendingUp,
  Package,
  Truck,
  Factory,
  ShoppingCart,
  Warehouse,
  Briefcase,
  Building
} from 'lucide-react'
import { toast } from 'sonner'

export default function App() {
  const [currentView, setCurrentView] = useState('auth')
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    fullName: '',
    role: 'user' 
  })
  const [documents, setDocuments] = useState([])
  const [users, setUsers] = useState([])
  const [documentFilter, setDocumentFilter] = useState('all')
  const [isUploading, setIsUploading] = useState(false)
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [analytics, setAnalytics] = useState(null)
  const [documentStats, setDocumentStats] = useState(null)
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [timesheetEntries, setTimesheetEntries] = useState([])
  const [businessTrips, setBusinessTrips] = useState([])
  const [monthlyTimesheet, setMonthlyTimesheet] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)) // YYYY-MM
  const [workCodes, setWorkCodes] = useState({})
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/sso/auth')
      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        setCurrentView('dashboard')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLoginSuccess = (userData, tenantData) => {
    setUser(userData)
    setTenant(tenantData)
    setCurrentView('dashboard')
    toast.success(`Ласкаво просимо, ${userData.fullName}!`)
  }

  // Load data when user changes or view changes
  useEffect(() => {
    if (user) {
      if (currentView === 'documents') {
        loadDocuments()
        loadUsers()
      } else if (currentView === 'calendar') {
        loadEvents()
        loadTasks()
        loadNotifications()
      } else if (currentView === 'analytics') {
        loadAnalytics()
        loadDocumentStats()
      } else if (currentView === 'hr') {
        loadEmployees()
        loadDepartments()
        loadTimesheetEntries()
        loadBusinessTrips()
      } else if (currentView === 'timesheet') {
        loadMonthlyTimesheet()
        loadWorkCodes()
        loadDepartments()
      }
    }
  }, [user, currentView, documentFilter, selectedMonth, selectedDepartment])

  // Load monthly timesheet
  const loadMonthlyTimesheet = async () => {
    try {
      const response = await fetch(`/api/timesheet/monthly?month=${selectedMonth}&department=${selectedDepartment}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setMonthlyTimesheet(data)
      }
    } catch (error) {
      console.error('Error loading monthly timesheet:', error)
    }
  }

  const loadWorkCodes = async () => {
    try {
      const response = await fetch('/api/timesheet/templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setWorkCodes(data.workCodes)
      }
    } catch (error) {
      console.error('Error loading work codes:', error)
    }
  }

  // Update daily timesheet entry
  const handleUpdateDailyEntry = async (employeeId, date, entryData) => {
    try {
      const response = await fetch(`/api/timesheet/daily/${employeeId}/${date}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Запис табеля оновлено!')
        loadMonthlyTimesheet()
      } else {
        toast.error(data.error || 'Помилка оновлення запису')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Load HR data
  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/hr/departments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const loadTimesheetEntries = async () => {
    try {
      const response = await fetch('/api/timesheet/entries', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setTimesheetEntries(data)
      }
    } catch (error) {
      console.error('Error loading timesheet:', error)
    }
  }

  const loadBusinessTrips = async () => {
    try {
      const response = await fetch('/api/hr/business-trips', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setBusinessTrips(data)
      }
    } catch (error) {
      console.error('Error loading business trips:', error)
    }
  }

  // Create employee
  const handleCreateEmployee = async (employeeData) => {
    try {
      const response = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Співробітника додано!')
        loadEmployees()
      } else {
        toast.error(data.error || 'Помилка додавання співробітника')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Create timesheet entry
  const handleCreateTimesheetEntry = async (entryData) => {
    try {
      const response = await fetch('/api/timesheet/entries', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entryData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Запис табеля додано!')
        loadTimesheetEntries()
      } else {
        toast.error(data.error || 'Помилка додавання запису')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Create business trip
  const handleCreateBusinessTrip = async (tripData) => {
    try {
      const response = await fetch('/api/hr/business-trips', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tripData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Заяву на відрядження створено!')
        loadBusinessTrips()
      } else {
        toast.error(data.error || 'Помилка створення заяви')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const loadDocumentStats = async () => {
    if (['admin', 'manager'].includes(user?.role)) {
      try {
        const response = await fetch('/api/analytics/documents', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await response.json()
        if (response.ok) {
          setDocumentStats(data)
        }
      } catch (error) {
        console.error('Error loading document stats:', error)
      }
    }
  }

  // Generate report
  const handleGenerateReport = async (reportData) => {
    try {
      const response = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Звіт згенеровано успішно!')
      } else {
        toast.error(data.error || 'Помилка генерації звіту')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setCurrentView('dashboard')
        toast.success('Успішно увійшли в систему!')
      } else {
        toast.error(data.error || 'Помилка авторизації')
      }
    } catch (error) {
      console.error('Login error:', error)
      // Demo mode fallback - якщо API недоступний
      if (loginForm.email.includes('@tiskis.test') && loginForm.password) {
        const demoUser = {
          id: 'demo-' + loginForm.email.split('@')[0],
          email: loginForm.email,
          fullName: loginForm.email.includes('admin') ? 'Тестовий Адміністратор' :
                   loginForm.email.includes('manager') ? 'Тестовий Менеджер' : 'Тестовий Користувач',
          role: loginForm.email.includes('admin') ? 'admin' :
                loginForm.email.includes('manager') ? 'manager' : 'user'
        }
        localStorage.setItem('token', 'demo-token-' + Date.now())
        setUser(demoUser)
        setCurrentView('dashboard')
        toast.success('Увійшли в DEMO режимі!')
        return
      }
      toast.error('Помилка підключення до сервера. Спробуйте тестові акаунти: admin@tiskis.test')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Паролі не співпадають')
      return
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          fullName: registerForm.fullName,
          role: registerForm.role
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Реєстрація успішна! Тепер увійдіть в систему.')
        setCurrentView('auth')
      } else {
        toast.error(data.error || 'Помилка реєстрації')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Load documents
  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?status=${documentFilter}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  // Load users for assignment
  const loadUsers = async () => {
    if (['admin', 'manager'].includes(user?.role)) {
      try {
        const response = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await response.json()
        if (response.ok) {
          setUsers(data)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
  }

  // Upload document
  const handleDocumentUpload = async (file, title, description) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('description', description)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Документ успішно завантажено!')
        loadDocuments()
      } else {
        toast.error(data.error || 'Помилка завантаження')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    } finally {
      setIsUploading(false)
    }
  }

  // Approve document
  const handleApproveDocument = async (documentId, comment) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/approve`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Документ затверджено!')
        loadDocuments()
      } else {
        toast.error(data.error || 'Помилка затвердження')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Reject document
  const handleRejectDocument = async (documentId, comment) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/reject`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Документ відхилено!')
        loadDocuments()
      } else {
        toast.error(data.error || 'Помилка відхилення')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Send for review
  const handleSendForReview = async (documentId, assignTo, comment) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/send-for-review`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignTo, comment })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Документ відправлено на перевірку!')
        loadDocuments()
      } else {
        toast.error(data.error || 'Помилка відправлення')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/sso/auth', { method: 'DELETE' })
      setUser(null)
      setTenant(null)
      setCurrentView('auth')
      toast.success('Ви успішно вийшли з системи')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Помилка виходу з системи')
    }
  }

  // Load events and tasks for calendar
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setEvents(data)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setTasks(data)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      if (response.ok) {
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  // Create new event
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Подію створено!')
        loadEvents()
      } else {
        toast.error(data.error || 'Помилка створення події')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Create new task
  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Завдання створено!')
        loadTasks()
      } else {
        toast.error(data.error || 'Помилка створення завдання')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Update task status
  const handleUpdateTaskStatus = async (taskId, status, comment) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, comment })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Статус завдання оновлено!')
        loadTasks()
      } else {
        toast.error(data.error || 'Помилка оновлення статусу')
      }
    } catch (error) {
      toast.error('Помилка підключення до сервера')
    }
  }

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900">Нова Пошта ERP</h2>
          <p className="text-gray-600">Завантаження системи...</p>
        </div>
      </div>
    )
  }
  
  // Show login form if not authenticated
  if (currentView === 'auth') {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  // Auth Screen
  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-900">ТИС КІС</CardTitle>
            <CardDescription>Інформаційна система управління</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вхід</TabsTrigger>
                <TabsTrigger value="register">Реєстрація</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Увійти
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Повне ім'я</Label>
                    <Input
                      id="register-name"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Підтвердження пароля</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Зареєструватися
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Documents View
  if (currentView === 'documents') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Документи</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Управління документами</h2>
              
              {/* Status Filter */}
              <div className="flex space-x-2">
                {[
                  { value: 'all', label: 'Всі' },
                  { value: 'draft', label: 'Чернетки' },
                  { value: 'review', label: 'На перевірці' },
                  { value: 'approved', label: 'Затверджені' },
                  { value: 'rejected', label: 'Відхилені' }
                ].map(filter => (
                  <Button
                    key={filter.value}
                    variant={documentFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDocumentFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Upload Document */}
            <DocumentUploadDialog 
              onUpload={handleDocumentUpload}
              isUploading={isUploading}
            />
          </div>

          {/* Documents Table */}
          <Card>
            <CardContent className="p-0">
              <DocumentsTable 
                documents={documents}
                user={user}
                users={users}
                onApprove={handleApproveDocument}
                onReject={handleRejectDocument}
                onSendForReview={handleSendForReview}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Dashboard Screen
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">ТИС КІС</h1>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-lg mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    className="pl-10"
                    placeholder="Швидкий пошук..."
                  />
                </div>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Ласкаво просимо, {user?.fullName}!
            </h2>
            <p className="text-gray-600">
              Комплексна інформаційна система для ефективного управління освітніми процесами
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 mb-8">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('documents')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-blue-100 rounded-lg mb-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Документи</h3>
                  <p className="text-xs text-gray-500">Управління файлами</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('hr')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-green-100 rounded-lg mb-2">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Кадри</h3>
                  <p className="text-xs text-gray-500">HR та персонал</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('timesheet')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-purple-100 rounded-lg mb-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Табелювання</h3>
                  <p className="text-xs text-gray-500">Облік робочого часу</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('finance')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mb-2">
                    <BarChart3 className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Фінанси</h3>
                  <p className="text-xs text-gray-500">Бухгалтерія та облік</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('crm')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-red-100 rounded-lg mb-2">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">CRM</h3>
                  <p className="text-xs text-gray-500">Продажі та клієнти</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('business-trips')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-orange-100 rounded-lg mb-2">
                    <Settings className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Відрядження</h3>
                  <p className="text-xs text-gray-500">Бізнес поїздки</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('calendar')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-indigo-100 rounded-lg mb-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Календар</h3>
                  <p className="text-xs text-gray-500">Події та завдання</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('analytics')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-pink-100 rounded-lg mb-2">
                    <BarChart3 className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Аналітика</h3>
                  <p className="text-xs text-gray-500">Звіти та статистика</p>
                </div>
              </CardContent>
            </Card>

            {/* Management Accounting */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('management-accounting')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-purple-100 rounded-lg mb-2">
                    <Calculator className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Управлін. облік</h3>
                  <p className="text-xs text-gray-500">Внутрішній облік</p>
                </div>
              </CardContent>
            </Card>

            {/* Purchases & Supply */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('purchases')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-teal-100 rounded-lg mb-2">
                    <ShoppingCart className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Закупки</h3>
                  <p className="text-xs text-gray-500">Постачання</p>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse & Logistics */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('warehouse')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-amber-100 rounded-lg mb-2">
                    <Warehouse className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Склад</h3>
                  <p className="text-xs text-gray-500">Логістика</p>
                </div>
              </CardContent>
            </Card>

            {/* Production */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('production')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-slate-100 rounded-lg mb-2">
                    <Factory className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Виробництво</h3>
                  <p className="text-xs text-gray-500">Планування</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentView('projects')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-cyan-100 rounded-lg mb-2">
                    <Briefcase className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">Проекти</h3>
                  <p className="text-xs text-gray-500">Управління</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Останні документи
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-sm">Звіт за грудень</p>
                        <p className="text-xs text-gray-500">2 години тому</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-sm">Навчальний план</p>
                        <p className="text-xs text-gray-500">1 день тому</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Завантажити документ
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Повідомлення
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-400">
                    <p className="font-medium text-sm">Новий документ потребує підпису</p>
                    <p className="text-xs text-gray-600 mt-1">15 хвилин тому</p>
                  </div>

                  <div className="p-3 bg-green-50 border-l-4 border-green-400">
                    <p className="font-medium text-sm">Завдання виконано успішно</p>
                    <p className="text-xs text-gray-600 mt-1">1 година тому</p>
                  </div>

                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="font-medium text-sm">Нагадування про зустріч</p>
                    <p className="text-xs text-gray-600 mt-1">Завтра о 14:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Calendar View
  if (currentView === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Календар і завдання</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Календар подій та завдань</h2>
            
            <div className="flex space-x-2">
              <CreateEventDialog onCreateEvent={handleCreateEvent} users={users} />
              <CreateTaskDialog onCreateTask={handleCreateTask} users={users} />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Календар подій
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CalendarComponent 
                    events={events}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Tasks and Notifications */}
            <div className="space-y-6">
              {/* Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Мої завдання
                    </div>
                    <Badge variant="secondary">
                      {tasks.filter(t => t.status !== 'completed').length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TasksList 
                    tasks={tasks}
                    onUpdateStatus={handleUpdateTaskStatus}
                  />
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Повідомлення
                    </div>
                    <Badge variant="destructive">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationsList notifications={notifications} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Timesheet View
  if (currentView === 'timesheet') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Табель обліку робочого часу</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="month-select">Місяць</Label>
                  <Input
                    id="month-select"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="department-select">Підрозділ</Label>
                  <select
                    id="department-select"
                    className="mt-1 w-48 p-2 border rounded-md"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="all">Всі підрозділи</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={loadMonthlyTimesheet}>
                  <Search className="w-4 h-4 mr-2" />
                  Оновити
                </Button>
                <Button variant="outline">
                  Зберегти зміни
                </Button>
                <Button variant="outline">
                  Експорт
                </Button>
              </div>
            </div>

            {monthlyTimesheet && (
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div>
                  <strong>Період:</strong> {monthlyTimesheet.monthName} {monthlyTimesheet.year}
                </div>
                <div>
                  <strong>Днів у місяці:</strong> {monthlyTimesheet.daysInMonth}
                </div>
                <div>
                  <strong>Співробітників:</strong> {monthlyTimesheet.employees?.length || 0}
                </div>
              </div>
            )}
          </div>

          {/* Work codes legend */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <h3 className="font-medium mb-3">Позначення робочого часу:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(workCodes).map(([code, info]) => (
                <div key={code} className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: info.color }}
                  >
                    {code}
                  </div>
                  <span className="text-sm">{info.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timesheet Table */}
          {monthlyTimesheet ? (
            <TimesheetTable 
              timesheetData={monthlyTimesheet}
              workCodes={workCodes}
              onUpdateEntry={handleUpdateDailyEntry}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Оберіть місяць для перегляду табеля</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Analytics View
  if (currentView === 'analytics') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Аналітика та звіти</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {analytics ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Користувачі</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Документи</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalDocuments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Завдання</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalTasks}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Події</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalEvents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Ефективність роботи</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Документи затверджені</span>
                          <span>{analytics.performance.documentCompletionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${analytics.performance.documentCompletionRate}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Завдання виконані</span>
                          <span>{analytics.performance.taskCompletionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${analytics.performance.taskCompletionRate}%`}}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          Середній час обробки: <strong>{analytics.performance.averageProcessingTime}</strong>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Поточний стан</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {analytics.overview.pendingDocuments}
                        </div>
                        <div className="text-sm text-gray-600">На перевірці</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.overview.completedTasks}
                        </div>
                        <div className="text-sm text-gray-600">Завершені завдання</div>
                      </div>

                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.overview.upcomingEvents}
                        </div>
                        <div className="text-sm text-gray-600">Майбутні події</div>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics.trends.documentsLastWeek}
                        </div>
                        <div className="text-sm text-gray-600">Нових за тиждень</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Нещодавні дії</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.activity.recentActivities.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.activity.recentActivities.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.comment || activity.action}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleString('uk-UA')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Активність відсутня</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {['admin', 'manager'].includes(user?.role) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Генерація звітів</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReportGenerator onGenerateReport={handleGenerateReport} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Завантаження аналітики...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Financial Accounting View
  if (currentView === 'finance') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Фінансовий облік</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Chart of Accounts Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">План рахунків</h3>
                    <p className="text-sm text-gray-500">Система рахунків</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Counterparties Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Контрагенти</h3>
                    <p className="text-sm text-gray-500">Клієнти та постачальники</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Journal Entries Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Проводки</h3>
                    <p className="text-sm text-gray-500">Облікові записи</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Accounts Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Банк. рахунки</h3>
                    <p className="text-sm text-gray-500">Рахунки в банках</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Finance Module Content */}
          <Card>
            <CardHeader>
              <CardTitle>Фінансовий облік - Основні функції</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Фінансовий модуль активний</h3>
                <p className="text-gray-500 mb-6">
                  Backend APIs для фінансового обліку повністю функціональні:<br/>
                  ✅ План рахунків<br/>
                  ✅ Контрагенти<br/>
                  ✅ Журнал проводок<br/>
                  ✅ Банківські рахунки
                </p>
                <p className="text-sm text-gray-400">
                  Детальний UI для роботи з фінансовими даними буде додано в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // CRM View
  if (currentView === 'crm') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">CRM та продажі</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Leads Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Ліди</h3>
                    <p className="text-sm text-gray-500">Потенційні клієнти</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opportunities Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Угоди</h3>
                    <p className="text-sm text-gray-500">Продажні можливості</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Товари</h3>
                    <p className="text-sm text-gray-500">Каталог продукції</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Воронка продажів</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Нові ліди</span>
                    <Badge>5</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">Кваліфікація</span>
                    <Badge>3</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Пропозиція</span>
                    <Badge>2</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Закриті угоди</span>
                    <Badge>1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Аналітика продажів</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Аналітика продажів</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CRM Status */}
          <Card>
            <CardHeader>
              <CardTitle>CRM модуль - Статус системи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">CRM система активна</h3>
                <p className="text-gray-500 mb-6">
                  Backend APIs для CRM повністю функціональні:<br/>
                  ✅ Управління лідами<br/>
                  ✅ Створення угод (виправлено!)<br/>
                  ✅ Каталог товарів (виправлено!)<br/>
                  ✅ Інтеграція з фінансами
                </p>
                <p className="text-sm text-gray-400">
                  Детальний UI для роботи з CRM даними буде додано в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Management Accounting View
  if (currentView === 'management-accounting') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Управлінський облік</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Центри витрат</h3>
                    <p className="text-sm text-gray-500">Управління витратами</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calculator className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Калькуляція</h3>
                    <p className="text-sm text-gray-500">Розрахунок собівартості</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">KPI</h3>
                    <p className="text-sm text-gray-500">Ключові показники</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <FileText className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Бюджетування</h3>
                    <p className="text-sm text-gray-500">Планування витрат</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Управлінський облік - Внутрішній контроль</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Модуль управлінського обліку</h3>
                <p className="text-gray-500 mb-6">
                  Система внутрішнього управління витратами та ефективністю:<br/>
                  📊 Центри витрат та прибутку<br/>
                  💰 Калькуляція собівартості<br/>
                  📈 KPI та метрики ефективності<br/>
                  📋 Бюджетування та планування
                </p>
                <p className="text-sm text-gray-400">
                  Backend API та детальний UI будуть додані в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Purchases & Supply View
  if (currentView === 'purchases') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Закупки та постачання</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Заявки на закупку</h3>
                    <p className="text-sm text-gray-500">Створення запитів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Постачальники</h3>
                    <p className="text-sm text-gray-500">База постачальників</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Договори</h3>
                    <p className="text-sm text-gray-500">Управління договорами</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Аналітика закупок</h3>
                    <p className="text-sm text-gray-500">Статистика та звіти</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Система закупок та постачання</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Модуль закупок</h3>
                <p className="text-gray-500 mb-6">
                  Повний цикл управління закупками:<br/>
                  📋 Заявки та замовлення<br/>
                  🏢 База постачальників<br/>
                  📄 Управління договорами<br/>
                  📊 Аналітика та оптимізація
                </p>
                <p className="text-sm text-gray-400">
                  Backend API та детальний UI будуть додані в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Warehouse & Logistics View
  if (currentView === 'warehouse') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Склад та логістика</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Package className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Товарні залишки</h3>
                    <p className="text-sm text-gray-500">Облік матеріалів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Надходження</h3>
                    <p className="text-sm text-gray-500">Приймання товарів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Download className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Відвантаження</h3>
                    <p className="text-sm text-gray-500">Видача товарів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Інвентаризація</h3>
                    <p className="text-sm text-gray-500">Ревізія залишків</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Складська логістика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Warehouse className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Модуль складу</h3>
                <p className="text-gray-500 mb-6">
                  Комплексне управління складськими процесами:<br/>
                  📦 Товарні залишки та партії<br/>
                  ⬆️ Надходження та приймання<br/>
                  ⬇️ Відвантаження та видача<br/>
                  🔍 Інвентаризація та ревізія
                </p>
                <p className="text-sm text-gray-400">
                  Backend API та детальний UI будуть додані в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Production View
  if (currentView === 'production') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Виробництво</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Планування</h3>
                    <p className="text-sm text-gray-500">Виробничі плани</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Обладнання</h3>
                    <p className="text-sm text-gray-500">Управління машинами</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Матеріали</h3>
                    <p className="text-sm text-gray-500">Сировина та компоненти</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Якість</h3>
                    <p className="text-sm text-gray-500">Контроль якості</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Виробничий модуль</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Factory className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Система виробництва</h3>
                <p className="text-gray-500 mb-6">
                  Управління виробничими процесами:<br/>
                  📋 Планування виробництва<br/>
                  ⚙️ Управління обладнанням<br/>
                  📦 Облік матеріалів<br/>
                  ✅ Контроль якості
                </p>
                <p className="text-sm text-gray-400">
                  Backend API та детальний UI будуть додані в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Project Management View
  if (currentView === 'projects') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Управління проектами</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Briefcase className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Проекти</h3>
                    <p className="text-sm text-gray-500">Управління портфелем</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Задачі</h3>
                    <p className="text-sm text-gray-500">Планування робіт</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Команда</h3>
                    <p className="text-sm text-gray-500">Ресурси проекту</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Прогрес</h3>
                    <p className="text-sm text-gray-500">Моніторинг виконання</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Система управління проектами</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Модуль проектів</h3>
                <p className="text-gray-500 mb-6">
                  Комплексне управління проектами:<br/>
                  💼 Портфель проектів<br/>
                  📋 Планування та задачі<br/>
                  👥 Управління командою<br/>
                  📊 Моніторинг прогресу
                </p>
                <p className="text-sm text-gray-400">
                  Backend API та детальний UI будуть додані в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // HR View
  if (currentView === 'hr') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Кадри та персонал</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Співробітники</h3>
                    <p className="text-sm text-gray-500">База персоналу</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Settings className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Відділи</h3>
                    <p className="text-sm text-gray-500">Структура компанії</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Табель</h3>
                    <p className="text-sm text-gray-500">Облік робочого часу</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Відрядження</h3>
                    <p className="text-sm text-gray-500">Бізнес поїздки</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>HR модуль - Управління персоналом</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Система управління кадрами</h3>
                <p className="text-gray-500 mb-6">
                  Backend APIs для HR повністю функціональні:<br/>
                  👥 Управління співробітниками<br/>
                  🏢 Структура відділів<br/>
                  ⏰ Табель обліку робочого часу<br/>
                  ✈️ Управління відрядженнями
                </p>
                <p className="text-sm text-gray-400">
                  Детальний UI для роботи з HR даними буде додано в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Business Trips View
  if (currentView === 'business-trips') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Головна
                </Button>
                <h1 className="text-xl font-bold text-gray-900">Відрядження</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.fullName}</div>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role === 'admin' ? 'Адміністратор' : 
                       user?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                    </Badge>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Заявки</h3>
                    <p className="text-sm text-gray-500">Нові відрядження</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Планування</h3>
                    <p className="text-sm text-gray-500">Календар поїздок</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Звіти</h3>
                    <p className="text-sm text-gray-500">Звіти по поїздках</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900">Витрати</h3>
                    <p className="text-sm text-gray-500">Облік витрат</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Система відряджень</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Модуль відряджень</h3>
                <p className="text-gray-500 mb-6">
                  Backend API для відряджень повністю функціональний:<br/>
                  ✈️ Заявки на відрядження<br/>
                  📅 Планування поїздок<br/>
                  📊 Звіти та статистика<br/>
                  💰 Облік витрат
                </p>
                <p className="text-sm text-gray-400">
                  Детальний UI для роботи з відрядженнями буде додано в наступних ітераціях
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

// Document Upload Dialog Component
function DocumentUploadDialog({ onUpload, isUploading }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile || !title) {
      toast.error('Будь ласка, виберіть файл та введіть назву')
      return
    }

    await onUpload(selectedFile, title, description)
    
    // Reset form
    setTitle('')
    setDescription('')
    setSelectedFile(null)
    setIsOpen(false)
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    if (!title) {
      setTitle(file.name.split('.')[0])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} disabled={isUploading}>
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? 'Завантаження...' : 'Завантажити документ'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Завантажити документ</CardTitle>
              <CardDescription>
                Виберіть файл та заповніть інформацію про документ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* File Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                    ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
                    ${selectedFile ? 'border-green-400 bg-green-50' : ''}
                  `}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {selectedFile ? (
                    <div>
                      <FileText className="w-12 h-12 mx-auto text-green-600 mb-2" />
                      <p className="font-medium text-green-800">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">
                        Перетягніть файл сюди або
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => document.getElementById('file-input').click()}
                      >
                        Виберіть файл
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) handleFileSelect(file)
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Title Input */}
                <div>
                  <Label htmlFor="title">Назва документа *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введіть назву документа"
                    required
                  />
                </div>

                {/* Description Input */}
                <div>
                  <Label htmlFor="description">Опис (необов'язково)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Короткий опис документа"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!selectedFile || !title || isUploading}
                    className="flex-1"
                  >
                    {isUploading ? 'Завантаження...' : 'Завантажити'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Documents Table Component
function DocumentsTable({ documents, user, users, onApprove, onReject, onSendForReview }) {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [actionComment, setActionComment] = useState('')
  const [assignUser, setAssignUser] = useState('')

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Чернетка', variant: 'secondary' },
      review: { label: 'На перевірці', variant: 'default' },
      approved: { label: 'Затверджено', variant: 'default' },
      rejected: { label: 'Відхилено', variant: 'destructive' }
    }
    
    const config = statusMap[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const canApprove = (doc) => {
    return ['admin', 'manager'].includes(user?.role) && doc.status === 'review'
  }

  const canSendForReview = (doc) => {
    return doc.createdBy === user?.id && doc.status === 'draft'
  }

  const handleAction = async (action, docId) => {
    if (action === 'approve') {
      await onApprove(docId, actionComment)
    } else if (action === 'reject') {
      await onReject(docId, actionComment)
    } else if (action === 'send_review') {
      await onSendForReview(docId, assignUser, actionComment)
    }
    
    setSelectedDoc(null)
    setActionComment('')
    setAssignUser('')
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Документи відсутні
        </h3>
        <p className="text-gray-500">
          Завантажте перший документ для початку роботи
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Документ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Автор
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дії
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {doc.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.filename} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(doc.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {doc.createdByUser?.fullName || 'Невідомий користувач'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {doc.createdByUser?.role === 'admin' ? 'Адміністратор' : 
                     doc.createdByUser?.role === 'manager' ? 'Менеджер' : 'Користувач'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(doc.createdAt).toLocaleDateString('uk-UA')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {canApprove(doc) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => setSelectedDoc({ ...doc, action: 'approve' })}
                      >
                        Затвердити
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setSelectedDoc({ ...doc, action: 'reject' })}
                      >
                        Відхилити
                      </Button>
                    </>
                  )}
                  
                  {canSendForReview(doc) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDoc({ ...doc, action: 'send_review' })}
                    >
                      Відправити на перевірку
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Dialog */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>
                {selectedDoc.action === 'approve' && 'Затвердити документ'}
                {selectedDoc.action === 'reject' && 'Відхилити документ'}
                {selectedDoc.action === 'send_review' && 'Відправити на перевірку'}
              </CardTitle>
              <CardDescription>
                {selectedDoc.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDoc.action === 'send_review' && (
                  <div>
                    <Label htmlFor="assign-user">Призначити для перевірки</Label>
                    <select
                      id="assign-user"
                      className="w-full p-2 border rounded-md"
                      value={assignUser}
                      onChange={(e) => setAssignUser(e.target.value)}
                    >
                      <option value="">Оберіть користувача</option>
                      {users
                        .filter(u => ['admin', 'manager'].includes(u.role))
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.role === 'admin' ? 'Адміністратор' : 'Менеджер'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="comment">Коментар</Label>
                  <Input
                    id="comment"
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder="Додатковий коментар (необов'язково)"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedDoc(null)}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                  <Button 
                    onClick={() => handleAction(selectedDoc.action, selectedDoc.id)}
                    className="flex-1"
                  >
                    Підтвердити
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Create Event Dialog Component
function CreateEventDialog({ onCreateEvent, users }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState('meeting')
  const [location, setLocation] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !startDate) {
      toast.error('Назва та дата початку обов\'язкові')
      return
    }

    await onCreateEvent({
      title,
      description,
      startDate,
      endDate: endDate || startDate,
      type,
      location
    })
    
    // Reset form
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setType('meeting')
    setLocation('')
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Calendar className="w-4 h-4 mr-2" />
        Додати подію
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Створити подію</CardTitle>
              <CardDescription>
                Додайте нову подію до календаря
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="event-title">Назва події *</Label>
                  <Input
                    id="event-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Назва події"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="event-description">Опис</Label>
                  <Input
                    id="event-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опис події"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Дата початку *</Label>
                    <Input
                      id="start-date"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Дата кінця</Label>
                    <Input
                      id="end-date"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-type">Тип події</Label>
                  <select
                    id="event-type"
                    className="w-full p-2 border rounded-md"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="meeting">Зустріч</option>
                    <option value="deadline">Дедлайн</option>
                    <option value="reminder">Нагадування</option>
                    <option value="holiday">Свято</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="event-location">Місце проведення</Label>
                  <Input
                    id="event-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Місце проведення"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1"
                  >
                    Створити подію
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Create Task Dialog Component
function CreateTaskDialog({ onCreateTask, users }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [category, setCategory] = useState('general')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title) {
      toast.error('Назва завдання обов\'язкова')
      return
    }

    await onCreateTask({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      category
    })
    
    // Reset form
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('medium')
    setAssignedTo('')
    setCategory('general')
    setIsOpen(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <FileText className="w-4 h-4 mr-2" />
        Додати завдання
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Створити завдання</CardTitle>
              <CardDescription>
                Додайте нове завдання та призначте відповідального
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="task-title">Назва завдання *</Label>
                  <Input
                    id="task-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Назва завдання"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="task-description">Опис</Label>
                  <Input
                    id="task-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опис завдання"
                  />
                </div>

                <div>
                  <Label htmlFor="due-date">Дедлайн</Label>
                  <Input
                    id="due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-priority">Пріоритет</Label>
                    <select
                      id="task-priority"
                      className="w-full p-2 border rounded-md"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="low">Низький</option>
                      <option value="medium">Середній</option>
                      <option value="high">Високий</option>
                      <option value="urgent">Терміновий</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="task-category">Категорія</Label>
                    <select
                      id="task-category"
                      className="w-full p-2 border rounded-md"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="general">Загальне</option>
                      <option value="documents">Документи</option>
                      <option value="meeting">Зустрічі</option>
                      <option value="review">Перевірка</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="assigned-to">Призначити користувачу</Label>
                  <select
                    id="assigned-to"
                    className="w-full p-2 border rounded-md"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Призначити собі</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1"
                  >
                    Створити завдання
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Simple Calendar Component
function CalendarComponent({ events, selectedDate, onDateSelect }) {
  const today = new Date()
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ]

  const getDayEvents = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => onDateSelect(new Date(year, month - 1, 1))}
        >
          ←
        </Button>
        <h3 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h3>
        <Button
          variant="outline"
          onClick={() => onDateSelect(new Date(year, month + 1, 1))}
        >
          →
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString()
          const isCurrentMonth = date.getMonth() === month
          const dayEvents = getDayEvents(date)

          return (
            <div
              key={index}
              onClick={() => onDateSelect(date)}
              className={`p-2 min-h-[80px] border cursor-pointer transition-colors ${
                isToday ? 'bg-blue-100 border-blue-300' : 
                isCurrentMonth ? 'bg-white hover:bg-gray-50' : 
                'bg-gray-50 text-gray-400'
              }`}
            >
              <div className={`text-sm ${isToday ? 'font-bold text-blue-900' : ''}`}>
                {date.getDate()}
              </div>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 mt-1 bg-blue-500 text-white rounded truncate"
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Tasks List Component
function TasksList({ tasks, onUpdateStatus }) {
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-blue-500', 
      high: 'text-orange-500',
      urgent: 'text-red-500'
    }
    return colors[priority] || 'text-gray-500'
  }

  const getStatusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800', 
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      todo: 'До виконання',
      in_progress: 'В роботі',
      review: 'На перевірці',
      completed: 'Завершено',
      cancelled: 'Скасовано'
    }
    return texts[status] || status
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Завдань немає</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.slice(0, 5).map(task => (
        <div key={task.id} className="p-3 border rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{task.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
            </div>
            <Badge className={getStatusColor(task.status)}>
              {getStatusText(task.status)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className={getPriorityColor(task.priority)}>
              {task.priority === 'low' && 'Низький'}
              {task.priority === 'medium' && 'Середній'}
              {task.priority === 'high' && 'Високий'}
              {task.priority === 'urgent' && 'Терміновий'}
            </span>
            
            {task.dueDate && (
              <span>
                до {new Date(task.dueDate).toLocaleDateString('uk-UA')}
              </span>
            )}
          </div>

          {task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="flex gap-1 mt-2">
              {task.status === 'todo' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateStatus(task.id, 'in_progress', 'Взято в роботу')}
                  className="text-xs"
                >
                  Почати
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onUpdateStatus(task.id, 'completed', 'Завдання завершено')}
                  className="text-xs"
                >
                  Завершити
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      
      {tasks.length > 5 && (
        <p className="text-center text-sm text-gray-500">
          ... та ще {tasks.length - 5} завдань
        </p>
      )}
    </div>
  )
}

// Notifications List Component
function NotificationsList({ notifications }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Повідомлень немає</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.slice(0, 5).map(notification => (
        <div 
          key={notification.id} 
          className={`p-3 border-l-4 rounded-r ${
            notification.read ? 'border-gray-300 bg-gray-50' : 'border-blue-400 bg-blue-50'
          }`}
        >
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.createdAt).toLocaleDateString('uk-UA')}
          </p>
        </div>
      ))}
      
      {notifications.length > 5 && (
        <p className="text-center text-sm text-gray-500">
          ... та ще {notifications.length - 5} повідомлень
        </p>
      )}
    </div>
  )
}

// Report Generator Component
function ReportGenerator({ onGenerateReport }) {
  const [reportType, setReportType] = useState('documents')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!dateFrom || !dateTo) {
      toast.error('Будь ласка, оберіть діапазон дат')
      return
    }

    onGenerateReport({
      reportType,
      dateFrom,
      dateTo,
      filters: {}
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="report-type">Тип звіту</Label>
        <select
          id="report-type"
          className="w-full p-2 border rounded-md"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="documents">Документи</option>
          <option value="tasks">Завдання</option>
          <option value="users">Користувачі</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date-from">Дата від</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="date-to">Дата до</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        <BarChart3 className="w-4 h-4 mr-2" />
        Згенерувати звіт
      </Button>
    </form>
  )
}

// Timesheet Table Component
function TimesheetTable({ timesheetData, workCodes, onUpdateEntry }) {
  const [editingCell, setEditingCell] = useState(null) // {employeeId, day}
  const [editValue, setEditValue] = useState('')

  const handleCellClick = (employeeId, day, currentValue) => {
    setEditingCell({ employeeId, day })
    setEditValue(currentValue || '8')
  }

  const handleCellSubmit = async (employeeId, dayData) => {
    if (!editingCell) return

    const workCode = workCodes[editValue] || workCodes['8']
    const date = `${timesheetData.year}-${String(timesheetData.monthNum).padStart(2, '0')}-${String(dayData.day).padStart(2, '0')}`
    
    const entryData = {
      hours: workCode.hours,
      overtime: 0,
      dayType: workCode.type,
      status: workCode.type,
      comments: `${editValue} - ${workCode.label}`
    }

    await onUpdateEntry(employeeId, date, entryData)
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyPress = (e, employeeId, dayData) => {
    if (e.key === 'Enter') {
      handleCellSubmit(employeeId, dayData)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  const getDisplayValue = (dayData) => {
    if (dayData.dayType === 'weekend') return 'В'
    if (dayData.dayType === 'sick') return 'Л'
    if (dayData.dayType === 'vacation') return 'ВП'
    if (dayData.dayType === 'business_trip') return 'ВК'
    if (dayData.dayType === 'night') return 'НТ'
    if (dayData.hours === 0) return 'НН'
    return dayData.hours.toString()
  }

  const getCellColor = (dayData) => {
    if (dayData.dayType === 'weekend') return 'bg-red-100 text-red-800'
    if (dayData.dayType === 'sick') return 'bg-yellow-100 text-yellow-800'
    if (dayData.dayType === 'vacation') return 'bg-purple-100 text-purple-800'
    if (dayData.dayType === 'business_trip') return 'bg-blue-100 text-blue-800'
    if (dayData.dayType === 'night') return 'bg-indigo-100 text-indigo-800'
    if (dayData.hours === 0) return 'bg-gray-100 text-gray-500'
    if (dayData.hours === 8) return 'bg-green-100 text-green-800'
    return 'bg-orange-100 text-orange-800'
  }

  const getDayOfWeekName = (dayOfWeek) => {
    const days = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    return days[dayOfWeek]
  }

  if (!timesheetData?.employees) {
    return <div>Немає даних для відображення</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Header with calendar */}
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                № п/п
              </th>
              <th className="sticky left-16 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-[200px]">
                Співробітник
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                Посада
              </th>
              
              {/* Calendar header */}
              {Array.from({ length: timesheetData.daysInMonth }, (_, i) => {
                const day = i + 1
                const date = new Date(timesheetData.year, timesheetData.monthNum - 1, day)
                const dayOfWeek = date.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                
                return (
                  <th key={day} className={`px-1 py-3 text-center text-xs font-medium uppercase tracking-wider border-r ${isWeekend ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>
                    <div className="flex flex-col">
                      <span>{day}</span>
                      <span className="text-xs">{getDayOfWeekName(dayOfWeek)}</span>
                    </div>
                  </th>
                )
              })}
              
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Всього годин
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Робочих днів
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ефективність
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {timesheetData.employees.map((employeeData, index) => (
              <tr key={employeeData.employee.id} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-4 py-4 text-sm text-gray-900 border-r">
                  {index + 1}
                </td>
                <td className="sticky left-16 bg-white px-4 py-4 border-r min-w-[200px]">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {employeeData.employee.fullName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {employeeData.employee.employeeId}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 border-r">
                  {employeeData.employee.position}
                </td>
                
                {/* Daily entries */}
                {employeeData.dailyEntries.map((dayData) => {
                  const isEditing = editingCell?.employeeId === employeeData.employee.id && editingCell?.day === dayData.day
                  
                  return (
                    <td 
                      key={dayData.day} 
                      className={`px-1 py-2 text-center text-sm border-r cursor-pointer ${getCellColor(dayData)}`}
                      onClick={() => handleCellClick(employeeData.employee.id, dayData.day, getDisplayValue(dayData))}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSubmit(employeeData.employee.id, dayData)}
                          onKeyPress={(e) => handleKeyPress(e, employeeData.employee.id, dayData)}
                          className="w-8 h-6 text-center text-xs border rounded"
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold">
                          {getDisplayValue(dayData)}
                        </span>
                      )}
                    </td>
                  )
                })}
                
                {/* Summary columns */}
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {employeeData.summary.totalWorkHours}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {employeeData.summary.workDays}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {employeeData.summary.efficiency}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Всього співробітників:</span> {timesheetData.employees.length}
          </div>
          <div>
            <span className="font-medium">Всього годин:</span> {' '}
            {timesheetData.employees.reduce((sum, emp) => sum + emp.summary.totalWorkHours, 0)}
          </div>
          <div>
            <span className="font-medium">Середня ефективність:</span> {' '}
            {timesheetData.employees.length > 0 
              ? (timesheetData.employees.reduce((sum, emp) => sum + parseFloat(emp.summary.efficiency), 0) / timesheetData.employees.length).toFixed(1)
              : 0
            }%
          </div>
          <div>
            <span className="font-medium">Робочих днів у місяці:</span> {' '}
            {timesheetData.employees.length > 0 
              ? Math.max(...timesheetData.employees.map(emp => emp.summary.workDays))
              : 0
            }
          </div>
        </div>
      </div>
    </div>
  )
}
}