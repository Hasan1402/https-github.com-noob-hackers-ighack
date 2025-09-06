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
import { 
  User, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Phone,
  Mail,
  Building,
  Calendar,
  Target,
  Filter,
  Download,
  TrendingUp,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function LeadsManagement({ user }) {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Lead form state
  const [leadForm, setLeadForm] = useState({
    title: '',
    contactPerson: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: 'manual',
    status: 'new',
    description: '',
    expectedAmount: 0,
    probability: 0,
    assignedTo: user?.id || '',
    assignedToName: user?.fullName || '',
    nextFollowUpDate: ''
  })

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    qualified: 0,
    rejected: 0,
    totalValue: 0
  })

  // Mock data
  useEffect(() => {
    loadMockLeads()
  }, [])

  const loadMockLeads = () => {
    const mockLeads = [
      {
        id: 'lead-001',
        title: 'Потенційний клієнт - логістичні послуги',
        contactPerson: 'Олександр Петренко',
        email: 'o.petrenko@ukrlogistics.com',
        phone: '+380671234567',
        company: 'УкрЛогістикс ТОВ',
        position: 'Менеджер з закупівель',
        source: 'website',
        status: 'in_progress',
        description: 'Зацікавлений у послугах доставки по України та міжнародних перевезеннях',
        expectedAmount: 150000,
        probability: 75,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        createdAt: '2024-12-10T10:30:00Z',
        updatedAt: '2024-12-12T14:20:00Z',
        nextFollowUpDate: '2024-12-15T09:00:00Z',
        lastContactDate: '2024-12-12T14:20:00Z',
        tags: ['VIP', 'B2B', 'Логістика']
      },
      {
        id: 'lead-002',
        title: 'Інтернет-магазин - потреба у кур\'єрських послугах',
        contactPerson: 'Марія Іваненко',
        email: 'maria@shopua.com',
        phone: '+380501234567',
        company: 'ShopUA',
        position: 'Власник',
        source: 'phone',
        status: 'new',
        description: 'Розвиває інтернет-магазин одягу, потребує надійного партнера для доставки',
        expectedAmount: 50000,
        probability: 40,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        createdAt: '2024-12-12T16:45:00Z',
        updatedAt: '2024-12-12T16:45:00Z',
        nextFollowUpDate: '2024-12-13T10:00:00Z',
        tags: ['E-commerce', 'SMB']
      },
      {
        id: 'lead-003',
        title: 'Виробнича компанія - відправки по регіонах',
        contactPerson: 'Дмитро Коваленко',
        email: 'd.kovalenko@manufacture.ua',
        phone: '+380441234567',
        company: 'Виробнича компанія "Успіх"',
        position: 'Комерційний директор',
        source: 'referral',
        status: 'qualified',
        description: 'Виробник побутової техніки, потрібні регулярні відправки по Україні',
        expectedAmount: 300000,
        probability: 90,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        createdAt: '2024-12-05T09:15:00Z',
        updatedAt: '2024-12-11T11:30:00Z',
        nextFollowUpDate: '2024-12-14T15:00:00Z',
        lastContactDate: '2024-12-11T11:30:00Z',
        tags: ['Enterprise', 'Manufacturing', 'Regular']
      },
      {
        id: 'lead-004',
        title: 'Медичний центр - доставка медикаментів',
        contactPerson: 'Анна Сидоренко',
        email: 'a.sydorenko@medcenter.ua',
        phone: '+380631234567',
        company: 'Медичний центр "Здоров\'я"',
        position: 'Завідувач аптеки',
        source: 'email',
        status: 'rejected',
        description: 'Були переговори щодо доставки медикаментів, але не підійшли умови',
        expectedAmount: 75000,
        probability: 0,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        createdAt: '2024-12-08T13:20:00Z',
        updatedAt: '2024-12-10T16:45:00Z',
        tags: ['Healthcare', 'Rejected']
      }
    ]
    
    setLeads(mockLeads)
    setFilteredLeads(mockLeads)
    updateStats(mockLeads)
  }

  const updateStats = (leadsData) => {
    const stats = {
      total: leadsData.length,
      new: leadsData.filter(l => l.status === 'new').length,
      inProgress: leadsData.filter(l => l.status === 'in_progress').length,
      qualified: leadsData.filter(l => l.status === 'qualified').length,
      rejected: leadsData.filter(l => l.status === 'rejected').length,
      totalValue: leadsData
        .filter(l => l.status !== 'rejected')
        .reduce((sum, l) => sum + (l.expectedAmount * l.probability / 100), 0)
    }
    setStats(stats)
  }

  useEffect(() => {
    filterLeads()
  }, [searchTerm, filterStatus, filterSource, leads])

  const filterLeads = () => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus)
    }

    if (filterSource && filterSource !== 'all') {
      filtered = filtered.filter(lead => lead.source === filterSource)
    }

    setFilteredLeads(filtered)
    updateStats(filtered)
  }

  const handleCreateLead = async () => {
    try {
      setIsLoading(true)
      
      const newLead = {
        id: `lead-${Date.now()}`,
        ...leadForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: []
      }

      setLeads(prev => [newLead, ...prev])
      setShowCreateDialog(false)
      resetLeadForm()
      toast.success('Лід створено успішно')
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error('Помилка створення ліда')
    } finally {
      setIsLoading(false)
    }
  }

  const resetLeadForm = () => {
    setLeadForm({
      title: '',
      contactPerson: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: 'manual',
      status: 'new',
      description: '',
      expectedAmount: 0,
      probability: 0,
      assignedTo: user?.id || '',
      assignedToName: user?.fullName || '',
      nextFollowUpDate: ''
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'new': { color: 'bg-blue-100 text-blue-800', text: 'Новий' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', text: 'В роботі' },
      'qualified': { color: 'bg-green-100 text-green-800', text: 'Кваліфікований' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Відхилений' }
    }
    
    const config = statusConfig[status] || statusConfig.new
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getSourceText = (source) => {
    const sourceMap = {
      'website': 'Веб-сайт',
      'phone': 'Телефон',
      'email': 'Email',
      'social': 'Соц мережі',
      'referral': 'Рекомендація',
      'import': 'Імпорт',
      'manual': 'Вручну'
    }
    return sourceMap[source] || source
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ліди</h2>
          <p className="text-gray-600">Управління потенційними клієнтами</p>
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
                Новий лід
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Створити новий лід</DialogTitle>
              </DialogHeader>

              <LeadForm
                form={leadForm}
                setForm={setLeadForm}
                onSubmit={handleCreateLead}
                onCancel={() => {
                  setShowCreateDialog(false)
                  resetLeadForm()
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього лідів</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Нові</p>
                <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">В роботі</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Кваліфіковані</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Відхилені</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Потенційна вартість</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.totalValue).toLocaleString()} ₴
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
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
                  placeholder="Пошук лідів..."
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
                <SelectItem value="new">Нові</SelectItem>
                <SelectItem value="in_progress">В роботі</SelectItem>
                <SelectItem value="qualified">Кваліфіковані</SelectItem>
                <SelectItem value="rejected">Відхилені</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Джерело" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі джерела</SelectItem>
                <SelectItem value="website">Веб-сайт</SelectItem>
                <SelectItem value="phone">Телефон</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="referral">Рекомендація</SelectItem>
                <SelectItem value="manual">Вручну</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Лідів не знайдено</h3>
                <p className="text-gray-600">Створіть першого ліда або змініть критерії пошуку</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onViewDetails={(lead) => {
                setSelectedLead(lead)
                setShowDetailsDialog(true)
              }}
              onEdit={(lead) => {
                setSelectedLead(lead)
                setLeadForm(lead)
                setShowEditDialog(true)
              }}
              getStatusBadge={getStatusBadge}
              getSourceText={getSourceText}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Lead Card Component
function LeadCard({ lead, onViewDetails, onEdit, getStatusBadge, getSourceText }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">{lead.title}</h3>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusBadge(lead.status)}
              <Badge variant="outline" className="text-xs">
                {getSourceText(lead.source)}
              </Badge>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(lead)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(lead)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4" onClick={() => onViewDetails(lead)}>
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span>{lead.contactPerson}</span>
          </div>
          
          {lead.company && (
            <div className="flex items-center space-x-2 text-sm">
              <Building className="w-4 h-4 text-gray-400" />
              <span>{lead.company}</span>
            </div>
          )}
          
          {lead.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{lead.email}</span>
            </div>
          )}
          
          {lead.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Очікувана сума:</span>
            <span className="font-medium">
              {lead.expectedAmount.toLocaleString()} ₴
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Ймовірність:</span>
            <span className="font-medium text-green-600">
              {lead.probability}%
            </span>
          </div>
        </div>

        {lead.nextFollowUpDate && (
          <div className="mt-3 flex items-center space-x-2 text-xs text-orange-600">
            <Calendar className="w-3 h-3" />
            <span>
              Наступний контакт: {format(new Date(lead.nextFollowUpDate), 'dd MMM yyyy', { locale: uk })}
            </span>
          </div>
        )}

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>Створено: {format(new Date(lead.createdAt), 'dd MMM yyyy', { locale: uk })}</span>
          <span>Відповідальний: {lead.assignedToName}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Lead Form Component
function LeadForm({ form, setForm, onSubmit, onCancel, isLoading = false }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Назва ліда *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder="Опишіть лід коротко"
          />
        </div>
        
        <div>
          <Label htmlFor="source">Джерело</Label>
          <Select value={form.source} onValueChange={(value) => updateForm('source', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Веб-сайт</SelectItem>
              <SelectItem value="phone">Телефон</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="social">Соц мережі</SelectItem>
              <SelectItem value="referral">Рекомендація</SelectItem>
              <SelectItem value="manual">Вручну</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">Контактна особа *</Label>
          <Input
            id="contactPerson"
            value={form.contactPerson}
            onChange={(e) => updateForm('contactPerson', e.target.value)}
            placeholder="Ім'я та прізвище"
          />
        </div>
        
        <div>
          <Label htmlFor="position">Посада</Label>
          <Input
            id="position"
            value={form.position}
            onChange={(e) => updateForm('position', e.target.value)}
            placeholder="Посада контактної особи"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="contact@company.com"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            placeholder="+380671234567"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="company">Компанія</Label>
        <Input
          id="company"
          value={form.company}
          onChange={(e) => updateForm('company', e.target.value)}
          placeholder="Назва компанії"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expectedAmount">Очікувана сума (₴)</Label>
          <Input
            id="expectedAmount"
            type="number"
            value={form.expectedAmount}
            onChange={(e) => updateForm('expectedAmount', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor="probability">Ймовірність (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={form.probability}
            onChange={(e) => updateForm('probability', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor="status">Статус</Label>
          <Select value={form.status} onValueChange={(value) => updateForm('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новий</SelectItem>
              <SelectItem value="in_progress">В роботі</SelectItem>
              <SelectItem value="qualified">Кваліфікований</SelectItem>
              <SelectItem value="rejected">Відхилений</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Опис</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder="Детальний опис ліда, потреб клієнта..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="nextFollowUpDate">Дата наступного контакту</Label>
        <Input
          id="nextFollowUpDate"
          type="datetime-local"
          value={form.nextFollowUpDate}
          onChange={(e) => updateForm('nextFollowUpDate', e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
          {isLoading ? 'Створення...' : 'Створити лід'}
        </Button>
      </div>
    </div>
  )
}