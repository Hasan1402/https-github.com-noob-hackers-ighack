'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  User,
  UserPlus,
  Building
} from 'lucide-react'
import { toast } from 'sonner'

export default function DepartmentStructure({ user }) {
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [expandedDepts, setExpandedDepts] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  
  // Department form state
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    parentId: '',
    managerId: '',
    location: '',
    budget: '',
    headcount: ''
  })

  // Mock department structure - in real app, this would come from API
  const mockDepartments = [
    {
      id: '1',
      name: 'Нова Пошта',
      description: 'Головна компанія',
      parentId: null,
      managerId: 'admin-001',
      managerName: 'Олександра Коваленко',
      location: 'Київ, Головний офіс',
      employeeCount: 45000,
      children: [
        {
          id: '2',
          name: 'Логістика та доставка',
          description: 'Управління логістичними процесами',
          parentId: '1',
          managerId: 'manager-002',
          managerName: 'Максим Петренко',
          location: 'Київ, Логістичний центр',
          employeeCount: 15000,
          children: [
            {
              id: '21',
              name: 'Склади',
              description: 'Управління складськими комплексами',
              parentId: '2',
              managerId: 'warehouse-001',
              managerName: 'Олексій Коваленко',
              location: 'Різні міста України',
              employeeCount: 5000,
              children: []
            },
            {
              id: '22',
              name: 'Доставка',
              description: 'Кур\'єрська доставка',
              parentId: '2',
              managerId: 'delivery-001',
              managerName: 'Марія Сидоренко',
              location: 'Всі регіони',
              employeeCount: 8000,
              children: []
            },
            {
              id: '23',
              name: 'Транспорт',
              description: 'Управління автопарком',
              parentId: '2',
              managerId: 'fleet-001',
              managerName: 'Іван Іваненко',
              location: 'Регіональні центри',
              employeeCount: 2000,
              children: []
            }
          ]
        },
        {
          id: '3',
          name: 'Відділення та обслуговування',
          description: 'Мережа відділень',
          parentId: '1',
          managerId: 'branch-001',
          managerName: 'Тетяна Василенко',
          location: 'По всій Україні',
          employeeCount: 12000,
          children: [
            {
              id: '31',
              name: 'Київські відділення',
              description: 'Відділення в Києві та області',
              parentId: '3',
              managerId: 'kyiv-001',
              managerName: 'Сергій Морозов',
              location: 'Київ та область',
              employeeCount: 2000,
              children: []
            },
            {
              id: '32',
              name: 'Регіональні відділення',
              description: 'Відділення в регіонах',
              parentId: '3',
              managerId: 'regional-001',
              managerName: 'Оксана Лисенко',
              location: 'Регіони України',
              employeeCount: 10000,
              children: []
            }
          ]
        },
        {
          id: '4',
          name: 'ІТ та розробка',
          description: 'Інформаційні технології',
          parentId: '1',
          managerId: 'it-001',
          managerName: 'Андрій Коваль',
          location: 'Київ, IT-центр',
          employeeCount: 800,
          children: [
            {
              id: '41',
              name: 'Розробка',
              description: 'Розробка програмного забезпечення',
              parentId: '4',
              managerId: 'dev-001',
              managerName: 'Дмитро Шевченко',
              location: 'Київ',
              employeeCount: 400,
              children: []
            },
            {
              id: '42',
              name: 'Технічна підтримка',
              description: 'Підтримка користувачів',
              parentId: '4',
              managerId: 'support-001',
              managerName: 'Наталія Бондаренко',
              location: 'Київ',
              employeeCount: 200,
              children: []
            }
          ]
        },
        {
          id: '5',
          name: 'HR та адміністрація',
          description: 'Управління персоналом',
          parentId: '1',
          managerId: 'hr-001',
          managerName: 'Марія Петренко',
          location: 'Київ',
          employeeCount: 500,
          children: [
            {
              id: '51',
              name: 'Рекрутинг',
              description: 'Підбір персоналу',
              parentId: '5',
              managerId: 'recruit-001',
              managerName: 'Юлія Романенко',
              location: 'Київ',
              employeeCount: 100,
              children: []
            },
            {
              id: '52',
              name: 'Навчання та розвиток',
              description: 'Корпоративне навчання',
              parentId: '5',
              managerId: 'training-001',
              managerName: 'Володимир Савченко',
              location: 'Київ',
              employeeCount: 80,
              children: []
            }
          ]
        }
      ]
    }
  ]

  useEffect(() => {
    setDepartments(mockDepartments)
    // Expand top level by default
    setExpandedDepts(new Set(['1', '2', '3', '4', '5']))
  }, [])

  const toggleDepartmentExpansion = (deptId) => {
    const newExpanded = new Set(expandedDepts)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedDepts(newExpanded)
  }

  const handleCreateDepartment = async () => {
    // Mock implementation - in real app, this would call API
    toast.success('Відділ створено успішно')
    setShowAddDialog(false)
    setDepartmentForm({
      name: '',
      description: '',
      parentId: '',
      managerId: '',
      location: '',
      budget: '',
      headcount: ''
    })
  }

  const handleEditDepartment = async () => {
    // Mock implementation - in real app, this would call API
    toast.success('Відділ оновлено успішно')
    setShowEditDialog(false)
  }

  const renderDepartment = (dept, level = 0) => {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedDepts.has(dept.id)
    const paddingLeft = level * 24

    return (
      <div key={dept.id} className="mb-2">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3" style={{ paddingLeft: `${paddingLeft}px` }}>
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDepartmentExpansion(dept.id)}
                    className="p-1 h-8 w-8"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-8" />
                )}

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {level === 0 ? (
                      <Building className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-600">{dept.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4 mr-1" />
                    {dept.managerName}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {dept.employeeCount?.toLocaleString()} співробітників
                  </div>
                </div>

                <Badge variant="outline" className="text-xs">
                  {dept.location}
                </Badge>

                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(dept)
                      setDepartmentForm({
                        name: dept.name,
                        description: dept.description,
                        parentId: dept.parentId || '',
                        managerId: dept.managerId || '',
                        location: dept.location || '',
                        budget: '',
                        headcount: dept.employeeCount?.toString() || ''
                      })
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDepartment(dept)}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
            {dept.children.map(child => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Організаційна структура</h2>
          <p className="text-gray-600">Ієрархія відділів та підрозділів</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Додати відділ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новий відділ</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Назва відділу *</Label>
                <Input
                  id="name"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Логістика та доставка"
                />
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Управління логістичними процесами"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentId">Батьківський відділ</Label>
                  <Select
                    value={departmentForm.parentId}
                    onValueChange={(value) => setDepartmentForm(prev => ({ ...prev, parentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть батьківський відділ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Немає (верхній рівень)</SelectItem>
                      <SelectItem value="1">Нова Пошта</SelectItem>
                      <SelectItem value="2">Логістика та доставка</SelectItem>
                      <SelectItem value="3">Відділення та обслуговування</SelectItem>
                      <SelectItem value="4">ІТ та розробка</SelectItem>
                      <SelectItem value="5">HR та адміністрація</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Розташування</Label>
                  <Input
                    id="location"
                    value={departmentForm.location}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Київ, Головний офіс"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Бюджет (грн)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={departmentForm.budget}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>

                <div>
                  <Label htmlFor="headcount">Планова чисельність</Label>
                  <Input
                    id="headcount"
                    type="number"
                    value={departmentForm.headcount}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, headcount: e.target.value }))}
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Скасувати
                </Button>
                <Button 
                  onClick={handleCreateDepartment}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Створити відділ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Tree */}
      <div className="space-y-2">
        {departments.map(dept => renderDepartment(dept))}
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика організації</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">45,000</div>
              <div className="text-sm text-gray-600">Всього співробітників</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">15</div>
              <div className="text-sm text-gray-600">Всього відділів</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">24</div>
              <div className="text-sm text-gray-600">Регіонів</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">2,500</div>
              <div className="text-sm text-gray-600">Відділень</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редагування відділу</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Назва відділу *</Label>
              <Input
                id="editName"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="editDescription">Опис</Label>
              <Textarea
                id="editDescription"
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editLocation">Розташування</Label>
                <Input
                  id="editLocation"
                  value={departmentForm.location}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="editHeadcount">Планова чисельність</Label>
                <Input
                  id="editHeadcount"
                  type="number"
                  value={departmentForm.headcount}
                  onChange={(e) => setDepartmentForm(prev => ({ ...prev, headcount: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
              >
                Скасувати
              </Button>
              <Button 
                onClick={handleEditDepartment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Оновити відділ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}