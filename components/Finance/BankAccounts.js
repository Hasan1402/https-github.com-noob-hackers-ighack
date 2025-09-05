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
  CreditCard, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar as CalendarIcon,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Building2,
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Wallet,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function BankAccounts({ user }) {
  const [accounts, setAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCurrency, setFilterCurrency] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Bank account form state
  const [accountForm, setAccountForm] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    bankCode: '',
    bankAddress: '',
    swift: '',
    iban: '',
    currency: 'UAH',
    accountType: 'current',
    balance: 0,
    creditLimit: 0,
    overdraftLimit: 0,
    interestRate: 0,
    isActive: true,
    isDefault: false,
    description: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  })

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    date: new Date(),
    type: 'income',
    amount: 0,
    description: '',
    reference: '',
    counterparty: '',
    category: 'Доходи від основної діяльності',
    status: 'pending'
  })

  // Mock bank accounts
  const mockAccounts = [
    {
      id: '1',
      accountNumber: '26001234567890',
      accountName: 'Основний поточний рахунок',
      bankName: 'АТ "ПриватБанк"',
      bankCode: '305299',
      bankAddress: 'м. Київ, вул. Грушевського, 1Д',
      swift: 'PBANUA2X',
      iban: 'UA213223130000026001234567890',
      currency: 'UAH',
      accountType: 'current',
      balance: 2450000,
      creditLimit: 0,
      overdraftLimit: 100000,
      interestRate: 0.5,
      isActive: true,
      isDefault: true,
      lastTransactionDate: '2024-12-12',
      totalTransactions: 156,
      monthlyTurnover: 5600000,
      description: 'Основний операційний рахунок для поточної діяльності',
      contactPerson: 'Марія Коваленко',
      contactPhone: '+380443639999',
      contactEmail: 'maria.kovalenko@privatbank.ua',
      createdDate: '2023-05-15'
    },
    {
      id: '2',
      accountNumber: '35001876543210',
      accountName: 'Валютний рахунок USD',
      bankName: 'АТ "Ощадбанк"',
      bankCode: '300465',
      bankAddress: 'м. Київ, вул. Госпітальна, 10/12',
      swift: 'OSCHUS33',
      iban: 'UA353515100000035001876543210',
      currency: 'USD',
      accountType: 'current',
      balance: 45000,
      creditLimit: 0,
      overdraftLimit: 0,
      interestRate: 1.2,
      isActive: true,
      isDefault: false,
      lastTransactionDate: '2024-12-10',
      totalTransactions: 89,
      monthlyTurnover: 125000,
      description: 'Валютний рахунок для міжнародних операцій',
      contactPerson: 'Олег Петренко',
      contactPhone: '+380443939393',
      contactEmail: 'oleg.petrenko@oschadbank.ua',
      createdDate: '2023-08-20'
    },
    {
      id: '3',
      accountNumber: '26004567890123',
      accountName: 'Депозитний рахунок',
      bankName: 'АТ "ПУМБ"',
      bankCode: '334851',
      bankAddress: 'м. Київ, бульв. Дружби Народів, 38',
      swift: 'PUMBUAUK',
      iban: 'UA213348510000026004567890123',
      currency: 'UAH',
      accountType: 'deposit',
      balance: 1500000,
      creditLimit: 0,
      overdraftLimit: 0,
      interestRate: 12.5,
      isActive: true,
      isDefault: false,
      lastTransactionDate: '2024-12-01',
      totalTransactions: 12,
      monthlyTurnover: 150000,
      description: 'Строковий депозит на 12 місяців',
      contactPerson: 'Анна Сидоренко',
      contactPhone: '+380445854545',
      contactEmail: 'anna.sidorenko@pumb.ua',
      createdDate: '2024-01-15',
      maturityDate: '2025-01-15'
    },
    {
      id: '4',
      accountNumber: '26008765432109',
      accountName: 'Зарплатний рахунок',
      bankName: 'АБ "Укргазбанк"',
      bankCode: '320478',
      bankAddress: 'м. Київ, вул. Кудрявська, 22',
      swift: 'UGASUA2K',
      iban: 'UA213204780000026008765432109',
      currency: 'UAH',
      accountType: 'salary',
      balance: 890000,
      creditLimit: 0,
      overdraftLimit: 50000,
      interestRate: 2.0,
      isActive: true,
      isDefault: false,
      lastTransactionDate: '2024-12-11',
      totalTransactions: 234,
      monthlyTurnover: 2450000,
      description: 'Спеціальний рахунок для виплати заробітної плати',
      contactPerson: 'Дмитро Іваненко',
      contactPhone: '+380445005000',
      contactEmail: 'dmitriy.ivanenko@ukrgasbank.com',
      createdDate: '2023-03-10'
    }
  ]

  // Mock transactions
  const mockTransactions = [
    {
      id: 'TXN-001',
      accountId: '1',
      date: '2024-12-12',
      type: 'income',
      amount: 125000,
      description: 'Оплата від ТОВ "Розетка" за послуги доставки',
      reference: 'INV-2024-1205',
      counterparty: 'ТОВ "Розетка"',
      category: 'Доходи від основної діяльності',
      status: 'completed',
      balanceAfter: 2450000
    },
    {
      id: 'TXN-002',
      accountId: '1',
      date: '2024-12-11',
      type: 'expense',
      amount: 450000,
      description: 'Виплата заробітної плати співробітникам',
      reference: 'PAY-2024-11',
      counterparty: 'Співробітники',
      category: 'Витрати на персонал',
      status: 'completed',
      balanceAfter: 2325000
    },
    {
      id: 'TXN-003',
      accountId: '1',
      date: '2024-12-10',
      type: 'expense',
      amount: 85000,
      description: 'Закупівля палива для автопарку',
      reference: 'FUEL-2024-345',
      counterparty: 'ТОВ "Укрнафта"',
      category: 'Операційні витрати',
      status: 'completed',
      balanceAfter: 2775000
    },
    {
      id: 'TXN-004',
      accountId: '2',
      date: '2024-12-10',
      type: 'income',
      amount: 15000,
      description: 'Надходження валютної виручки',
      reference: 'FX-2024-089',
      counterparty: 'International Logistics Ltd',
      category: 'Валютні операції',
      status: 'completed',
      balanceAfter: 45000
    }
  ]

  useEffect(() => {
    setAccounts(mockAccounts)
    setFilteredAccounts(mockAccounts)
    setTransactions(mockTransactions)
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [searchTerm, filterCurrency, filterStatus, accounts])

  const filterAccounts = () => {
    let filtered = accounts

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.accountNumber.includes(searchTerm) ||
        account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.iban.includes(searchTerm)
      )
    }

    if (filterCurrency && filterCurrency !== 'all') {
      filtered = filtered.filter(account => account.currency === filterCurrency)
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(account => 
        filterStatus === 'active' ? account.isActive : !account.isActive
      )
    }

    setFilteredAccounts(filtered)
  }

  const handleCreateAccount = async () => {
    try {
      const newAccount = {
        id: Date.now().toString(),
        ...accountForm,
        totalTransactions: 0,
        monthlyTurnover: 0,
        lastTransactionDate: null,
        createdDate: new Date().toISOString().split('T')[0]
      }

      setAccounts(prev => [newAccount, ...prev])
      setShowCreateDialog(false)
      resetAccountForm()
      toast.success('Банківський рахунок створено успішно')
    } catch (error) {
      console.error('Error creating bank account:', error)
      toast.error('Помилка створення банківського рахунку')
    }
  }

  const handleCreateTransaction = async () => {
    try {
      const newTransaction = {
        id: `TXN-${Date.now()}`,
        accountId: selectedAccount.id,
        ...transactionForm,
        date: format(transactionForm.date, 'yyyy-MM-dd'),
        balanceAfter: selectedAccount.balance + (transactionForm.type === 'income' ? transactionForm.amount : -transactionForm.amount)
      }

      // Update account balance
      setAccounts(prev => prev.map(account =>
        account.id === selectedAccount.id
          ? {
              ...account,
              balance: newTransaction.balanceAfter,
              lastTransactionDate: newTransaction.date,
              totalTransactions: account.totalTransactions + 1
            }
          : account
      ))

      setTransactions(prev => [newTransaction, ...prev])
      setShowTransactionDialog(false)
      resetTransactionForm()
      toast.success('Операцію додано успішно')
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Помилка додавання операції')
    }
  }

  const resetAccountForm = () => {
    setAccountForm({
      accountNumber: '',
      accountName: '',
      bankName: '',
      bankCode: '',
      bankAddress: '',
      swift: '',
      iban: '',
      currency: 'UAH',
      accountType: 'current',
      balance: 0,
      creditLimit: 0,
      overdraftLimit: 0,
      interestRate: 0,
      isActive: true,
      isDefault: false,
      description: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: ''
    })
  }

  const resetTransactionForm = () => {
    setTransactionForm({
      date: new Date(),
      type: 'income',
      amount: 0,
      description: '',
      reference: '',
      counterparty: '',
      category: 'Доходи від основної діяльності',
      status: 'pending'
    })
  }

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'current': return 'bg-blue-100 text-blue-800'
      case 'deposit': return 'bg-green-100 text-green-800'
      case 'credit': return 'bg-orange-100 text-orange-800'
      case 'salary': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccountTypeText = (type) => {
    switch (type) {
      case 'current': return 'Поточний'
      case 'deposit': return 'Депозитний'
      case 'credit': return 'Кредитний'
      case 'salary': return 'Зарплатний'
      default: return type
    }
  }

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'UAH': return '₴'
      case 'USD': return '$'
      case 'EUR': return '€'
      default: return currency
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Банківські рахунки</h2>
          <p className="text-gray-600">Управління банківськими рахунками та операціями</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Експорт
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Додати рахунок
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новий банківський рахунок</DialogTitle>
              </DialogHeader>

              <BankAccountForm
                form={accountForm}
                setForm={setAccountForm}
                onSubmit={handleCreateAccount}
                onCancel={() => {
                  setShowCreateDialog(false)
                  resetAccountForm()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Пошук рахунків за номером, назвою або банком..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Валюта" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі</SelectItem>
                <SelectItem value="UAH">₴ UAH</SelectItem>
                <SelectItem value="USD">$ USD</SelectItem>
                <SelectItem value="EUR">€ EUR</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі</SelectItem>
                <SelectItem value="active">Активні</SelectItem>
                <SelectItem value="inactive">Неактивні</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього рахунків</p>
                <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальний баланс UAH</p>
                <p className="text-2xl font-bold text-green-600">
                  {accounts.filter(a => a.currency === 'UAH').reduce((sum, a) => sum + a.balance, 0).toLocaleString()} ₴
                </p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активні рахунки</p>
                <p className="text-2xl font-bold text-purple-600">
                  {accounts.filter(a => a.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Операції (місяць)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {accounts.reduce((sum, a) => sum + a.totalTransactions, 0)}
                </p>
              </div>
              <ArrowUpDown className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredAccounts.length === 0 ? (
          <div className="col-span-2">
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Рахунків не знайдено</h3>
                <p className="text-gray-600">Спробуйте змінити критерії пошуку або додайте новий рахунок</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredAccounts.map(account => (
            <BankAccountCard
              key={account.id}
              account={account}
              onViewDetails={(account) => {
                setSelectedAccount(account)
                setShowDetailsDialog(true)
              }}
              onEdit={(account) => {
                setSelectedAccount(account)
                setAccountForm({
                  accountNumber: account.accountNumber,
                  accountName: account.accountName,
                  bankName: account.bankName,
                  bankCode: account.bankCode,
                  bankAddress: account.bankAddress,
                  swift: account.swift,
                  iban: account.iban,
                  currency: account.currency,
                  accountType: account.accountType,
                  balance: account.balance,
                  creditLimit: account.creditLimit,
                  overdraftLimit: account.overdraftLimit,
                  interestRate: account.interestRate,
                  isActive: account.isActive,
                  isDefault: account.isDefault,
                  description: account.description,
                  contactPerson: account.contactPerson,
                  contactPhone: account.contactPhone,
                  contactEmail: account.contactEmail
                })
                setShowEditDialog(true)
              }}
              onAddTransaction={(account) => {
                setSelectedAccount(account)
                setShowTransactionDialog(true)
              }}
              getAccountTypeColor={getAccountTypeColor}
              getAccountTypeText={getAccountTypeText}
              getCurrencySymbol={getCurrencySymbol}
            />
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагування банківського рахунку</DialogTitle>
          </DialogHeader>

          <BankAccountForm
            form={accountForm}
            setForm={setAccountForm}
            onSubmit={() => {
              toast.success('Рахунок оновлено успішно')
              setShowEditDialog(false)
              resetAccountForm()
            }}
            onCancel={() => {
              setShowEditDialog(false)
              resetAccountForm()
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі банківського рахунку</DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <BankAccountDetails 
              account={selectedAccount}
              transactions={transactions.filter(t => t.accountId === selectedAccount.id)}
              getAccountTypeColor={getAccountTypeColor}
              getAccountTypeText={getAccountTypeText}
              getCurrencySymbol={getCurrencySymbol}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Нова банківська операція</DialogTitle>
          </DialogHeader>

          {selectedAccount && (
            <TransactionForm
              form={transactionForm}
              setForm={setTransactionForm}
              account={selectedAccount}
              onSubmit={handleCreateTransaction}
              onCancel={() => {
                setShowTransactionDialog(false)
                resetTransactionForm()
              }}
              getCurrencySymbol={getCurrencySymbol}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Bank Account Card Component
function BankAccountCard({ 
  account, 
  onViewDetails, 
  onEdit, 
  onAddTransaction,
  getAccountTypeColor, 
  getAccountTypeText,
  getCurrencySymbol 
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{account.accountName}</h3>
                <p className="text-sm text-gray-600">{account.bankName}</p>
              </div>
              {account.isDefault && (
                <Badge variant="outline" className="text-xs">По замовчуванню</Badge>
              )}
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddTransaction(account)
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(account)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(account)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-3" onClick={() => onViewDetails(account)}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Номер рахунку:</span>
            <span className="font-mono text-sm">{account.accountNumber}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">IBAN:</span>
            <span className="font-mono text-xs text-gray-500">{account.iban}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge className={getAccountTypeColor(account.accountType)}>
              {getAccountTypeText(account.accountType)}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {account.currency}
            </Badge>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Поточний баланс:</span>
              <span className={`text-xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {account.balance.toLocaleString()} {getCurrencySymbol(account.currency)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{account.totalTransactions}</div>
                <div className="text-xs text-gray-500">Операцій</div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-blue-600">
                  {account.monthlyTurnover.toLocaleString()} {getCurrencySymbol(account.currency)}
                </div>
                <div className="text-xs text-gray-500">Оборот/місяць</div>
              </div>
              
              {account.interestRate > 0 && (
                <div className="text-center">
                  <div className="font-medium text-green-600">{account.interestRate}%</div>
                  <div className="text-xs text-gray-500">Відсоток</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Остання операція: {account.lastTransactionDate || 'Немає'}</span>
            <span className={account.isActive ? 'text-green-600' : 'text-red-600'}>
              {account.isActive ? 'Активний' : 'Неактивний'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Bank Account Form Component
function BankAccountForm({ form, setForm, onSubmit, onCancel, isEdit = false }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Основні дані</TabsTrigger>
        <TabsTrigger value="bank">Банківські дані</TabsTrigger>
        <TabsTrigger value="settings">Налаштування</TabsTrigger>
        <TabsTrigger value="contact">Контакти</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <Label htmlFor="accountName">Назва рахунку *</Label>
          <Input
            id="accountName"
            value={form.accountName}
            onChange={(e) => updateForm('accountName', e.target.value)}
            placeholder="Основний поточний рахунок"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountNumber">Номер рахунку *</Label>
            <Input
              id="accountNumber"
              value={form.accountNumber}
              onChange={(e) => updateForm('accountNumber', e.target.value)}
              placeholder="26001234567890"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="currency">Валюта *</Label>
            <Select value={form.currency} onValueChange={(value) => updateForm('currency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UAH">₴ Українська гривня (UAH)</SelectItem>
                <SelectItem value="USD">$ Долар США (USD)</SelectItem>
                <SelectItem value="EUR">€ Євро (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountType">Тип рахунку *</Label>
            <Select value={form.accountType} onValueChange={(value) => updateForm('accountType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Поточний</SelectItem>
                <SelectItem value="deposit">Депозитний</SelectItem>
                <SelectItem value="credit">Кредитний</SelectItem>
                <SelectItem value="salary">Зарплатний</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="balance">Початковий баланс</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={form.balance}
              onChange={(e) => updateForm('balance', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Опис рахунку</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="Детальний опис призначення рахунку"
            rows={3}
          />
        </div>
      </TabsContent>

      <TabsContent value="bank" className="space-y-4">
        <div>
          <Label htmlFor="bankName">Назва банку *</Label>
          <Input
            id="bankName"
            value={form.bankName}
            onChange={(e) => updateForm('bankName', e.target.value)}
            placeholder='АТ "ПриватБанк"'
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bankCode">МФО банку *</Label>
            <Input
              id="bankCode"
              value={form.bankCode}
              onChange={(e) => updateForm('bankCode', e.target.value)}
              placeholder="305299"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="swift">SWIFT код</Label>
            <Input
              id="swift"
              value={form.swift}
              onChange={(e) => updateForm('swift', e.target.value)}
              placeholder="PBANUA2X"
              className="font-mono"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="iban">IBAN</Label>
          <Input
            id="iban"
            value={form.iban}
            onChange={(e) => updateForm('iban', e.target.value)}
            placeholder="UA213223130000026001234567890"
            className="font-mono"
          />
        </div>

        <div>
          <Label htmlFor="bankAddress">Адреса банку</Label>
          <Textarea
            id="bankAddress"
            value={form.bankAddress}
            onChange={(e) => updateForm('bankAddress', e.target.value)}
            placeholder="м. Київ, вул. Грушевського, 1Д"
            rows={2}
          />
        </div>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="creditLimit">Кредитний ліміт</Label>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              value={form.creditLimit}
              onChange={(e) => updateForm('creditLimit', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="overdraftLimit">Овердрафт</Label>
            <Input
              id="overdraftLimit"
              type="number"
              step="0.01"
              value={form.overdraftLimit}
              onChange={(e) => updateForm('overdraftLimit', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="interestRate">Відсоткова ставка (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              value={form.interestRate}
              onChange={(e) => updateForm('interestRate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateForm('isActive', e.target.checked)}
            />
            <span className="text-sm">Активний рахунок</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => updateForm('isDefault', e.target.checked)}
            />
            <span className="text-sm">Рахунок за замовчуванням</span>
          </label>
        </div>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4">
        <div>
          <Label htmlFor="contactPerson">Контактна особа</Label>
          <Input
            id="contactPerson"
            value={form.contactPerson}
            onChange={(e) => updateForm('contactPerson', e.target.value)}
            placeholder="Марія Коваленко"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactPhone">Телефон</Label>
            <Input
              id="contactPhone"
              value={form.contactPhone}
              onChange={(e) => updateForm('contactPhone', e.target.value)}
              placeholder="+380443639999"
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateForm('contactEmail', e.target.value)}
              placeholder="maria.kovalenko@privatbank.ua"
            />
          </div>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">
          {isEdit ? 'Оновити' : 'Створити'} рахунок
        </Button>
      </div>
    </Tabs>
  )
}

// Bank Account Details Component
function BankAccountDetails({ account, transactions, getAccountTypeColor, getAccountTypeText, getCurrencySymbol }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Огляд</TabsTrigger>
        <TabsTrigger value="transactions">Операції</TabsTrigger>
        <TabsTrigger value="analytics">Аналітика</TabsTrigger>
        <TabsTrigger value="settings">Налаштування</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Основна інформація</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Назва рахунку:</span>
                <span className="font-medium">{account.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Номер рахунку:</span>
                <span className="font-mono">{account.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IBAN:</span>
                <span className="font-mono text-xs">{account.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Тип:</span>
                <Badge className={getAccountTypeColor(account.accountType)}>
                  {getAccountTypeText(account.accountType)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Валюта:</span>
                <span className="font-mono">{account.currency}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Банківські дані</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Банк:</span>
                <span>{account.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">МФО:</span>
                <span className="font-mono">{account.bankCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SWIFT:</span>
                <span className="font-mono">{account.swift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Контакт:</span>
                <span>{account.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Телефон:</span>
                <span>{account.contactPhone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold mb-1 ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {account.balance.toLocaleString()} {getCurrencySymbol(account.currency)}
              </div>
              <div className="text-sm text-gray-600">Поточний баланс</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {account.totalTransactions}
              </div>
              <div className="text-sm text-gray-600">Всього операцій</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {account.monthlyTurnover.toLocaleString()} {getCurrencySymbol(account.currency)}
              </div>
              <div className="text-sm text-gray-600">Місячний оборот</div>
            </CardContent>
          </Card>
        </div>

        {account.description && (
          <div>
            <h4 className="font-medium mb-3">Опис</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">{account.description}</p>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="transactions">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Останні операції</h4>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Експорт
            </Button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpDown className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Операцій немає</h3>
              <p className="text-gray-600">Операції по рахунку будуть відображатися тут</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft className={`w-4 h-4 text-green-600`} />
                          ) : (
                            <ArrowUpRight className={`w-4 h-4 text-red-600`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{transaction.description}</h4>
                          <p className="text-xs text-gray-600">
                            {transaction.counterparty} • {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: uk })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} {getCurrencySymbol(account.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Баланс: {transaction.balanceAfter.toLocaleString()} {getCurrencySymbol(account.currency)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        <div className="text-center py-8">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Аналітика рахунку</h3>
          <p className="text-gray-600">Графіки та звіти по операціям будуть доступні тут</p>
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Ліміти та налаштування</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Кредитний ліміт:</span>
                <span>{account.creditLimit.toLocaleString()} {getCurrencySymbol(account.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Овердрафт:</span>
                <span>{account.overdraftLimit.toLocaleString()} {getCurrencySymbol(account.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Відсоткова ставка:</span>
                <span>{account.interestRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Активний' : 'Неактивний'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Системна інформація</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Дата створення:</span>
                <span>{format(parseISO(account.createdDate), 'dd MMM yyyy', { locale: uk })}</span>
              </div>
              {account.maturityDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата погашення:</span>
                  <span>{format(parseISO(account.maturityDate), 'dd MMM yyyy', { locale: uk })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">За замовчуванням:</span>
                <Badge variant={account.isDefault ? 'default' : 'outline'}>
                  {account.isDefault ? 'Так' : 'Ні'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Transaction Form Component
function TransactionForm({ form, setForm, account, onSubmit, onCancel, getCurrencySymbol }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          {account.accountName} ({account.accountNumber})
        </h4>
        <p className="text-sm text-blue-700">
          Поточний баланс: {account.balance.toLocaleString()} {getCurrencySymbol(account.currency)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Дата операції *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(form.date, 'dd MMM yyyy', { locale: uk })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.date}
                onSelect={(date) => updateForm('date', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="type">Тип операції *</Label>
          <Select value={form.type} onValueChange={(value) => updateForm('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Надходження</SelectItem>
              <SelectItem value="expense">Витрата</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="amount">Сума *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => updateForm('amount', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      <div>
        <Label htmlFor="description">Опис операції *</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder="Детальний опис банківської операції"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reference">Номер документа</Label>
          <Input
            id="reference"
            value={form.reference}
            onChange={(e) => updateForm('reference', e.target.value)}
            placeholder="DOC-2024-001"
          />
        </div>
        <div>
          <Label htmlFor="counterparty">Контрагент</Label>
          <Input
            id="counterparty"
            value={form.counterparty}
            onChange={(e) => updateForm('counterparty', e.target.value)}
            placeholder="Назва контрагента"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Категорія</Label>
        <Select value={form.category} onValueChange={(value) => updateForm('category', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Виберіть категорію" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Доходи від основної діяльності">Доходи від основної діяльності</SelectItem>
            <SelectItem value="Витрати на персонал">Витрати на персонал</SelectItem>
            <SelectItem value="Операційні витрати">Операційні витрати</SelectItem>
            <SelectItem value="Валютні операції">Валютні операції</SelectItem>
            <SelectItem value="Інші доходи">Інші доходи</SelectItem>
            <SelectItem value="Інші витрати">Інші витрати</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Balance Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Баланс після операції:</span>
          <span className="font-medium">
            {(account.balance + (form.type === 'income' ? form.amount : -form.amount)).toLocaleString()} {getCurrencySymbol(account.currency)}
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">
          Додати операцію
        </Button>
      </div>
    </div>
  )
}