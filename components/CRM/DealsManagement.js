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
  TrendingUp, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  Filter,
  Download,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PieChart,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function DealsManagement({ user }) {
  const [deals, setDeals] = useState([])
  const [filteredDeals, setFilteredDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterAssignedTo, setFilterAssignedTo] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Deal form state
  const [dealForm, setDealForm] = useState({
    title: '',
    stage: 'negotiation',
    clientType: 'individual',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    amount: 0,
    currency: 'UAH',
    probability: 50,
    expectedCloseDate: '',
    assignedTo: user?.id || '',
    assignedToName: user?.fullName || '',
    notes: '',
    tags: []
  })

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    negotiation: 0,
    proposal: 0,
    closedWon: 0,
    closedLost: 0,
    totalValue: 0,
    avgDealSize: 0,
    winRate: 0
  })

  // Mock data
  useEffect(() => {
    loadMockDeals()
  }, [])

  const loadMockDeals = () => {
    const mockDeals = [
      {
        id: 'deal-001',
        title: 'Контракт на логістичні послуги - УкрЛогістикс',
        stage: 'proposal',
        clientType: 'company',
        clientName: 'Олександр Петренко',
        clientEmail: 'o.petrenko@ukrlogistics.com',
        clientPhone: '+380671234567',
        clientCompany: 'УкрЛогістикс ТОВ',
        amount: 150000,
        currency: 'UAH',
        probability: 75,
        expectedCloseDate: '2024-12-20',
        actualCloseDate: null,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        leadId: 'lead-001',
        notes: 'Клієнт дуже зацікавлений, планує підписати договір до кінця місяця',
        tags: ['VIP', 'B2B', 'Регулярний'],
        createdAt: '2024-12-01T10:30:00Z',
        updatedAt: '2024-12-12T14:20:00Z',
        documents: [
          {
            name: 'Комерційна пропозиція',
            type: 'proposal',
            uploadedAt: '2024-12-05T10:00:00Z',
            uploadedBy: 'admin'
          },
          {
            name: 'Технічне завдання',
            type: 'other',
            uploadedAt: '2024-12-08T14:30:00Z',
            uploadedBy: 'admin'
          }
        ],
        products: [
          {
            productId: 'service-001',
            productName: 'Внутрішні перевезення',
            quantity: 1,
            unitPrice: 120000,
            totalPrice: 120000,
            discount: 0
          },
          {
            productId: 'service-002', 
            productName: 'Експрес доставка',
            quantity: 1,
            unitPrice: 30000,
            totalPrice: 30000,
            discount: 0
          }
        ]
      },
      {
        id: 'deal-002',
        title: 'Інтернет-магазин ShopUA - кур\'єрські послуги',
        stage: 'negotiation',
        clientType: 'company',
        clientName: 'Марія Іваненко',
        clientEmail: 'maria@shopua.com',
        clientPhone: '+380501234567',
        clientCompany: 'ShopUA',
        amount: 50000,
        currency: 'UAH',
        probability: 40,
        expectedCloseDate: '2024-12-25',
        actualCloseDate: null,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        leadId: 'lead-002',
        notes: 'Обговорюємо тарифи та умови доставки',
        tags: ['E-commerce', 'SMB'],
        createdAt: '2024-12-10T16:45:00Z',
        updatedAt: '2024-12-12T09:15:00Z',
        products: [
          {
            productId: 'service-003',
            productName: 'Кур\'єрська доставка по місту',
            quantity: 1,
            unitPrice: 50000,
            totalPrice: 50000,
            discount: 0
          }
        ]
      },
      {
        id: 'deal-003',
        title: 'Виробнича компанія "Успіх" - регулярні відправки',
        stage: 'invoice_sent',
        clientType: 'company',
        clientName: 'Дмитро Коваленко',
        clientEmail: 'd.kovalenko@manufacture.ua',
        clientPhone: '+380441234567',
        clientCompany: 'Виробнича компанія "Успіх"',
        amount: 300000,
        currency: 'UAH',
        probability: 90,
        expectedCloseDate: '2024-12-15',
        actualCloseDate: null,
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        leadId: 'lead-003',
        notes: 'Рахунок відправлено, очікуємо підтвердження оплати',
        tags: ['Enterprise', 'Manufacturing', 'Regular'],
        createdAt: '2024-11-20T09:15:00Z',
        updatedAt: '2024-12-11T15:30:00Z',
        products: [
          {
            productId: 'service-004',
            productName: 'Міжміські перевезення',
            quantity: 1,
            unitPrice: 200000,
            totalPrice: 200000,
            discount: 0
          },
          {
            productId: 'service-005',
            productName: 'Складські послуги',
            quantity: 1,
            unitPrice: 100000,
            totalPrice: 100000,
            discount: 0
          }
        ]
      },
      {
        id: 'deal-004',
        title: 'ІТ компанія TechSoft - доставка обладнання',
        stage: 'closed_won',
        clientType: 'company',
        clientName: 'Анна Мельник',
        clientEmail: 'a.melnyk@techsoft.ua',
        clientPhone: '+380631234567',
        clientCompany: 'TechSoft Ukraine',
        amount: 85000,
        currency: 'UAH',
        probability: 100,
        expectedCloseDate: '2024-12-01',
        actualCloseDate: '2024-12-01T18:00:00Z',
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        notes: 'Угода успішно закрита, клієнт задоволений сервісом',
        tags: ['IT', 'Closed', 'Satisfied'],
        createdAt: '2024-11-15T14:30:00Z',
        updatedAt: '2024-12-01T18:00:00Z',
        documents: [
          {
            name: 'Акт виконаних робіт',
            type: 'other',
            uploadedAt: '2024-12-01T18:00:00Z',
            uploadedBy: 'admin'
          }
        ],
        products: [
          {
            productId: 'service-006',
            productName: 'Спеціальна доставка обладнання',
            quantity: 1,
            unitPrice: 85000,
            totalPrice: 85000,
            discount: 0
          }
        ]
      },
      {
        id: 'deal-005',
        title: 'Медичний центр - доставка медпрепаратів',
        stage: 'closed_lost',
        clientType: 'company',
        clientName: 'Сергій Іванов',
        clientEmail: 's.ivanov@medcenter.ua',
        clientPhone: '+380971234567',
        clientCompany: 'Медичний центр "Здоров\'я+"',
        amount: 75000,
        currency: 'UAH',
        probability: 0,
        expectedCloseDate: '2024-11-30',
        actualCloseDate: '2024-11-30T17:00:00Z',
        assignedTo: user?.id || 'admin',
        assignedToName: user?.fullName || 'Системний Адміністратор',
        notes: 'Клієнт обрав іншого постачальника через ліцензійні вимоги',
        tags: ['Healthcare', 'Lost', 'Licensing'],
        createdAt: '2024-11-05T11:20:00Z',
        updatedAt: '2024-11-30T17:00:00Z',
        documents: [],
        products: []
      }
    ]
    
    setDeals(mockDeals)
    setFilteredDeals(mockDeals)
    updateStats(mockDeals)
  }

  const updateStats = (dealsData) => {
    const stats = {
      total: dealsData.length,
      negotiation: dealsData.filter(d => d.stage === 'negotiation').length,
      proposal: dealsData.filter(d => d.stage === 'proposal').length,
      closedWon: dealsData.filter(d => d.stage === 'closed_won').length,
      closedLost: dealsData.filter(d => d.stage === 'closed_lost').length,
      totalValue: dealsData.reduce((sum, d) => sum + d.amount, 0),
      avgDealSize: dealsData.length > 0 ? dealsData.reduce((sum, d) => sum + d.amount, 0) / dealsData.length : 0,
      winRate: dealsData.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost').length > 0 
        ? (dealsData.filter(d => d.stage === 'closed_won').length / dealsData.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost').length) * 100 
        : 0
    }
    setStats(stats)
  }

  useEffect(() => {
    filterDeals()
  }, [searchTerm, filterStage, filterAssignedTo, deals])

  const filterDeals = () => {
    let filtered = deals

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.clientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStage && filterStage !== 'all') {
      filtered = filtered.filter(deal => deal.stage === filterStage)
    }

    if (filterAssignedTo && filterAssignedTo !== 'all') {
      filtered = filtered.filter(deal => deal.assignedTo === filterAssignedTo)
    }

    setFilteredDeals(filtered)
    updateStats(filtered)
  }

  const handleCreateDeal = async () => {
    try {
      setIsLoading(true)
      
      const newDeal = {
        id: `deal-${Date.now()}`,
        ...dealForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: [],
        products: []
      }

      setDeals(prev => [newDeal, ...prev])
      setShowCreateDialog(false)
      resetDealForm()
      toast.success('Угоду створено успішно')
    } catch (error) {
      console.error('Error creating deal:', error)
      toast.error('Помилка створення угоди')
    } finally {
      setIsLoading(false)
    }
  }

  const resetDealForm = () => {
    setDealForm({
      title: '',
      stage: 'negotiation',
      clientType: 'individual',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      amount: 0,
      currency: 'UAH',
      probability: 50,
      expectedCloseDate: '',
      assignedTo: user?.id || '',
      assignedToName: user?.fullName || '',
      notes: '',
      tags: []
    })
  }

  const getStageBadge = (stage) => {
    const stageConfig = {
      'negotiation': { color: 'bg-yellow-100 text-yellow-800', text: 'Переговори' },
      'proposal': { color: 'bg-blue-100 text-blue-800', text: 'Пропозиція' },
      'invoice_sent': { color: 'bg-purple-100 text-purple-800', text: 'Рахунок відправлено' },
      'payment_pending': { color: 'bg-orange-100 text-orange-800', text: 'Очікування оплати' },
      'closed_won': { color: 'bg-green-100 text-green-800', text: 'Закрито (виграно)' },
      'closed_lost': { color: 'bg-red-100 text-red-800', text: 'Закрито (програно)' }
    }
    
    const config = stageConfig[stage] || stageConfig.negotiation
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'negotiation': return <Clock className="w-4 h-4" />
      case 'proposal': return <Eye className="w-4 h-4" />
      case 'invoice_sent': return <Mail className="w-4 h-4" />
      case 'payment_pending': return <AlertCircle className="w-4 h-4" />
      case 'closed_won': return <CheckCircle className="w-4 h-4" />
      case 'closed_lost': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Угоди</h2>
          <p className="text-gray-600">Управління продажними можливостями</p>
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
                Нова угода
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Створити нову угоду</DialogTitle>
              </DialogHeader>

              <DealForm
                form={dealForm}
                setForm={setDealForm}
                onSubmit={handleCreateDeal}
                onCancel={() => {
                  setShowCreateDialog(false)
                  resetDealForm()
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього угод</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Переговори</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.negotiation}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Пропозиції</p>
                <p className="text-2xl font-bold text-blue-600">{stats.proposal}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Виграні</p>
                <p className="text-2xl font-bold text-green-600">{stats.closedWon}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Програні</p>
                <p className="text-2xl font-bold text-red-600">{stats.closedLost}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальна вартість</p>
                <p className="text-xl font-bold text-purple-600">
                  {Math.round(stats.totalValue).toLocaleString()} ₴
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Середня угода</p>
                <p className="text-xl font-bold text-indigo-600">
                  {Math.round(stats.avgDealSize).toLocaleString()} ₴
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">% виграшу</p>
                <p className="text-2xl font-bold text-green-500">{Math.round(stats.winRate)}%</p>
              </div>
              <PieChart className="w-8 h-8 text-green-500" />
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
                  placeholder="Пошук угод..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Етап" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі етапи</SelectItem>
                <SelectItem value="negotiation">Перемовини</SelectItem>
                <SelectItem value="proposal">Пропозиція</SelectItem>
                <SelectItem value="invoice_sent">Рахунок відправлено</SelectItem>
                <SelectItem value="payment_pending">Очікування оплати</SelectItem>
                <SelectItem value="closed_won">Виграні</SelectItem>
                <SelectItem value="closed_lost">Програні</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDeals.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Угод не знайдено</h3>
                <p className="text-gray-600">Створіть першу угоду або змініть критерії пошуку</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredDeals.map(deal => (
            <DealCard
              key={deal.id}
              deal={deal}
              onViewDetails={(deal) => {
                setSelectedDeal(deal)
                setShowDetailsDialog(true)
              }}
              onEdit={(deal) => {
                setSelectedDeal(deal)
                setDealForm(deal)
                setShowEditDialog(true)
              }}
              getStageBadge={getStageBadge}
              getStageIcon={getStageIcon}
            />
          ))
        )}
      </div>

      {/* Deal Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати угоду</DialogTitle>
          </DialogHeader>

          <DealForm
            form={dealForm}
            setForm={setDealForm}
            onSubmit={async () => {
              try {
                setIsLoading(true)
                
                const updatedDeal = {
                  ...selectedDeal,
                  ...dealForm,
                  updatedAt: new Date().toISOString()
                }

                setDeals(prev => prev.map(deal => 
                  deal.id === selectedDeal.id ? updatedDeal : deal
                ))
                setShowEditDialog(false)
                resetDealForm()
                toast.success('Угоду оновлено успішно')
              } catch (error) {
                console.error('Error updating deal:', error)
                toast.error('Помилка оновлення угоди')
              } finally {
                setIsLoading(false)
              }
            }}
            onCancel={() => {
              setShowEditDialog(false)
              resetDealForm()
            }}
            isLoading={isLoading}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі угоди</DialogTitle>
          </DialogHeader>

          {selectedDeal && (
            <DealDetails deal={selectedDeal} getStageBadge={getStageBadge} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Deal Card Component
function DealCard({ deal, onViewDetails, onEdit, getStageBadge, getStageIcon }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">{deal.title}</h3>
            <div className="flex items-center space-x-2 mb-2">
              {getStageBadge(deal.stage)}
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {getStageIcon(deal.stage)}
                <span>{deal.probability}%</span>
              </div>
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(deal)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(deal)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4" onClick={() => onViewDetails(deal)}>
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{deal.clientName}</span>
          </div>
          
          {deal.clientCompany && (
            <div className="flex items-center space-x-2 text-sm">
              <Building className="w-4 h-4 text-gray-400" />
              <span>{deal.clientCompany}</span>
            </div>
          )}
          
          {deal.clientEmail && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{deal.clientEmail}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Сума угоди:</span>
            <span className="font-bold text-lg">
              {deal.amount.toLocaleString()} ₴
            </span>
          </div>
          
          {deal.products && deal.products.length > 0 && (
            <div className="text-xs text-gray-500">
              {deal.products.length} послуг в угоді
            </div>
          )}
        </div>

        {deal.expectedCloseDate && (
          <div className="flex items-center space-x-2 text-xs text-orange-600 mb-2">
            <Calendar className="w-3 h-3" />
            <span>
              Очікується: {format(new Date(deal.expectedCloseDate), 'dd MMM yyyy', { locale: uk })}
            </span>
          </div>
        )}

        <div className="flex justify-between text-xs text-gray-500">
          <span>Створено: {format(new Date(deal.createdAt), 'dd MMM yyyy', { locale: uk })}</span>
          <span>Відповідальний: {deal.assignedToName}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Deal Form Component
function DealForm({ form, setForm, onSubmit, onCancel, isLoading = false, isEdit = false }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Назва угоди *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder="Коротка назва угоди"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stage">Етап угоди</Label>
          <Select value={form.stage} onValueChange={(value) => updateForm('stage', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negotiation">Перемовини</SelectItem>
              <SelectItem value="proposal">Пропозиція</SelectItem>
              <SelectItem value="invoice_sent">Рахунок відправлено</SelectItem>
              <SelectItem value="payment_pending">Очікування оплати</SelectItem>
              <SelectItem value="closed_won">Виграна</SelectItem>
              <SelectItem value="closed_lost">Програна</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="clientType">Тип клієнта</Label>
          <Select value={form.clientType} onValueChange={(value) => updateForm('clientType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Фізична особа</SelectItem>
              <SelectItem value="company">Юридична особа</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Клієнт *</Label>
          <Input
            id="clientName"
            value={form.clientName}
            onChange={(e) => updateForm('clientName', e.target.value)}
            placeholder="Ім'я клієнта"
          />
        </div>
        
        <div>
          <Label htmlFor="clientCompany">Компанія</Label>
          <Input
            id="clientCompany"
            value={form.clientCompany}
            onChange={(e) => updateForm('clientCompany', e.target.value)}
            placeholder="Назва компанії"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            type="email"
            value={form.clientEmail}
            onChange={(e) => updateForm('clientEmail', e.target.value)}
            placeholder="client@company.com"
          />
        </div>
        
        <div>
          <Label htmlFor="clientPhone">Телефон</Label>
          <Input
            id="clientPhone"
            value={form.clientPhone}
            onChange={(e) => updateForm('clientPhone', e.target.value)}
            placeholder="+380671234567"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Сума (₴) *</Label>
          <Input
            id="amount"
            type="number"
            value={form.amount}
            onChange={(e) => updateForm('amount', parseFloat(e.target.value) || 0)}
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
            placeholder="50"
          />
        </div>
        
        <div>
          <Label htmlFor="expectedCloseDate">Очікувана дата закриття</Label>
          <Input
            id="expectedCloseDate"
            type="date"
            value={form.expectedCloseDate}
            onChange={(e) => updateForm('expectedCloseDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Примітки</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => updateForm('notes', e.target.value)}
          placeholder="Додаткова інформація про угоду..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
          {isLoading ? (isEdit ? 'Оновлення...' : 'Створення...') : (isEdit ? 'Оновити угоду' : 'Створити угоду')}
        </Button>
      </div>
    </div>
  )
}
// Deal Details Component
function DealDetails({ deal, getStageBadge }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{deal.title}</h3>
          <div className="flex items-center space-x-3">
            {getStageBadge(deal.stage)}
            <span className="text-sm text-gray-500">
              Ймовірність: {deal.probability}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">
            {deal.amount.toLocaleString()} ₴
          </p>
          <p className="text-sm text-gray-500">{deal.currency}</p>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Інформація про клієнта</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Ім'я клієнта</Label>
              <p className="text-gray-900">{deal.clientName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Тип клієнта</Label>
              <p className="text-gray-900">
                {deal.clientType === 'individual' ? 'Фізична особа' : 'Юридична особа'}
              </p>
            </div>
          </div>
          
          {deal.clientCompany && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Компанія</Label>
              <p className="text-gray-900">{deal.clientCompany}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {deal.clientEmail && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="text-gray-900">{deal.clientEmail}</p>
              </div>
            )}
            {deal.clientPhone && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Телефон</Label>
                <p className="text-gray-900">{deal.clientPhone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Деталі угоди</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Відповідальний</Label>
              <p className="text-gray-900">{deal.assignedToName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Створено</Label>
              <p className="text-gray-900">
                {format(new Date(deal.createdAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {deal.expectedCloseDate && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Очікувана дата закриття</Label>
                <p className="text-gray-900">
                  {format(new Date(deal.expectedCloseDate), 'dd MMMM yyyy', { locale: uk })}
                </p>
              </div>
            )}
            {deal.actualCloseDate && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Фактична дата закриття</Label>
                <p className="text-gray-900">
                  {format(new Date(deal.actualCloseDate), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Останнє оновлення</Label>
            <p className="text-gray-900">
              {format(new Date(deal.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products/Services */}
      {deal.products && deal.products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Послуги в угоді</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deal.products.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.productName}</p>
                    <p className="text-sm text-gray-600">
                      Кількість: {product.quantity} × {product.unitPrice.toLocaleString()} ₴
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {product.totalPrice.toLocaleString()} ₴
                    </p>
                    {product.discount > 0 && (
                      <p className="text-sm text-green-600">
                        Знижка: {product.discount}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Загальна сума:</span>
                  <span className="font-bold text-xl text-green-600">
                    {deal.amount.toLocaleString()} ₴
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {deal.documents && deal.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Документи</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deal.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">
                      Завантажено: {format(new Date(doc.uploadedAt), 'dd MMM yyyy, HH:mm', { locale: uk })}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {doc.type === 'proposal' ? 'Пропозиція' :
                     doc.type === 'contract' ? 'Договір' :
                     doc.type === 'invoice' ? 'Рахунок' : 'Інше'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {deal.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Примітки</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Теги</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {deal.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}