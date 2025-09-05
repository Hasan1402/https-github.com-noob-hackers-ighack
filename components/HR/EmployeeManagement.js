'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Briefcase,
  Upload,
  Download,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

export default function EmployeeManagement({ user }) {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterAccessLevel, setFilterAccessLevel] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  
  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    accessLevel: 'basic',
    roles: ['employee'],
    employeeId: '',
    workLocation: '',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: ''
    },
    personalInfo: {
      passportNumber: '',
      birthDate: '',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    },
    documents: []
  })

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sso/hr?action=employees')
      if (response.ok) {
        const result = await response.json()
        setEmployees(result.data.employees || [])
      } else {
        toast.error('Помилка завантаження співробітників')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Помилка з\'єднання з сервером')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/sso/hr?action=departments')
      if (response.ok) {
        const result = await response.json()
        setDepartments(result.data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      const response = await fetch('/api/sso/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          employeeData: employeeForm
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Співробітника створено успішно')
        setShowAddDialog(false)
        resetEmployeeForm()
        fetchEmployees()
        
        // Show temporary password if provided
        if (result.data.tempPassword) {
          toast.info(`Тимчасовий пароль: ${result.data.tempPassword}`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Помилка створення співробітника')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      toast.error('Помилка створення співробітника')
    }
  }

  const handleUpdateEmployee = async () => {
    try {
      const response = await fetch('/api/sso/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          employeeData: { id: editingEmployee._id, ...employeeForm }
        })
      })

      if (response.ok) {
        toast.success('Співробітника оновлено успішно')
        setShowEditDialog(false)
        setEditingEmployee(null)
        resetEmployeeForm()
        fetchEmployees()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Помилка оновлення співробітника')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error('Помилка оновлення співробітника')
    }
  }

  const handleDeactivateEmployee = async (employeeId) => {
    try {
      const response = await fetch('/api/sso/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          employeeData: { id: employeeId }
        })
      })

      if (response.ok) {
        toast.success('Співробітника деактивовано')
        fetchEmployees()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Помилка деактивації співробітника')
      }
    } catch (error) {
      console.error('Error deactivating employee:', error)
      toast.error('Помилка деактивації співробітника')
    }
  }

  const resetEmployeeForm = () => {
    setEmployeeForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      accessLevel: 'basic',
      roles: ['employee'],
      employeeId: '',
      workLocation: '',
      address: {
        street: '',
        city: '',
        region: '',
        postalCode: ''
      },
      personalInfo: {
        passportNumber: '',
        birthDate: '',
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        }
      },
      documents: []
    })
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee)
    setEmployeeForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      accessLevel: employee.accessLevel || 'basic',
      roles: employee.roles || ['employee'],
      employeeId: employee.employeeId || '',
      workLocation: employee.workLocation || '',
      address: employee.address || {
        street: '',
        city: '',
        region: '',
        postalCode: ''
      },
      personalInfo: employee.personalInfo || {
        passportNumber: '',
        birthDate: '',
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        }
      },
      documents: employee.documents || []
    })
    setShowEditDialog(true)
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !filterDepartment || employee.department === filterDepartment
    const matchesAccessLevel = !filterAccessLevel || employee.accessLevel === filterAccessLevel
    
    return matchesSearch && matchesDepartment && matchesAccessLevel
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управління співробітниками</h2>
          <p className="text-gray-600">Особові картки та дані персоналу</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Додати співробітника
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новий співробітник</DialogTitle>
            </DialogHeader>
            
            <EmployeeForm
              form={employeeForm}
              setForm={setEmployeeForm}
              departments={departments}
              onSubmit={handleCreateEmployee}
              onCancel={() => {
                setShowAddDialog(false)
                resetEmployeeForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Пошук співробітників..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Відділ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі відділи</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterAccessLevel} onValueChange={setFilterAccessLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Рівень доступу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі рівні</SelectItem>
                <SelectItem value="basic">Базовий</SelectItem>
                <SelectItem value="warehouse">Склад</SelectItem>
                <SelectItem value="branch">Відділення</SelectItem>
                <SelectItem value="regional">Регіональний</SelectItem>
                <SelectItem value="admin">Адміністратор</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredEmployees.map(employee => (
            <EmployeeCard
              key={employee._id}
              employee={employee}
              onEdit={handleEditEmployee}
              onDeactivate={handleDeactivateEmployee}
              onViewDetails={setSelectedEmployee}
              currentUser={user}
            />
          ))
        )}
      </div>

      {!isLoading && filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Співробітників не знайдено</h3>
          <p className="text-gray-600">Спробуйте змінити критерії пошуку або додайте нового співробітника</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагування співробітника</DialogTitle>
          </DialogHeader>
          
          <EmployeeForm
            form={employeeForm}
            setForm={setEmployeeForm}
            departments={departments}
            onSubmit={handleUpdateEmployee}
            onCancel={() => {
              setShowEditDialog(false)
              setEditingEmployee(null)
              resetEmployeeForm()
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Деталі співробітника</DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <EmployeeDetails employee={selectedEmployee} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Employee Card Component
function EmployeeCard({ employee, onEdit, onDeactivate, onViewDetails, currentUser }) {
  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'regional': return 'bg-purple-100 text-purple-800'
      case 'warehouse': return 'bg-blue-100 text-blue-800'
      case 'branch': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessLevelText = (level) => {
    switch (level) {
      case 'admin': return 'Адміністратор'
      case 'regional': return 'Регіональний'
      case 'warehouse': return 'Складський'
      case 'branch': return 'Відділення'
      default: return 'Базовий'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-medium text-gray-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-sm text-gray-600">{employee.position}</p>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(employee)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Деактивація співробітника</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ви впевнені, що хочете деактивувати {employee.firstName} {employee.lastName}?
                      Цю дію можна скасувати пізніше.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDeactivate(employee._id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Деактивувати
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        
        <div className="space-y-2" onClick={() => onViewDetails(employee)}>
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            {employee.email}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Briefcase className="w-4 h-4 mr-2" />
            {employee.department || 'Не вказано'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {employee.workLocation || 'Не вказано'}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <Badge className={getAccessLevelColor(employee.accessLevel)}>
              {getAccessLevelText(employee.accessLevel)}
            </Badge>
            
            {employee.employeeId && (
              <span className="text-sm text-gray-500">ID: {employee.employeeId}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Employee Form Component
function EmployeeForm({ form, setForm, departments, onSubmit, onCancel, isEdit = false }) {
  const updateForm = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: value
          } : value
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Основні дані</TabsTrigger>
        <TabsTrigger value="contact">Контакти</TabsTrigger>
        <TabsTrigger value="work">Робота</TabsTrigger>
        <TabsTrigger value="personal">Особисті дані</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Ім'я *</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => updateForm('firstName', e.target.value)}
              placeholder="Іван"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Прізвище *</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => updateForm('lastName', e.target.value)}
              placeholder="Петренко"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="ivan.petrenko@novaposhta.ua"
          />
        </div>
        
        <div>
          <Label htmlFor="employeeId">ID співробітника</Label>
          <Input
            id="employeeId"
            value={form.employeeId}
            onChange={(e) => updateForm('employeeId', e.target.value)}
            placeholder="NP-EMP-001"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="contact" className="space-y-4">
        <div>
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            placeholder="+380501234567"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="street">Вулиця</Label>
            <Input
              id="street"
              value={form.address.street}
              onChange={(e) => updateForm('address.street', e.target.value)}
              placeholder="вул. Хрещатик, 1"
            />
          </div>
          <div>
            <Label htmlFor="city">Місто</Label>
            <Input
              id="city"
              value={form.address.city}
              onChange={(e) => updateForm('address.city', e.target.value)}
              placeholder="Київ"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="region">Область</Label>
            <Input
              id="region"
              value={form.address.region}
              onChange={(e) => updateForm('address.region', e.target.value)}
              placeholder="Київська область"
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Поштовий індекс</Label>
            <Input
              id="postalCode"
              value={form.address.postalCode}
              onChange={(e) => updateForm('address.postalCode', e.target.value)}
              placeholder="01001"
            />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="work" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="department">Відділ</Label>
            <Select 
              value={form.department} 
              onValueChange={(value) => updateForm('department', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Виберіть відділ" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="position">Посада</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => updateForm('position', e.target.value)}
              placeholder="Менеджер"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accessLevel">Рівень доступу</Label>
            <Select 
              value={form.accessLevel} 
              onValueChange={(value) => updateForm('accessLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Базовий</SelectItem>
                <SelectItem value="warehouse">Складський</SelectItem>
                <SelectItem value="branch">Відділення</SelectItem>
                <SelectItem value="regional">Регіональний</SelectItem>
                <SelectItem value="admin">Адміністратор</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="workLocation">Місце роботи</Label>
            <Input
              id="workLocation"
              value={form.workLocation}
              onChange={(e) => updateForm('workLocation', e.target.value)}
              placeholder="Головний офіс"
            />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="personal" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="passportNumber">Номер паспорта</Label>
            <Input
              id="passportNumber"
              value={form.personalInfo.passportNumber}
              onChange={(e) => updateForm('personalInfo.passportNumber', e.target.value)}
              placeholder="AA123456"
            />
          </div>
          <div>
            <Label htmlFor="birthDate">Дата народження</Label>
            <Input
              id="birthDate"
              type="date"
              value={form.personalInfo.birthDate}
              onChange={(e) => updateForm('personalInfo.birthDate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Контактна особа у надзвичайних ситуаціях</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              placeholder="ПІБ"
              value={form.personalInfo.emergencyContact.name}
              onChange={(e) => updateForm('personalInfo.emergencyContact.name', e.target.value)}
            />
            <Input
              placeholder="Телефон"
              value={form.personalInfo.emergencyContact.phone}
              onChange={(e) => updateForm('personalInfo.emergencyContact.phone', e.target.value)}
            />
            <Input
              placeholder="Зв'язок"
              value={form.personalInfo.emergencyContact.relation}
              onChange={(e) => updateForm('personalInfo.emergencyContact.relation', e.target.value)}
            />
          </div>
        </div>
      </TabsContent>
      
      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">
          {isEdit ? 'Оновити' : 'Створити'} співробітника
        </Button>
      </div>
    </Tabs>
  )
}

// Employee Details Component
function EmployeeDetails({ employee }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Огляд</TabsTrigger>
        <TabsTrigger value="documents">Документи</TabsTrigger>
        <TabsTrigger value="history">Історія</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Особиста інформація</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Повне ім'я:</span>
                <span>{employee.firstName} {employee.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span>{employee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Телефон:</span>
                <span>{employee.phone || 'Не вказано'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID співробітника:</span>
                <span>{employee.employeeId || 'Не вказано'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Робоча інформація</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Відділ:</span>
                <span>{employee.department || 'Не вказано'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Посада:</span>
                <span>{employee.position || 'Не вказано'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Рівень доступу:</span>
                <Badge>{employee.accessLevel}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Місце роботи:</span>
                <span>{employee.workLocation || 'Не вказано'}</span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="documents">
        <div className="text-center py-8">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Документи співробітника</h3>
          <p className="text-gray-600 mb-4">Управління документами буде додано в наступних версіях</p>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Завантажити документ
          </Button>
        </div>
      </TabsContent>
      
      <TabsContent value="history">
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Історія змін</h3>
          <p className="text-gray-600">Історія змін співробітника буде відображатися тут</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}