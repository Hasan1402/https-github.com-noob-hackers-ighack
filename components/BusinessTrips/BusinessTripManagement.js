'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { 
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  User,
  Building,
  Car,
  Plane,
  Train,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Receipt,
  TrendingUp,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function BusinessTripManagement({ user }) {
  const [trips, setTrips] = useState([])
  const [filteredTrips, setFilteredTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showExpensesDialog, setShowExpensesDialog] = useState(false)
  const [currentView, setCurrentView] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [statistics, setStatistics] = useState({})

  // Trip form state
  const [tripForm, setTripForm] = useState({
    employeeId: user?.id || '',
    employeeName: user?.fullName || '',
    employeePosition: user?.position || '',
    departmentId: user?.departmentId || '',
    departmentName: user?.departmentName || '',
    destination: {
      city: '',
      address: '',
      facility: ''
    },
    purpose: 'client_meeting',
    purposeDescription: '',
    departureDate: '',
    returnDate: '',
    transportType: 'company_car',
    transportDetails: {
      route: '',
      estimatedDistance: 0,
      estimatedFuelCost: 0
    },
    estimatedBudget: {
      transport: 0,
      accommodation: 0,
      meals: 0,
      other: 0,
      total: 0
    },
    notes: ''
  })

  // Mock data
  useEffect(() => {
    loadMockTrips()
  }, [])

  const loadMockTrips = () => {
    const mockTrips = [
      {
        id: 'trip-001',
        tripNumber: 'ВД-2025-0001',
        employeeId: user?.id || 'emp-001',
        employeeName: user?.fullName || 'Олександр Петренко',
        employeePosition: 'Менеджер з логістики',
        departmentId: 'dept-001',
        departmentName: 'Логістика',
        destination: {
          city: 'Львів',
          address: 'вул. Городоцька, 240',
          facility: 'Регіональне відділення Nova Poshta',
          coordinates: { lat: 49.8397, lng: 24.0297 }
        },
        purpose: 'warehouse_inspection',
        purposeDescription: 'Перевірка роботи регіонального хабу, аудит процесів сортування',
        departureDate: '2025-01-15T08:00:00Z',
        returnDate: '2025-01-17T18:00:00Z',
        duration: 3,
        transportType: 'company_car',
        transportDetails: {
          vehicleNumber: 'АА 1234 АА',
          route: 'Київ - Львів - Київ',
          estimatedDistance: 1080,
          estimatedFuelCost: 3500
        },
        estimatedBudget: {
          transport: 3500,
          accommodation: 4000,
          meals: 1500,
          other: 500,
          total: 9500
        },
        actualExpenses: {
          transport: 3200,
          accommodation: 3800,
          meals: 1650,
          other: 350,
          total: 9000
        },
        status: 'completed',
        approvalWorkflow: [
          {
            stage: 'manager',
            approverName: 'Марія Коваленко',
            approverId: 'mgr-001',
            status: 'approved',
            comment: 'Затверджено',
            processedAt: '2025-01-10T12:00:00Z'
          },
          {
            stage: 'finance',
            approverName: 'Андрій Сидоренко',
            approverId: 'fin-001',
            status: 'approved',
            comment: 'Бюджет затверджено',
            processedAt: '2025-01-11T09:30:00Z'
          }
        ],
        tripReport: {
          summary: 'Проведено повний аудит процесів сортування. Виявлено можливості оптимізації.',
          tasksCompleted: [
            'Перевірка швидкості обробки посилок',
            'Аналіз завантаженості персоналу',
            'Оцінка якості упаковки'
          ],
          results: 'Рекомендовано впровадити автоматизовану систему сортування',
          recommendations: 'Закупити додаткове обладнання, провести навчання персоналу',
          reportDate: '2025-01-18T10:00:00Z'
        },
        documents: [
          {
            name: 'Звіт про відрядження',
            type: 'report',
            uploadedAt: '2025-01-18T10:00:00Z',
            uploadedBy: 'emp-001'
          }
        ],
        createdAt: '2025-01-08T14:30:00Z',
        updatedAt: '2025-01-18T10:00:00Z'
      },
      {
        id: 'trip-002',
        tripNumber: 'ВД-2025-0002',
        employeeId: 'emp-002',
        employeeName: 'Анна Іваненко',
        employeePosition: 'Менеджер з продажу',
        departmentId: 'dept-002',
        departmentName: 'Продажі',
        destination: {
          city: 'Одеса',
          address: 'Преображенська, 15',
          facility: 'Офіс клієнта "МореТрейд"'
        },
        purpose: 'client_meeting',
        purposeDescription: 'Переговори з новим корпоративним клієнтом про логістичні послуги',
        departureDate: '2025-01-20T07:00:00Z',
        returnDate: '2025-01-21T20:00:00Z',
        duration: 2,
        transportType: 'plane',
        transportDetails: {
          route: 'Київ - Одеса - Київ',
          estimatedDistance: 950,
          estimatedFuelCost: 0
        },
        estimatedBudget: {
          transport: 6000,
          accommodation: 2500,
          meals: 1200,
          other: 800,
          total: 10500
        },
        status: 'approved',
        approvalWorkflow: [
          {
            stage: 'manager',
            approverName: 'Сергій Бондаренко',
            approverId: 'mgr-002',
            status: 'approved',
            comment: 'Важливий клієнт, затверджено',
            processedAt: '2025-01-15T16:20:00Z'
          },
          {
            stage: 'finance',
            approverName: 'Андрій Сидоренко',
            approverId: 'fin-001',
            status: 'approved',
            comment: 'Бюджет в межах норми',
            processedAt: '2025-01-16T11:15:00Z'
          }
        ],
        documents: [
          {
            name: 'Заявка на відрядження',
            type: 'application',
            uploadedAt: '2025-01-14T13:45:00Z',
            uploadedBy: 'emp-002'
          }
        ],
        createdAt: '2025-01-14T13:45:00Z',
        updatedAt: '2025-01-16T11:15:00Z'
      },
      {
        id: 'trip-003',
        tripNumber: 'ВД-2025-0003',
        employeeId: 'emp-003',
        employeeName: 'Дмитро Мельник',
        employeePosition: 'IT-спеціаліст',
        departmentId: 'dept-003',
        departmentName: 'IT',
        destination: {
          city: 'Харків',
          address: 'Салтівське шосе, 266',
          facility: 'Дата-центр Nova Poshta'
        },
        purpose: 'maintenance',
        purposeDescription: 'Планове технічне обслуговування серверного обладнання',
        departureDate: '2025-01-25T09:00:00Z',
        returnDate: '2025-01-26T17:00:00Z',
        duration: 2,
        transportType: 'train',
        transportDetails: {
          route: 'Київ - Харків - Київ',
          estimatedDistance: 950,
          estimatedFuelCost: 0
        },
        estimatedBudget: {
          transport: 2000,
          accommodation: 1800,
          meals: 800,
          other: 400,
          total: 5000
        },
        status: 'manager_review',
        approvalWorkflow: [
          {
            stage: 'manager',
            status: 'pending'
          }
        ],
        documents: [],
        createdAt: '2025-01-18T09:15:00Z',
        updatedAt: '2025-01-18T09:15:00Z'
      }
    ]
    
    setTrips(mockTrips)
    setFilteredTrips(mockTrips)
    updateStatistics(mockTrips)
  }

  const updateStatistics = (tripsData) => {
    const stats = {
      total: tripsData.length,
      draft: tripsData.filter(t => t.status === 'draft').length,
      pending: tripsData.filter(t => ['submitted', 'manager_review', 'finance_review'].includes(t.status)).length,
      approved: tripsData.filter(t => t.status === 'approved').length,
      inProgress: tripsData.filter(t => t.status === 'in_progress').length,
      completed: tripsData.filter(t => t.status === 'completed').length,
      rejected: tripsData.filter(t => t.status === 'rejected').length,
      totalBudget: tripsData.reduce((sum, t) => sum + t.estimatedBudget.total, 0),
      totalExpenses: tripsData.reduce((sum, t) => sum + (t.actualExpenses?.total || 0), 0)
    }
    setStatistics(stats)
  }

  useEffect(() => {
    filterTrips()
  }, [searchTerm, filterStatus, filterDepartment, trips])

  const filterTrips = () => {
    let filtered = trips

    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.purposeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(trip => trip.status === filterStatus)
    }

    if (filterDepartment && filterDepartment !== 'all') {
      filtered = filtered.filter(trip => trip.departmentId === filterDepartment)
    }

    setFilteredTrips(filtered)
    updateStatistics(filtered)
  }

  const handleCreateTrip = async () => {
    try {
      setIsLoading(true)
      
      // Валідація
      if (!tripForm.destination.city || !tripForm.purposeDescription || !tripForm.departureDate || !tripForm.returnDate) {
        toast.error('Заповніть всі обов\'язкові поля')
        return
      }

      // Розрахунок загального бюджету
      const totalBudget = Object.values(tripForm.estimatedBudget).reduce((sum, val) => {
        if (typeof val === 'number') return sum + val
        return sum
      }, 0) - tripForm.estimatedBudget.total

      const newTrip = {
        id: `trip-${Date.now()}`,
        tripNumber: `ВД-2025-${String(trips.length + 1).padStart(4, '0')}`,
        ...tripForm,
        estimatedBudget: {
          ...tripForm.estimatedBudget,
          total: totalBudget
        },
        status: 'draft',
        approvalWorkflow: [{
          stage: 'manager',
          status: 'pending'
        }],
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setTrips(prev => [newTrip, ...prev])
      setShowCreateDialog(false)
      resetTripForm()
      toast.success('Відрядження створено успішно')
    } catch (error) {
      console.error('Error creating trip:', error)
      toast.error('Помилка створення відрядження')
    } finally {
      setIsLoading(false)
    }
  }

  const resetTripForm = () => {
    setTripForm({
      employeeId: user?.id || '',
      employeeName: user?.fullName || '',
      employeePosition: user?.position || '',
      departmentId: user?.departmentId || '',
      departmentName: user?.departmentName || '',
      destination: {
        city: '',
        address: '',
        facility: ''
      },
      purpose: 'client_meeting',
      purposeDescription: '',
      departureDate: '',
      returnDate: '',
      transportType: 'company_car',
      transportDetails: {
        route: '',
        estimatedDistance: 0,
        estimatedFuelCost: 0
      },
      estimatedBudget: {
        transport: 0,
        accommodation: 0,
        meals: 0,
        other: 0,
        total: 0
      },
      notes: ''
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', text: 'Чернетка' },
      'submitted': { color: 'bg-blue-100 text-blue-800', text: 'Подано' },
      'manager_review': { color: 'bg-yellow-100 text-yellow-800', text: 'На розгляді' },
      'finance_review': { color: 'bg-orange-100 text-orange-800', text: 'Фін. погодження' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Затверджено' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Відхилено' },
      'in_progress': { color: 'bg-purple-100 text-purple-800', text: 'В процесі' },
      'completed': { color: 'bg-emerald-100 text-emerald-800', text: 'Завершено' },
      'report_pending': { color: 'bg-amber-100 text-amber-800', text: 'Очікує звіту' }
    }
    
    const config = statusConfig[status] || statusConfig.draft
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getPurposeText = (purpose) => {
    const purposes = {
      'warehouse_inspection': 'Перевірка складу',
      'client_meeting': 'Зустріч з клієнтом',
      'partner_negotiations': 'Переговори з партнерами',
      'audit': 'Аудит',
      'training': 'Навчання',
      'conference': 'Конференція',
      'maintenance': 'Тех. обслуговування',
      'other': 'Інше'
    }
    return purposes[purpose] || purpose
  }

  const getTransportIcon = (transportType) => {
    const icons = {
      'company_car': <Car className="w-4 h-4" />,
      'personal_car': <Car className="w-4 h-4" />,
      'train': <Train className="w-4 h-4" />,
      'bus': <Car className="w-4 h-4" />,
      'plane': <Plane className="w-4 h-4" />,
      'other': <Car className="w-4 h-4" />
    }
    return icons[transportType] || icons.other
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Відрядження</h2>
          <p className="text-gray-600">Управління бізнес-поїздками</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Експорт
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Нове відрядження
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Створити відрядження</DialogTitle>
              </DialogHeader>

              <TripForm
                form={tripForm}
                setForm={setTripForm}
                onSubmit={handleCreateTrip}
                onCancel={() => {
                  setShowCreateDialog(false)
                  resetTripForm()
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={currentView} onValueChange={setCurrentView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Список відряджень</TabsTrigger>
          <TabsTrigger value="calendar">Календар</TabsTrigger>
          <TabsTrigger value="approval">Узгодження</TabsTrigger>
          <TabsTrigger value="reports">Звіти</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Всього</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.total || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">На розгляді</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.pending || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Затверджено</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.approved || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">В процесі</p>
                    <p className="text-2xl font-bold text-purple-600">{statistics.inProgress || 0}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Завершено</p>
                    <p className="text-2xl font-bold text-emerald-600">{statistics.completed || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Відхилено</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.rejected || 0}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Бюджет</p>
                    <p className="text-xl font-bold text-orange-600">
                      {Math.round(statistics.totalBudget || 0).toLocaleString()} ₴
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Витрати</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {Math.round(statistics.totalExpenses || 0).toLocaleString()} ₴
                    </p>
                  </div>
                  <Receipt className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Пошук відряджень..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі статуси</SelectItem>
                    <SelectItem value="draft">Чернетка</SelectItem>
                    <SelectItem value="manager_review">На розгляді</SelectItem>
                    <SelectItem value="finance_review">Фін. погодження</SelectItem>
                    <SelectItem value="approved">Затверджено</SelectItem>
                    <SelectItem value="in_progress">В процесі</SelectItem>
                    <SelectItem value="completed">Завершено</SelectItem>
                    <SelectItem value="rejected">Відхилено</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trips List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTrips.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-12 text-center">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Відрядження не знайдено</h3>
                    <p className="text-gray-600">Створіть перше відрядження або змініть критерії пошуку</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onViewDetails={(trip) => {
                    setSelectedTrip(trip)
                    setShowDetailsDialog(true)
                  }}
                  onEdit={(trip) => {
                    setSelectedTrip(trip)
                    setTripForm(trip)
                    setShowEditDialog(true)
                  }}
                  onViewExpenses={(trip) => {
                    setSelectedTrip(trip)
                    setShowExpensesDialog(true)
                  }}
                  getStatusBadge={getStatusBadge}
                  getPurposeText={getPurposeText}
                  getTransportIcon={getTransportIcon}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Календар відряджень</h3>
                <p className="text-gray-600">Незабаром буде доступно</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Узгодження відряджень</h3>
                <p className="text-gray-600">Незабаром буде доступно</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Звіти по відрядженням</h3>
                <p className="text-gray-600">Незабаром буде доступно</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trip Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі відрядження</DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <TripDetails 
              trip={selectedTrip} 
              getStatusBadge={getStatusBadge}
              getPurposeText={getPurposeText}
              getTransportIcon={getTransportIcon}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}