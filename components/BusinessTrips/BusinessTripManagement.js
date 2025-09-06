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

// Trip Card Component
function TripCard({ trip, onViewDetails, onEdit, onViewExpenses, getStatusBadge, getPurposeText, getTransportIcon }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-medium text-gray-900">{trip.tripNumber}</h3>
              {getStatusBadge(trip.status)}
            </div>
            <p className="text-sm text-gray-600 mb-1">{trip.employeeName}</p>
            <p className="text-xs text-gray-500">{trip.departmentName}</p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(trip)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(trip)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mb-4" onClick={() => onViewDetails(trip)}>
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{trip.destination.city}</p>
              <p className="text-xs text-gray-500">{trip.destination.facility}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              {format(new Date(trip.departureDate), 'dd MMM', { locale: uk })} - {format(new Date(trip.returnDate), 'dd MMM yyyy', { locale: uk })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {getTransportIcon(trip.transportType)}
            <span className="text-sm text-gray-600">
              {getPurposeText(trip.purpose)}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Бюджет:</span>
            <span className="font-bold text-lg">
              {trip.estimatedBudget.total.toLocaleString()} ₴
            </span>
          </div>
          
          {trip.actualExpenses && trip.actualExpenses.total > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Витрачено:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-purple-600">
                  {trip.actualExpenses.total.toLocaleString()} ₴
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewExpenses(trip)
                  }}
                >
                  <Receipt className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>Тривалість: {trip.duration} дн.</span>
          <span>Створено: {format(new Date(trip.createdAt), 'dd MMM yyyy', { locale: uk })}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Trip Form Component
function TripForm({ form, setForm, onSubmit, onCancel, isLoading = false }) {
  const updateForm = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const updateBudget = (category, value) => {
    const numValue = parseFloat(value) || 0
    setForm(prev => {
      const newBudget = {
        ...prev.estimatedBudget,
        [category]: numValue
      }
      newBudget.total = newBudget.transport + newBudget.accommodation + newBudget.meals + newBudget.other
      return {
        ...prev,
        estimatedBudget: newBudget
      }
    })
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Основні дані</TabsTrigger>
        <TabsTrigger value="destination">Призначення</TabsTrigger>
        <TabsTrigger value="transport">Транспорт</TabsTrigger>
        <TabsTrigger value="budget">Бюджет</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employeeName">Співробітник *</Label>
            <Input
              id="employeeName"
              value={form.employeeName}
              onChange={(e) => updateForm('employeeName', e.target.value)}
              placeholder="ПІБ співробітника"
            />
          </div>

          <div>
            <Label htmlFor="employeePosition">Посада</Label>
            <Input
              id="employeePosition"
              value={form.employeePosition}
              onChange={(e) => updateForm('employeePosition', e.target.value)}
              placeholder="Посада"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="purpose">Мета поїздки *</Label>
          <Select value={form.purpose} onValueChange={(value) => updateForm('purpose', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warehouse_inspection">Перевірка складу</SelectItem>
              <SelectItem value="client_meeting">Зустріч з клієнтом</SelectItem>
              <SelectItem value="partner_negotiations">Переговори з партнерами</SelectItem>
              <SelectItem value="audit">Аудит</SelectItem>
              <SelectItem value="training">Навчання</SelectItem>
              <SelectItem value="conference">Конференція</SelectItem>
              <SelectItem value="maintenance">Тех. обслуговування</SelectItem>
              <SelectItem value="other">Інше</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="purposeDescription">Детальний опис мети *</Label>
          <Textarea
            id="purposeDescription"
            value={form.purposeDescription}
            onChange={(e) => updateForm('purposeDescription', e.target.value)}
            placeholder="Опишіть детально мету та завдання поїздки..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departureDate">Дата виїзду *</Label>
            <Input
              id="departureDate"
              type="datetime-local"
              value={form.departureDate}
              onChange={(e) => updateForm('departureDate', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="returnDate">Дата повернення *</Label>
            <Input
              id="returnDate"
              type="datetime-local"
              value={form.returnDate}
              onChange={(e) => updateForm('returnDate', e.target.value)}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="destination" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Місто *</Label>
            <Input
              id="city"
              value={form.destination.city}
              onChange={(e) => updateForm('destination.city', e.target.value)}
              placeholder="Київ, Львів, Одеса..."
            />
          </div>

          <div>
            <Label htmlFor="facility">Об'єкт/Установа</Label>
            <Input
              id="facility"
              value={form.destination.facility}
              onChange={(e) => updateForm('destination.facility', e.target.value)}
              placeholder="Офіс, склад, відділення..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Адреса *</Label>
          <Input
            id="address"
            value={form.destination.address}
            onChange={(e) => updateForm('destination.address', e.target.value)}
            placeholder="Вулиця, номер будинку"
          />
        </div>
      </TabsContent>

      <TabsContent value="transport" className="space-y-4">
        <div>
          <Label htmlFor="transportType">Тип транспорту *</Label>
          <Select value={form.transportType} onValueChange={(value) => updateForm('transportType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company_car">Службове авто</SelectItem>
              <SelectItem value="personal_car">Особисте авто</SelectItem>
              <SelectItem value="train">Потяг</SelectItem>
              <SelectItem value="bus">Автобус</SelectItem>
              <SelectItem value="plane">Літак</SelectItem>
              <SelectItem value="other">Інше</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="route">Маршрут</Label>
          <Input
            id="route"
            value={form.transportDetails.route}
            onChange={(e) => updateForm('transportDetails.route', e.target.value)}
            placeholder="Київ - Львів - Київ"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="distance">Відстань (км)</Label>
            <Input
              id="distance"
              type="number"
              value={form.transportDetails.estimatedDistance}
              onChange={(e) => updateForm('transportDetails.estimatedDistance', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="fuelCost">Орієнтовна вартість палива (₴)</Label>
            <Input
              id="fuelCost"
              type="number"
              value={form.transportDetails.estimatedFuelCost}
              onChange={(e) => updateForm('transportDetails.estimatedFuelCost', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="budget" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transportBudget">Транспорт (₴)</Label>
            <Input
              id="transportBudget"
              type="number"
              value={form.estimatedBudget.transport}
              onChange={(e) => updateBudget('transport', e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="accommodationBudget">Проживання (₴)</Label>
            <Input
              id="accommodationBudget"
              type="number"
              value={form.estimatedBudget.accommodation}
              onChange={(e) => updateBudget('accommodation', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mealsBudget">Харчування (₴)</Label>
            <Input
              id="mealsBudget"
              type="number"
              value={form.estimatedBudget.meals}
              onChange={(e) => updateBudget('meals', e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="otherBudget">Інше (₴)</Label>
            <Input
              id="otherBudget"
              type="number"
              value={form.estimatedBudget.other}
              onChange={(e) => updateBudget('other', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Загальний бюджет:</span>
            <span className="text-2xl font-bold text-blue-600">
              {form.estimatedBudget.total.toLocaleString()} ₴
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Додаткові нотатки</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            placeholder="Додаткова інформація..."
            rows={3}
          />
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
          {isLoading ? 'Збереження...' : 'Створити відрядження'}
        </Button>
      </div>
    </Tabs>
  )
}

// Trip Details Component
function TripDetails({ trip, getStatusBadge, getPurposeText, getTransportIcon }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{trip.tripNumber}</h3>
            <p className="text-gray-600">{trip.employeeName} • {trip.employeePosition}</p>
          </div>
          {getStatusBadge(trip.status)}
        </div>
        
        <div className="text-sm text-gray-500">
          Створено: {format(new Date(trip.createdAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
          {trip.updatedAt !== trip.createdAt && (
            <span className="ml-4">
              Оновлено: {format(new Date(trip.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
            </span>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Деталі поїздки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{trip.destination.city}</p>
                <p className="text-sm text-gray-600">{trip.destination.address}</p>
                {trip.destination.facility && (
                  <p className="text-sm text-gray-500">{trip.destination.facility}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">
                  {format(new Date(trip.departureDate), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                </p>
                <p className="text-sm text-gray-600">
                  до {format(new Date(trip.returnDate), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                </p>
                <p className="text-sm text-gray-500">Тривалість: {trip.duration} дн.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getTransportIcon(trip.transportType)}
              <div>
                <p className="font-medium">{getPurposeText(trip.purpose)}</p>
                <p className="text-sm text-gray-600">{trip.purposeDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Бюджет та витрати</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Транспорт:</p>
                <p className="font-medium">
                  {trip.estimatedBudget.transport.toLocaleString()} ₴
                  {trip.actualExpenses && (
                    <span className="text-purple-600 ml-2">
                      / {trip.actualExpenses.transport.toLocaleString()} ₴
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600">Проживання:</p>
                <p className="font-medium">
                  {trip.estimatedBudget.accommodation.toLocaleString()} ₴
                  {trip.actualExpenses && (
                    <span className="text-purple-600 ml-2">
                      / {trip.actualExpenses.accommodation.toLocaleString()} ₴
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600">Харчування:</p>
                <p className="font-medium">
                  {trip.estimatedBudget.meals.toLocaleString()} ₴
                  {trip.actualExpenses && (
                    <span className="text-purple-600 ml-2">
                      / {trip.actualExpenses.meals.toLocaleString()} ₴
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600">Інше:</p>
                <p className="font-medium">
                  {trip.estimatedBudget.other.toLocaleString()} ₴
                  {trip.actualExpenses && (
                    <span className="text-purple-600 ml-2">
                      / {trip.actualExpenses.other.toLocaleString()} ₴
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Всього:</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    {trip.estimatedBudget.total.toLocaleString()} ₴
                  </div>
                  {trip.actualExpenses && trip.actualExpenses.total > 0 && (
                    <div className="text-sm text-purple-600">
                      Витрачено: {trip.actualExpenses.total.toLocaleString()} ₴
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transport Details */}
      {trip.transportDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Транспорт</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {trip.transportDetails.route && (
                <div>
                  <p className="text-gray-600">Маршрут:</p>
                  <p className="font-medium">{trip.transportDetails.route}</p>
                </div>
              )}
              
              {trip.transportDetails.estimatedDistance > 0 && (
                <div>
                  <p className="text-gray-600">Відстань:</p>
                  <p className="font-medium">{trip.transportDetails.estimatedDistance} км</p>
                </div>
              )}
              
              {trip.transportDetails.estimatedFuelCost > 0 && (
                <div>
                  <p className="text-gray-600">Вартість палива:</p>
                  <p className="font-medium">{trip.transportDetails.estimatedFuelCost} ₴</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Workflow */}
      {trip.approvalWorkflow && trip.approvalWorkflow.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Процес узгодження</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trip.approvalWorkflow.map((workflow, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      workflow.status === 'approved' ? 'bg-green-500' :
                      workflow.status === 'rejected' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">
                        {workflow.stage === 'manager' ? 'Керівник підрозділу' :
                         workflow.stage === 'finance' ? 'Фінансовий відділ' :
                         workflow.stage === 'final' ? 'Фінальне затвердження' : workflow.stage}
                      </p>
                      {workflow.approverName && (
                        <p className="text-sm text-gray-600">{workflow.approverName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={
                      workflow.status === 'approved' ? 'bg-green-100 text-green-800' :
                      workflow.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {workflow.status === 'approved' ? 'Затверджено' :
                       workflow.status === 'rejected' ? 'Відхилено' : 'Очікує'}
                    </Badge>
                    {workflow.processedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(workflow.processedAt), 'dd MMM HH:mm', { locale: uk })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Report */}
      {trip.tripReport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Звіт про відрядження</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trip.tripReport.summary && (
              <div>
                <h4 className="font-medium mb-2">Загальний підсумок:</h4>
                <p className="text-gray-700">{trip.tripReport.summary}</p>
              </div>
            )}
            
            {trip.tripReport.tasksCompleted && trip.tripReport.tasksCompleted.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Виконані завдання:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {trip.tripReport.tasksCompleted.map((task, index) => (
                    <li key={index}>{task}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {trip.tripReport.results && (
              <div>
                <h4 className="font-medium mb-2">Результати:</h4>
                <p className="text-gray-700">{trip.tripReport.results}</p>
              </div>
            )}
            
            {trip.tripReport.recommendations && (
              <div>
                <h4 className="font-medium mb-2">Рекомендації:</h4>
                <p className="text-gray-700">{trip.tripReport.recommendations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {trip.documents && trip.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Документи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trip.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-gray-600">
                        {doc.type === 'application' && 'Заявка'}
                        {doc.type === 'order' && 'Наказ'}
                        {doc.type === 'report' && 'Звіт'}
                        {doc.type === 'receipt' && 'Чек'}
                        {doc.type === 'invoice' && 'Рахунок'}
                        {doc.type === 'other' && 'Інший документ'}
                        {' • '}
                        {format(new Date(doc.uploadedAt), 'dd MMM yyyy', { locale: uk })}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {trip.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Нотатки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{trip.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}