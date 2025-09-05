'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Plane, 
  Plus, 
  MapPin, 
  Calendar as CalendarIcon, 
  DollarSign, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Calculator
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, differenceInDays } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function BusinessTripManagement({ user }) {
  const [trips, setTrips] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  // Trip form state
  const [tripForm, setTripForm] = useState({
    employeeId: '',
    destination: '',
    purpose: '',
    startDate: null,
    endDate: null,
    transport: '',
    accommodation: '',
    dailyAllowance: 0,
    transportExpenses: 0,
    accommodationExpenses: 0,
    otherExpenses: 0,
    notes: '',
    documents: []
  })

  // Mock business trips data
  const mockTrips = [
    {
      id: '1',
      employeeId: 'emp-001',
      employeeName: 'Олексій Коваленко',
      department: 'Логістика',
      destination: 'Львів, Львівська область',
      purpose: 'Перевірка складського комплексу та навчання персоналу',
      startDate: '2024-12-15',
      endDate: '2024-12-18',
      duration: 4,
      status: 'approved',
      transport: 'plane',
      accommodation: 'hotel',
      totalBudget: 8500,
      dailyAllowance: 480,
      transportExpenses: 3200,
      accommodationExpenses: 4800,
      otherExpenses: 20,
      approvedBy: 'Марія Петренко',
      approvedDate: '2024-12-10',
      createdDate: '2024-12-08'
    },
    {
      id: '2',
      employeeId: 'emp-002',
      employeeName: 'Марія Сидоренко',
      department: 'Продажі',
      destination: 'Одеса, Одеська область',
      purpose: 'Зустріч з великими клієнтами та підписання договорів',
      startDate: '2024-12-20',
      endDate: '2024-12-22',
      duration: 3,
      status: 'pending',
      transport: 'train',
      accommodation: 'hotel',
      totalBudget: 5400,
      dailyAllowance: 360,
      transportExpenses: 1800,
      accommodationExpenses: 3240,
      otherExpenses: 0,
      createdDate: '2024-12-12'
    },
    {
      id: '3',
      employeeId: 'emp-003',
      employeeName: 'Іван Іваненко',
      department: 'ІТ',
      destination: 'Харків, Харківська область',
      purpose: 'Встановлення та налаштування серверного обладнання',
      startDate: '2024-12-25',
      endDate: '2024-12-27',
      duration: 3,
      status: 'rejected',
      transport: 'car',
      accommodation: 'guest_house',
      totalBudget: 3600,
      dailyAllowance: 360,
      transportExpenses: 1200,
      accommodationExpenses: 2040,
      otherExpenses: 0,
      rejectionReason: 'Недостатнє обґрунтування необхідності поїздки',
      createdDate: '2024-12-11'
    }
  ]

  useEffect(() => {
    setTrips(mockTrips)
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/sso/hr?action=employees')
      if (response.ok) {
        const result = await response.json()
        setEmployees(result.data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleCreateTrip = async () => {
    try {
      // Calculate duration and total budget
      const duration = differenceInDays(tripForm.endDate, tripForm.startDate) + 1
      const totalBudget = (tripForm.dailyAllowance * duration) + 
                          tripForm.transportExpenses + 
                          tripForm.accommodationExpenses + 
                          tripForm.otherExpenses

      const newTrip = {
        id: Date.now().toString(),
        ...tripForm,
        employeeName: employees.find(emp => emp._id === tripForm.employeeId)?.firstName + ' ' + 
                      employees.find(emp => emp._id === tripForm.employeeId)?.lastName,
        department: employees.find(emp => emp._id === tripForm.employeeId)?.department,
        startDate: format(tripForm.startDate, 'yyyy-MM-dd'),
        endDate: format(tripForm.endDate, 'yyyy-MM-dd'),
        duration,
        totalBudget,
        status: 'pending',
        createdDate: format(new Date(), 'yyyy-MM-dd')
      }

      setTrips(prev => [newTrip, ...prev])
      setShowCreateDialog(false)
      resetTripForm()
      toast.success('Заявку на відрядження створено')
    } catch (error) {
      console.error('Error creating trip:', error)
      toast.error('Помилка створення заявки')
    }
  }

  const handleApproveTrip = async (tripId) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId 
        ? { ...trip, status: 'approved', approvedBy: user?.fullName, approvedDate: format(new Date(), 'yyyy-MM-dd') }
        : trip
    ))
    toast.success('Відрядження затверджено')
  }

  const handleRejectTrip = async (tripId, reason) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId 
        ? { ...trip, status: 'rejected', rejectionReason: reason }
        : trip
    ))
    toast.success('Відрядження відхилено')
  }

  const resetTripForm = () => {
    setTripForm({
      employeeId: '',
      destination: '',
      purpose: '',
      startDate: null,
      endDate: null,
      transport: '',
      accommodation: '',
      dailyAllowance: 0,
      transportExpenses: 0,
      accommodationExpenses: 0,
      otherExpenses: 0,
      notes: '',
      documents: []
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Затверджено'
      case 'rejected': return 'Відхилено'
      case 'pending': return 'На розгляді'
      case 'completed': return 'Завершено'
      default: return 'Невідомо'
    }
  }

  const getTransportText = (transport) => {
    switch (transport) {
      case 'plane': return 'Літак'
      case 'train': return 'Поїзд'
      case 'car': return 'Автомобіль'
      case 'bus': return 'Автобус'
      default: return transport
    }
  }

  const getAccommodationText = (accommodation) => {
    switch (accommodation) {
      case 'hotel': return 'Готель'
      case 'guest_house': return 'Гостьовий будинок'
      case 'apartment': return 'Квартира'
      case 'none': return 'Без проживання'
      default: return accommodation
    }
  }

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true
    return trip.status === filter
  })

  const calculateTripBudget = () => {
    if (!tripForm.startDate || !tripForm.endDate) return 0
    
    const duration = differenceInDays(tripForm.endDate, tripForm.startDate) + 1
    return (tripForm.dailyAllowance * duration) + 
           tripForm.transportExpenses + 
           tripForm.accommodationExpenses + 
           tripForm.otherExpenses
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управління відрядженнями</h2>
          <p className="text-gray-600">Створення та погодження службових поїздок</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Нова заявка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Заявка на відрядження</DialogTitle>
            </DialogHeader>

            <TripForm
              form={tripForm}
              setForm={setTripForm}
              employees={employees}
              onSubmit={handleCreateTrip}
              onCancel={() => {
                setShowCreateDialog(false)
                resetTripForm()
              }}
              calculateBudget={calculateTripBudget}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="status-filter">Статус:</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі заявки</SelectItem>
                <SelectItem value="pending">На розгляді</SelectItem>
                <SelectItem value="approved">Затверджені</SelectItem>
                <SelectItem value="rejected">Відхилені</SelectItem>
                <SelectItem value="completed">Завершені</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>На розгляді: {trips.filter(t => t.status === 'pending').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Затверджені: {trips.filter(t => t.status === 'approved').length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trips List */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Plane className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Заявок на відрядження не знайдено</h3>
              <p className="text-gray-600">Створіть нову заявку на службову поїздку</p>
            </CardContent>
          </Card>
        ) : (
          filteredTrips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              user={user}
              onApprove={handleApproveTrip}
              onReject={handleRejectTrip}
              onViewDetails={(trip) => {
                setSelectedTrip(trip)
                setShowDetailsDialog(true)
              }}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getTransportText={getTransportText}
              getAccommodationText={getAccommodationText}
            />
          ))
        )}
      </div>

      {/* Trip Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі відрядження</DialogTitle>
          </DialogHeader>
          
          {selectedTrip && (
            <TripDetails 
              trip={selectedTrip}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getTransportText={getTransportText}
              getAccommodationText={getAccommodationText}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Trip Card Component
function TripCard({ 
  trip, 
  user, 
  onApprove, 
  onReject, 
  onViewDetails, 
  getStatusColor, 
  getStatusText, 
  getTransportText,
  getAccommodationText 
}) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const canApprove = user?.roles?.includes('admin') || user?.roles?.includes('hr_manager')

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-medium text-gray-900">{trip.employeeName}</h3>
              <Badge variant="outline">{trip.department}</Badge>
              <Badge className={getStatusColor(trip.status)}>
                {getStatusText(trip.status)}
              </Badge>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPin className="w-4 h-4 mr-2" />
              {trip.destination}
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {format(parseISO(trip.startDate), 'dd MMM', { locale: uk })} - {format(parseISO(trip.endDate), 'dd MMM yyyy', { locale: uk })} ({trip.duration} днів)
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Бюджет: {trip.totalBudget?.toLocaleString()} грн
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(trip)}
            >
              <Eye className="w-4 h-4" />
            </Button>

            {canApprove && trip.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => onApprove(trip.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
                
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Відхилення заявки на відрядження</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Причина відхилення *</Label>
                        <Textarea
                          id="reason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Вкажіть причину відхилення заявки"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowRejectDialog(false)}
                        >
                          Скасувати
                        </Button>
                        <Button 
                          onClick={() => {
                            if (rejectionReason.trim()) {
                              onReject(trip.id, rejectionReason)
                              setShowRejectDialog(false)
                              setRejectionReason('')
                            } else {
                              toast.error('Вкажіть причину відхилення')
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Відхилити
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700 font-medium mb-1">Мета поїздки:</p>
          <p className="text-sm text-gray-600">{trip.purpose}</p>
        </div>

        {trip.status === 'approved' && trip.approvedBy && (
          <div className="mt-3 text-sm text-green-600">
            Затверджено: {trip.approvedBy} ({format(parseISO(trip.approvedDate), 'dd.MM.yyyy')})
          </div>
        )}

        {trip.status === 'rejected' && trip.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Причина відхилення:</p>
            <p className="text-sm text-red-700">{trip.rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Trip Form Component
function TripForm({ form, setForm, employees, onSubmit, onCancel, calculateBudget }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Основна інформація</TabsTrigger>
        <TabsTrigger value="expenses">Витрати</TabsTrigger>
        <TabsTrigger value="additional">Додаткова інформація</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <Label htmlFor="employeeId">Співробітник *</Label>
          <Select 
            value={form.employeeId} 
            onValueChange={(value) => updateForm('employeeId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Виберіть співробітника" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} - {emp.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="destination">Місце призначення *</Label>
          <Input
            id="destination"
            value={form.destination}
            onChange={(e) => updateForm('destination', e.target.value)}
            placeholder="Львів, Львівська область"
          />
        </div>

        <div>
          <Label htmlFor="purpose">Мета поїздки *</Label>
          <Textarea
            id="purpose"
            value={form.purpose}
            onChange={(e) => updateForm('purpose', e.target.value)}
            placeholder="Детально опишіть мету та завдання поїздки"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Дата початку *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.startDate ? format(form.startDate, 'dd MMM yyyy', { locale: uk }) : 'Виберіть дату'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.startDate}
                  onSelect={(date) => updateForm('startDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Дата закінчення *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.endDate ? format(form.endDate, 'dd MMM yyyy', { locale: uk }) : 'Виберіть дату'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.endDate}
                  onSelect={(date) => updateForm('endDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transport">Транспорт</Label>
            <Select 
              value={form.transport} 
              onValueChange={(value) => updateForm('transport', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Виберіть транспорт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plane">Літак</SelectItem>
                <SelectItem value="train">Поїзд</SelectItem>
                <SelectItem value="car">Автомобіль</SelectItem>
                <SelectItem value="bus">Автобус</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="accommodation">Проживання</Label>
            <Select 
              value={form.accommodation} 
              onValueChange={(value) => updateForm('accommodation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Виберіть тип проживання" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Готель</SelectItem>
                <SelectItem value="guest_house">Гостьовий будинок</SelectItem>
                <SelectItem value="apartment">Квартира</SelectItem>
                <SelectItem value="none">Без проживання</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="expenses" className="space-y-4">
        <div>
          <Label htmlFor="dailyAllowance">Добові (грн на день)</Label>
          <Input
            id="dailyAllowance"
            type="number"
            value={form.dailyAllowance}
            onChange={(e) => updateForm('dailyAllowance', parseFloat(e.target.value) || 0)}
            placeholder="120"
          />
        </div>

        <div>
          <Label htmlFor="transportExpenses">Транспортні витрати (грн)</Label>
          <Input
            id="transportExpenses"
            type="number"
            value={form.transportExpenses}
            onChange={(e) => updateForm('transportExpenses', parseFloat(e.target.value) || 0)}
            placeholder="3200"
          />
        </div>

        <div>
          <Label htmlFor="accommodationExpenses">Витрати на проживання (грн)</Label>
          <Input
            id="accommodationExpenses"
            type="number"
            value={form.accommodationExpenses}
            onChange={(e) => updateForm('accommodationExpenses', parseFloat(e.target.value) || 0)}
            placeholder="4800"
          />
        </div>

        <div>
          <Label htmlFor="otherExpenses">Інші витрати (грн)</Label>
          <Input
            id="otherExpenses"
            type="number"
            value={form.otherExpenses}
            onChange={(e) => updateForm('otherExpenses', parseFloat(e.target.value) || 0)}
            placeholder="500"
          />
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Загальний бюджет:</span>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {calculateBudget().toLocaleString()} грн
              </span>
            </div>
            {form.startDate && form.endDate && (
              <div className="mt-2 text-sm text-blue-700">
                Тривалість: {differenceInDays(form.endDate, form.startDate) + 1} днів
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="additional" className="space-y-4">
        <div>
          <Label htmlFor="notes">Додаткові примітки</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            placeholder="Додаткова інформація про поїздку"
            rows={4}
          />
        </div>

        <div>
          <Label>Документи</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Прикріпіть документи (буде реалізовано пізніше)</p>
          </div>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">
          Створити заявку
        </Button>
      </div>
    </Tabs>
  )
}

// Trip Details Component  
function TripDetails({ 
  trip, 
  getStatusColor, 
  getStatusText, 
  getTransportText, 
  getAccommodationText 
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Огляд</TabsTrigger>
        <TabsTrigger value="expenses">Витрати</TabsTrigger>
        <TabsTrigger value="documents">Документи</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Інформація про поїздку</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Співробітник:</span>
                <span>{trip.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Відділ:</span>
                <span>{trip.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Призначення:</span>
                <span>{trip.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <Badge className={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Деталі поїздки</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Початок:</span>
                <span>{format(parseISO(trip.startDate), 'dd MMM yyyy', { locale: uk })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Закінчення:</span>
                <span>{format(parseISO(trip.endDate), 'dd MMM yyyy', { locale: uk })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Тривалість:</span>
                <span>{trip.duration} днів</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Транспорт:</span>
                <span>{getTransportText(trip.transport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Проживання:</span>
                <span>{getAccommodationText(trip.accommodation)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Мета поїздки</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">{trip.purpose}</p>
          </div>
        </div>

        {trip.status === 'approved' && trip.approvedBy && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-1">Інформація про затвердження</h4>
            <p className="text-sm text-green-700">
              Затверджено {trip.approvedBy} {format(parseISO(trip.approvedDate), 'dd.MM.yyyy')}
            </p>
          </div>
        )}

        {trip.status === 'rejected' && trip.rejectionReason && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-1">Причина відхилення</h4>
            <p className="text-sm text-red-700">{trip.rejectionReason}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="expenses" className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Добові</h4>
              <div className="text-2xl font-bold text-blue-600">
                {(trip.dailyAllowance * trip.duration).toLocaleString()} грн
              </div>
              <div className="text-sm text-blue-700">
                {trip.dailyAllowance} грн × {trip.duration} днів
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Транспорт</h4>
              <div className="text-2xl font-bold text-green-600">
                {trip.transportExpenses?.toLocaleString()} грн
              </div>
              <div className="text-sm text-green-700">
                {getTransportText(trip.transport)}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Проживання</h4>
              <div className="text-2xl font-bold text-purple-600">
                {trip.accommodationExpenses?.toLocaleString()} грн
              </div>
              <div className="text-sm text-purple-700">
                {getAccommodationText(trip.accommodation)}
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Інші витрати</h4>
              <div className="text-2xl font-bold text-orange-600">
                {trip.otherExpenses?.toLocaleString()} грн
              </div>
              <div className="text-sm text-orange-700">
                Додаткові витрати
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Загальний бюджет</h4>
              <div className="text-3xl font-bold">
                {trip.totalBudget?.toLocaleString()} грн
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="documents">
        <div className="text-center py-8">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Документи поїздки</h3>
          <p className="text-gray-600 mb-4">Управління документами буде додано в наступних версіях</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}