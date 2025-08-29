'use client'

import { useState, useEffect } from 'react'
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
  Lock
} from 'lucide-react'
import { toast } from 'sonner'

export default function App() {
  const [currentView, setCurrentView] = useState('auth')
  const [user, setUser] = useState(null)
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

  // Check if user is logged in on load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with backend
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setCurrentView('dashboard')
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
    }
  }, [])

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
      toast.error('Помилка підключення до сервера')
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentView('auth')
    toast.success('Ви вийшли з системи')
  }

  // Load data when user changes or view changes to documents
  useEffect(() => {
    if (user && currentView === 'documents') {
      loadDocuments()
      loadUsers()
    }
  }, [user, currentView, documentFilter])

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

  // Dashboard Screen
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setCurrentView('documents')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Документи</h3>
                  <p className="text-sm text-gray-500">Управління файлами</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setCurrentView('users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Користувачі</h3>
                  <p className="text-sm text-gray-500">Керування профілями</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setCurrentView('calendar')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Календар</h3>
                  <p className="text-sm text-gray-500">Події та завдання</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setCurrentView('analytics')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Аналітика</h3>
                  <p className="text-sm text-gray-500">Звіти та статистика</p>
                </div>
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

  // Placeholder for other views
  if (['users', 'calendar', 'analytics'].includes(currentView)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">
              {currentView === 'users' && 'Користувачі'}
              {currentView === 'calendar' && 'Календар'}
              {currentView === 'analytics' && 'Аналітика'}
            </h2>
            <p className="text-gray-600 mb-6">
              Цей розділ буде доступний в наступній версії
            </p>
            <Button onClick={() => setCurrentView('dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Повернутися на головну
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
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