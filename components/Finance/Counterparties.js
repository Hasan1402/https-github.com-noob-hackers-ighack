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
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Building,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  History,
  Filter,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

export default function Counterparties({ user }) {
  const [counterparties, setCounterparties] = useState([])
  const [filteredCounterparties, setFilteredCounterparties] = useState([])
  const [selectedCounterparty, setSelectedCounterparty] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Counterparty form state
  const [counterpartyForm, setCounterpartyForm] = useState({
    type: 'client',
    name: '',
    fullName: '',
    code: '',
    taxNumber: '',
    vatNumber: '',
    registrationNumber: '',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'Україна'
    },
    contacts: [{
      name: '',
      position: '',
      phone: '',
      email: ''
    }],
    bankAccounts: [{
      bank: '',
      account: '',
      swift: '',
      iban: ''
    }],
    paymentTerms: 0,
    creditLimit: 0,
    discount: 0,
    notes: ''
  })

  // Mock counterparties data
  const mockCounterparties = [
    {
      id: '1',
      type: 'client',
      name: 'ТОВ "Розетка"',
      fullName: 'Товариство з обмеженою відповідальністю "Розетка"',
      code: 'ROZETKA001',
      taxNumber: '12345678',
      vatNumber: 'UA123456789',
      registrationNumber: '1234567890123',
      address: {
        street: 'вул. Степана Бандери, 20',
        city: 'Київ',
        region: 'Київська область',
        postalCode: '04073',
        country: 'Україна'
      },
      contacts: [
        {
          name: 'Іван Петренко',
          position: 'Менеджер з закупівель',
          phone: '+380501234567',
          email: 'ivan.petrenko@rozetka.com.ua'
        }
      ],
      bankAccounts: [
        {
          bank: 'ПриватБанк',
          account: '26001234567890',
          swift: 'PBANUA2X',
          iban: 'UA213223130000026001234567890'
        }
      ],
      paymentTerms: 14,
      creditLimit: 500000,
      discount: 5,
      totalTransactions: 156,
      totalAmount: 2450000,
      lastTransaction: '2024-12-10',
      status: 'active',
      notes: 'Великий клієнт. Пріоритетне обслуговування.'
    },
    {
      id: '2',
      type: 'supplier',
      name: 'ПП "Логістик Плюс"',
      fullName: 'Приватне підприємство "Логістик Плюс"',
      code: 'LOGISTIC001',
      taxNumber: '87654321',
      vatNumber: 'UA987654321',
      registrationNumber: '9876543210987',
      address: {
        street: 'проспект Перемоги, 15',
        city: 'Дніпро',
        region: 'Дніпропетровська область',
        postalCode: '49000',
        country: 'Україна'
      },
      contacts: [
        {
          name: 'Марія Коваленко',
          position: 'Комерційний директор',
          phone: '+380671234567',
          email: 'maria@logistic-plus.ua'
        }
      ],
      bankAccounts: [
        {
          bank: 'Ощадбанк',
          account: '35001234567890',
          swift: 'OSCHUS33',
          iban: 'UA353515100000035001234567890'
        }
      ],
      paymentTerms: 30,
      creditLimit: 0,
      discount: 0,
      totalTransactions: 89,
      totalAmount: 1250000,
      lastTransaction: '2024-12-08',
      status: 'active',
      notes: 'Надійний постачальник логістичних послуг.'
    },
    {
      id: '3',
      type: 'client',
      name: 'АТ "Фокстрот"',
      fullName: 'Акціонерне товариство "Фокстрот"',
      code: 'FOXTROT001',
      taxNumber: '11223344',
      vatNumber: 'UA112233445',
      registrationNumber: '1122334455667',
      address: {
        street: 'вул. Антоновича, 44',
        city: 'Київ',
        region: 'Київська область',
        postalCode: '03150',
        country: 'Україна'
      },
      contacts: [
        {
          name: 'Олег Сидоренко',
          position: 'Керівник відділу логістики',
          phone: '+380631234567',
          email: 'oleg.sidorenko@foxtrot.ua'
        }
      ],
      bankAccounts: [
        {
          bank: 'ПУМБ',
          account: '26007654321098',
          swift: 'PUMBUAUK',
          iban: 'UA213348510000026007654321098'
        }
      ],
      paymentTerms: 21,
      creditLimit: 800000,
      discount: 7,
      totalTransactions: 203,
      totalAmount: 3560000,
      lastTransaction: '2024-12-12',
      status: 'active',
      notes: 'Стратегічний партнер. VIP клієнт.'
    },
    {
      id: '4',
      type: 'supplier',
      name: 'ТОВ "УкрПак"',
      fullName: 'Товариство з обмеженою відповідальністю "УкрПак"',
      code: 'UKRPAK001',
      taxNumber: '55667788',
      vatNumber: 'UA556677889',
      registrationNumber: '5566778899001',
      address: {
        street: 'вул. Промислова, 12',
        city: 'Харків',
        region: 'Харківська область',
        postalCode: '61000',
        country: 'Україна'
      },
      contacts: [
        {
          name: 'Тетяна Іваненко',
          position: 'Менеджер з продажу',
          phone: '+380571234567',
          email: 'tetiana@ukrpak.ua'
        }
      ],
      bankAccounts: [
        {
          bank: 'Райффайзен Банк Аваль',
          account: '26008765432109',
          swift: 'AVALUAUK',
          iban: 'UA213808605000026008765432109'
        }
      ],
      paymentTerms: 10,
      creditLimit: 0,
      discount: 3,
      totalTransactions: 67,
      totalAmount: 890000,
      lastTransaction: '2024-12-05',
      status: 'active',
      notes: 'Постачальник упаковальних матеріалів.'
    }
  ]

  useEffect(() => {
    setCounterparties(mockCounterparties)
    setFilteredCounterparties(mockCounterparties)
  }, [])

  useEffect(() => {
    filterCounterparties()
  }, [searchTerm, filterType, counterparties])

  const filterCounterparties = () => {
    let filtered = counterparties

    if (searchTerm) {
      filtered = filtered.filter(cp => 
        cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cp.taxNumber.includes(searchTerm) ||
        cp.contacts.some(contact => 
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(cp => cp.type === filterType)
    }

    setFilteredCounterparties(filtered)
  }

  const handleCreateCounterparty = async () => {
    try {
      const newCounterparty = {
        id: Date.now().toString(),
        ...counterpartyForm,
        totalTransactions: 0,
        totalAmount: 0,
        lastTransaction: null,
        status: 'active'
      }

      setCounterparties(prev => [newCounterparty, ...prev])
      setShowAddDialog(false)
      resetCounterpartyForm()
      toast.success('Контрагента створено успішно')
    } catch (error) {
      console.error('Error creating counterparty:', error)
      toast.error('Помилка створення контрагента')
    }
  }

  const resetCounterpartyForm = () => {
    setCounterpartyForm({
      type: 'client',
      name: '',
      fullName: '',
      code: '',
      taxNumber: '',
      vatNumber: '',
      registrationNumber: '',
      address: {
        street: '',
        city: '',
        region: '',
        postalCode: '',
        country: 'Україна'
      },
      contacts: [{
        name: '',
        position: '',
        phone: '',
        email: ''
      }],
      bankAccounts: [{
        bank: '',
        account: '',
        swift: '',
        iban: ''
      }],
      paymentTerms: 0,
      creditLimit: 0,
      discount: 0,
      notes: ''
    })
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800'
      case 'supplier': return 'bg-green-100 text-green-800'
      case 'both': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'client': return 'Клієнт'
      case 'supplier': return 'Постачальник'
      case 'both': return 'Клієнт/Постачальник'
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Контрагенти</h2>
          <p className="text-gray-600">Управління клієнтами та постачальниками</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Додати контрагента
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новий контрагент</DialogTitle>
            </DialogHeader>

            <CounterpartyForm
              form={counterpartyForm}
              setForm={setCounterpartyForm}
              onSubmit={handleCreateCounterparty}
              onCancel={() => {
                setShowAddDialog(false)
                resetCounterpartyForm()
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
                  placeholder="Пошук контрагентів..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Тип контрагента" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі типи</SelectItem>
                <SelectItem value="client">Клієнти</SelectItem>
                <SelectItem value="supplier">Постачальники</SelectItem>
                <SelectItem value="both">Клієнт/Постачальник</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього контрагентів</p>
                <p className="text-2xl font-bold text-blue-600">{counterparties.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Клієнти</p>
                <p className="text-2xl font-bold text-green-600">
                  {counterparties.filter(cp => cp.type === 'client').length}
                </p>
              </div>
              <Building className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Постачальники</p>
                <p className="text-2xl font-bold text-purple-600">
                  {counterparties.filter(cp => cp.type === 'supplier').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальний оборот</p>
                <p className="text-2xl font-bold text-orange-600">
                  {counterparties.reduce((sum, cp) => sum + (cp.totalAmount || 0), 0).toLocaleString()} грн
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Counterparties List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
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
        ) : filteredCounterparties.length === 0 ? (
          <div className="col-span-2">
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Контрагентів не знайдено</h3>
                <p className="text-gray-600">Спробуйте змінити критерії пошуку або додайте нового контрагента</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredCounterparties.map(counterparty => (
            <CounterpartyCard
              key={counterparty.id}
              counterparty={counterparty}
              onViewDetails={(cp) => {
                setSelectedCounterparty(cp)
                setShowDetailsDialog(true)
              }}
              onEdit={(cp) => {
                setSelectedCounterparty(cp)
                setCounterpartyForm({
                  type: cp.type,
                  name: cp.name,
                  fullName: cp.fullName,
                  code: cp.code,
                  taxNumber: cp.taxNumber,
                  vatNumber: cp.vatNumber,
                  registrationNumber: cp.registrationNumber,
                  address: cp.address,
                  contacts: cp.contacts,
                  bankAccounts: cp.bankAccounts,
                  paymentTerms: cp.paymentTerms,
                  creditLimit: cp.creditLimit,
                  discount: cp.discount,
                  notes: cp.notes
                })
                setShowEditDialog(true)
              }}
              getTypeColor={getTypeColor}
              getTypeText={getTypeText}
            />
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагування контрагента</DialogTitle>
          </DialogHeader>

          <CounterpartyForm
            form={counterpartyForm}
            setForm={setCounterpartyForm}
            onSubmit={() => {
              toast.success('Контрагента оновлено успішно')
              setShowEditDialog(false)
              resetCounterpartyForm()
            }}
            onCancel={() => {
              setShowEditDialog(false)
              resetCounterpartyForm()
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі контрагента</DialogTitle>
          </DialogHeader>

          {selectedCounterparty && (
            <CounterpartyDetails 
              counterparty={selectedCounterparty}
              getTypeColor={getTypeColor}
              getTypeText={getTypeText}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Counterparty Card Component
function CounterpartyCard({ counterparty, onViewDetails, onEdit, getTypeColor, getTypeText }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                {counterparty.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                {counterparty.name}
              </h3>
              <Badge className={getTypeColor(counterparty.type)}>
                {getTypeText(counterparty.type)}
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
                  onViewDetails(counterparty)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(counterparty)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2" onClick={() => onViewDetails(counterparty)}>
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2" />
            {counterparty.code}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            {counterparty.contacts[0]?.phone || 'Не вказано'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            {counterparty.contacts[0]?.email || 'Не вказано'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {counterparty.address.city}
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {counterparty.totalTransactions}
              </div>
              <div className="text-xs text-gray-500">Операцій</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">
                {counterparty.totalAmount?.toLocaleString()} грн
              </div>
              <div className="text-xs text-gray-500">Загальна сума</div>
            </div>
            
            {counterparty.creditLimit > 0 && (
              <div className="text-center">
                <div className="text-sm font-medium text-blue-600">
                  {counterparty.creditLimit.toLocaleString()} грн
                </div>
                <div className="text-xs text-gray-500">Кредит-ліміт</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Counterparty Form Component
function CounterpartyForm({ form, setForm, onSubmit, onCancel, isEdit = false }) {
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

  const updateArrayField = (field, index, subField, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }))
  }

  const addContact = () => {
    setForm(prev => ({
      ...prev,
      contacts: [...prev.contacts, { name: '', position: '', phone: '', email: '' }]
    }))
  }

  const addBankAccount = () => {
    setForm(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, { bank: '', account: '', swift: '', iban: '' }]
    }))
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Основні дані</TabsTrigger>
        <TabsTrigger value="address">Адреса</TabsTrigger>
        <TabsTrigger value="contacts">Контакти</TabsTrigger>
        <TabsTrigger value="financial">Фінанси</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <Label htmlFor="type">Тип контрагента *</Label>
          <Select value={form.type} onValueChange={(value) => updateForm('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Клієнт</SelectItem>
              <SelectItem value="supplier">Постачальник</SelectItem>
              <SelectItem value="both">Клієнт/Постачальник</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="name">Скорочена назва *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder='ТОВ "Розетка"'
          />
        </div>

        <div>
          <Label htmlFor="fullName">Повна назва</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(e) => updateForm('fullName', e.target.value)}
            placeholder='Товариство з обмеженою відповідальністю "Розетка"'
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Код контрагента *</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => updateForm('code', e.target.value)}
              placeholder="ROZETKA001"
            />
          </div>
          <div>
            <Label htmlFor="taxNumber">Податковий номер</Label>
            <Input
              id="taxNumber"
              value={form.taxNumber}
              onChange={(e) => updateForm('taxNumber', e.target.value)}
              placeholder="12345678"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vatNumber">ПДВ номер</Label>
            <Input
              id="vatNumber"
              value={form.vatNumber}
              onChange={(e) => updateForm('vatNumber', e.target.value)}
              placeholder="UA123456789"
            />
          </div>
          <div>
            <Label htmlFor="registrationNumber">Реєстраційний номер</Label>
            <Input
              id="registrationNumber"
              value={form.registrationNumber}
              onChange={(e) => updateForm('registrationNumber', e.target.value)}
              placeholder="1234567890123"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="address" className="space-y-4">
        <div>
          <Label htmlFor="street">Адреса *</Label>
          <Input
            id="street"
            value={form.address.street}
            onChange={(e) => updateForm('address.street', e.target.value)}
            placeholder="вул. Степана Бандери, 20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Місто *</Label>
            <Input
              id="city"
              value={form.address.city}
              onChange={(e) => updateForm('address.city', e.target.value)}
              placeholder="Київ"
            />
          </div>
          <div>
            <Label htmlFor="region">Область</Label>
            <Input
              id="region"
              value={form.address.region}
              onChange={(e) => updateForm('address.region', e.target.value)}
              placeholder="Київська область"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode">Поштовий індекс</Label>
            <Input
              id="postalCode"
              value={form.address.postalCode}
              onChange={(e) => updateForm('address.postalCode', e.target.value)}
              placeholder="04073"
            />
          </div>
          <div>
            <Label htmlFor="country">Країна</Label>
            <Input
              id="country"
              value={form.address.country}
              onChange={(e) => updateForm('address.country', e.target.value)}
              placeholder="Україна"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Контактні особи</h4>
          <Button type="button" variant="outline" size="sm" onClick={addContact}>
            <Plus className="w-4 h-4 mr-2" />
            Додати контакт
          </Button>
        </div>

        {form.contacts.map((contact, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ім'я</Label>
                <Input
                  value={contact.name}
                  onChange={(e) => updateArrayField('contacts', index, 'name', e.target.value)}
                  placeholder="Іван Петренко"
                />
              </div>
              <div>
                <Label>Посада</Label>
                <Input
                  value={contact.position}
                  onChange={(e) => updateArrayField('contacts', index, 'position', e.target.value)}
                  placeholder="Менеджер з закупівель"
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={contact.phone}
                  onChange={(e) => updateArrayField('contacts', index, 'phone', e.target.value)}
                  placeholder="+380501234567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={contact.email}
                  onChange={(e) => updateArrayField('contacts', index, 'email', e.target.value)}
                  placeholder="ivan@company.com"
                />
              </div>
            </div>
          </Card>
        ))}

        <div className="flex justify-between items-center mt-6">
          <h4 className="font-medium">Банківські рахунки</h4>
          <Button type="button" variant="outline" size="sm" onClick={addBankAccount}>
            <Plus className="w-4 h-4 mr-2" />
            Додати рахунок
          </Button>
        </div>

        {form.bankAccounts.map((account, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Банк</Label>
                <Input
                  value={account.bank}
                  onChange={(e) => updateArrayField('bankAccounts', index, 'bank', e.target.value)}
                  placeholder="ПриватБанк"
                />
              </div>
              <div>
                <Label>Номер рахунку</Label>
                <Input
                  value={account.account}
                  onChange={(e) => updateArrayField('bankAccounts', index, 'account', e.target.value)}
                  placeholder="26001234567890"
                />
              </div>
              <div>
                <Label>SWIFT код</Label>
                <Input
                  value={account.swift}
                  onChange={(e) => updateArrayField('bankAccounts', index, 'swift', e.target.value)}
                  placeholder="PBANUA2X"
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input
                  value={account.iban}
                  onChange={(e) => updateArrayField('bankAccounts', index, 'iban', e.target.value)}
                  placeholder="UA213223130000026001234567890"
                />
              </div>
            </div>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="paymentTerms">Умови платежу (дні)</Label>
            <Input
              id="paymentTerms"
              type="number"
              value={form.paymentTerms}
              onChange={(e) => updateForm('paymentTerms', parseInt(e.target.value) || 0)}
              placeholder="14"
            />
          </div>
          <div>
            <Label htmlFor="creditLimit">Кредитний ліміт (грн)</Label>
            <Input
              id="creditLimit"
              type="number"
              value={form.creditLimit}
              onChange={(e) => updateForm('creditLimit', parseInt(e.target.value) || 0)}
              placeholder="500000"
            />
          </div>
          <div>
            <Label htmlFor="discount">Знижка (%)</Label>
            <Input
              id="discount"
              type="number"
              value={form.discount}
              onChange={(e) => updateForm('discount', parseInt(e.target.value) || 0)}
              placeholder="5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Додаткові примітки</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            placeholder="Додаткова інформація про контрагента"
            rows={4}
          />
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">
          {isEdit ? 'Оновити' : 'Створити'} контрагента
        </Button>
      </div>
    </Tabs>
  )
}

// Counterparty Details Component
function CounterpartyDetails({ counterparty, getTypeColor, getTypeText }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Огляд</TabsTrigger>
        <TabsTrigger value="contacts">Контакти</TabsTrigger>
        <TabsTrigger value="financial">Фінанси</TabsTrigger>
        <TabsTrigger value="history">Історія</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Основна інформація</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Тип:</span>
                <Badge className={getTypeColor(counterparty.type)}>
                  {getTypeText(counterparty.type)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Код:</span>
                <span>{counterparty.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Податковий номер:</span>
                <span>{counterparty.taxNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ПДВ номер:</span>
                <span>{counterparty.vatNumber}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Адреса</h4>
            <div className="text-sm text-gray-700">
              <p>{counterparty.address.street}</p>
              <p>{counterparty.address.city}, {counterparty.address.region}</p>
              <p>{counterparty.address.postalCode}, {counterparty.address.country}</p>
            </div>
          </div>
        </div>

        {counterparty.notes && (
          <div>
            <h4 className="font-medium mb-3">Примітки</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">{counterparty.notes}</p>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4">
        {counterparty.contacts.map((contact, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">{contact.name}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-gray-400" />
                  {contact.position}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {contact.phone}
                </div>
                <div className="flex items-center col-span-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {contact.email}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Умови співпраці</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Умови платежу:</span>
                <span>{counterparty.paymentTerms} днів</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Кредитний ліміт:</span>
                <span>{counterparty.creditLimit.toLocaleString()} грн</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Знижка:</span>
                <span>{counterparty.discount}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Статистика</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Всього операцій:</span>
                <span>{counterparty.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Загальна сума:</span>
                <span className="font-medium">{counterparty.totalAmount?.toLocaleString()} грн</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Остання операція:</span>
                <span>{counterparty.lastTransaction}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Банківські рахунки</h4>
          {counterparty.bankAccounts.map((account, index) => (
            <Card key={index} className="mb-2">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Банк: </span>
                    <span className="font-medium">{account.bank}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Рахунок: </span>
                    <span className="font-mono">{account.account}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SWIFT: </span>
                    <span className="font-mono">{account.swift}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">IBAN: </span>
                    <span className="font-mono text-xs">{account.iban}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="history">
        <div className="text-center py-8">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Історія операцій</h3>
          <p className="text-gray-600">Історія взаємодії з контрагентом буде відображатися тут</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}