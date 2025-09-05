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
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ChevronRight,
  ChevronDown,
  Filter,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

export default function ChartOfAccounts({ user }) {
  const [accounts, setAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [expandedGroups, setExpandedGroups] = useState(new Set(['1', '2', '3', '4', '5']))
  const [isLoading, setIsLoading] = useState(false)

  // Account form state
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: '',
    class: '',
    parent: '',
    isActive: true,
    description: '',
    allowManualEntries: true
  })

  // Ukrainian Chart of Accounts (based on Ukrainian accounting standards)
  const mockAccounts = [
    // Class 1: Non-current assets
    {
      id: '1',
      code: '10',
      name: 'Основні засоби',
      nameEn: 'Property, Plant and Equipment',
      type: 'asset',
      class: '1',
      parent: null,
      balance: 2500000,
      isActive: true,
      allowManualEntries: false,
      description: 'Матеріальні активи довгострокового використання',
      children: [
        {
          id: '101',
          code: '101',
          name: 'Земельні ділянки',
          nameEn: 'Land',
          type: 'asset',
          class: '1',
          parent: '10',
          balance: 500000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '103',
          code: '103',
          name: 'Будівлі та споруди',
          nameEn: 'Buildings and Structures',
          type: 'asset',
          class: '1',
          parent: '10',
          balance: 1200000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '104',
          code: '104',
          name: 'Машини та обладнання',
          nameEn: 'Machinery and Equipment',
          type: 'asset',
          class: '1',
          parent: '10',
          balance: 800000,
          isActive: true,
          allowManualEntries: true
        }
      ]
    },
    // Class 2: Current assets  
    {
      id: '2',
      code: '20',
      name: 'Виробничі запаси',
      nameEn: 'Inventories',
      type: 'asset',
      class: '2',
      parent: null,
      balance: 450000,
      isActive: true,
      allowManualEntries: false,
      description: 'Матеріальні активи для використання у виробництві',
      children: [
        {
          id: '201',
          code: '201',
          name: 'Сировина й матеріали',
          nameEn: 'Raw Materials',
          type: 'asset',
          class: '2',
          parent: '20',
          balance: 250000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '205',
          code: '205',
          name: 'Паливо',
          nameEn: 'Fuel',
          type: 'asset',
          class: '2',
          parent: '20',
          balance: 120000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '207',
          code: '207',
          name: 'Запасні частини',
          nameEn: 'Spare Parts',
          type: 'asset',
          class: '2',
          parent: '20',
          balance: 80000,
          isActive: true,
          allowManualEntries: true
        }
      ]
    },
    {
      id: '3',
      code: '30',
      name: 'Готівка та банк',
      nameEn: 'Cash and Bank',
      type: 'asset',
      class: '2',
      parent: null,
      balance: 890000,
      isActive: true,
      allowManualEntries: false,
      description: 'Грошові кошти та їх еквіваленти',
      children: [
        {
          id: '301',
          code: '301',
          name: 'Каса',
          nameEn: 'Cash on Hand',
          type: 'asset',
          class: '2',
          parent: '30',
          balance: 15000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '311',
          code: '311',
          name: 'Поточні рахунки в банках',
          nameEn: 'Current Bank Accounts',
          type: 'asset',
          class: '2',
          parent: '30',
          balance: 875000,
          isActive: true,
          allowManualEntries: true
        }
      ]
    },
    // Class 4: Equity and liabilities
    {
      id: '4',
      code: '40',
      name: 'Власний капітал',
      nameEn: 'Equity',
      type: 'equity',
      class: '4',
      parent: null,
      balance: 2000000,
      isActive: true,
      allowManualEntries: false,
      description: 'Власний капітал підприємства',
      children: [
        {
          id: '401',
          code: '401',
          name: 'Статутний капітал',
          nameEn: 'Charter Capital',
          type: 'equity',
          class: '4',
          parent: '40',
          balance: 1500000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '441',
          code: '441',
          name: 'Прибуток нерозподілений',
          nameEn: 'Retained Earnings',
          type: 'equity',
          class: '4',
          parent: '40',
          balance: 500000,
          isActive: true,
          allowManualEntries: true
        }
      ]
    },
    // Class 6: Expenses
    {
      id: '5',
      code: '60',
      name: 'Витрати',
      nameEn: 'Expenses',
      type: 'expense',
      class: '6',
      parent: null,
      balance: 1250000,
      isActive: true,
      allowManualEntries: false,
      description: 'Витрати від операційної діяльності',
      children: [
        {
          id: '601',
          code: '601',
          name: 'Матеріальні витрати',
          nameEn: 'Material Expenses',
          type: 'expense',
          class: '6',
          parent: '60',
          balance: 650000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '611',
          code: '611',
          name: 'Заробітна плата',
          nameEn: 'Wages and Salaries',
          type: 'expense',
          class: '6',
          parent: '60',
          balance: 450000,
          isActive: true,
          allowManualEntries: true
        },
        {
          id: '641',
          code: '641',
          name: 'Амортизація',
          nameEn: 'Depreciation',
          type: 'expense',
          class: '6',
          parent: '60',
          balance: 150000,
          isActive: true,
          allowManualEntries: true
        }
      ]
    }
  ]

  useEffect(() => {
    setAccounts(mockAccounts)
    setFilteredAccounts(mockAccounts)
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [searchTerm, filterClass, accounts])

  const filterAccounts = () => {
    let filtered = accounts

    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
      ).map(account => ({
        ...account,
        children: account.children?.filter(child =>
          child.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          child.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
    }

    if (filterClass) {
      filtered = filtered.filter(account => account.class === filterClass)
    }

    setFilteredAccounts(filtered)
  }

  const handleCreateAccount = async () => {
    try {
      const newAccount = {
        id: Date.now().toString(),
        ...accountForm,
        balance: 0
      }

      // Add to appropriate parent or root
      if (accountForm.parent) {
        setAccounts(prev => prev.map(account => 
          account.id === accountForm.parent
            ? { ...account, children: [...(account.children || []), newAccount] }
            : account
        ))
      } else {
        setAccounts(prev => [...prev, newAccount])
      }

      setShowAddDialog(false)
      resetAccountForm()
      toast.success('Рахунок створено успішно')
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error('Помилка створення рахунку')
    }
  }

  const resetAccountForm = () => {
    setAccountForm({
      code: '',
      name: '',
      nameEn: '',
      type: '',
      class: '',
      parent: '',
      isActive: true,
      description: '',
      allowManualEntries: true
    })
  }

  const toggleGroupExpansion = (groupId) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'asset': return 'bg-blue-100 text-blue-800'
      case 'liability': return 'bg-red-100 text-red-800'
      case 'equity': return 'bg-green-100 text-green-800'
      case 'revenue': return 'bg-purple-100 text-purple-800'
      case 'expense': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccountTypeText = (type) => {
    switch (type) {
      case 'asset': return 'Актив'
      case 'liability': return 'Зобов\'язання'
      case 'equity': return 'Капітал'
      case 'revenue': return 'Дохід'
      case 'expense': return 'Витрати'
      default: return type
    }
  }

  const getClassText = (classNum) => {
    switch (classNum) {
      case '1': return 'Клас 1: Необоротні активи'
      case '2': return 'Клас 2: Оборотні активи'
      case '3': return 'Клас 3: Витрати та амортизація'
      case '4': return 'Клас 4: Власний капітал'
      case '5': return 'Клас 5: Довгострокові зобов\'язання'
      case '6': return 'Клас 6: Поточні зобов\'язання'
      case '7': return 'Клас 7: Доходи та результати'
      case '8': return 'Клас 8: Витрати за елементами'
      case '9': return 'Клас 9: Витрати діяльності'
      default: return `Клас ${classNum}`
    }
  }

  const renderAccount = (account, level = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedGroups.has(account.id)
    const paddingLeft = level * 24

    return (
      <div key={account.id} className="mb-2">
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3" style={{ paddingLeft: `${paddingLeft}px` }}>
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroupExpansion(account.id)}
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
                  <Badge variant="outline" className="font-mono">
                    {account.code}
                  </Badge>

                  <div>
                    <h3 className="font-medium text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.nameEn}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {account.balance?.toLocaleString()} грн
                  </div>
                  <Badge className={getAccountTypeColor(account.type)}>
                    {getAccountTypeText(account.type)}
                  </Badge>
                </div>

                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAccount(account)
                      setAccountForm({
                        code: account.code,
                        name: account.name,
                        nameEn: account.nameEn || '',
                        type: account.type,
                        class: account.class,
                        parent: account.parent || '',
                        isActive: account.isActive,
                        description: account.description || '',
                        allowManualEntries: account.allowManualEntries
                      })
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAccount(account)}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {account.description && (
              <div className="mt-3 text-sm text-gray-600" style={{ paddingLeft: `${paddingLeft + 32}px` }}>
                {account.description}
              </div>
            )}
          </CardContent>
        </Card>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-2 space-y-2">
            {account.children.map(child => renderAccount(child, level + 1))}
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
          <h2 className="text-2xl font-bold text-gray-900">План рахунків</h2>
          <p className="text-gray-600">Система бухгалтерських рахунків підприємства</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Додати рахунок
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новий рахунок</DialogTitle>
            </DialogHeader>
            
            <AccountForm
              form={accountForm}
              setForm={setAccountForm}
              accounts={accounts}
              onSubmit={handleCreateAccount}
              onCancel={() => {
                setShowAddDialog(false)
                resetAccountForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Пошук рахунків за кодом або назвою..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Клас рахунків" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі класи</SelectItem>
                <SelectItem value="1">Клас 1: Необоротні активи</SelectItem>
                <SelectItem value="2">Клас 2: Оборотні активи</SelectItem>
                <SelectItem value="3">Клас 3: Витрати та амортизація</SelectItem>
                <SelectItem value="4">Клас 4: Власний капітал</SelectItem>
                <SelectItem value="5">Клас 5: Довгострокові зобов'язання</SelectItem>
                <SelectItem value="6">Клас 6: Поточні зобов'язання</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart of Accounts Tree */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="w-24 h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Рахунки не знайдено</h3>
              <p className="text-gray-600">Спробуйте змінити критерії пошуку або додайте новий рахунок</p>
            </CardContent>
          </Card>
        ) : (
          filteredAccounts.map(account => renderAccount(account))
        )}
      </div>

      {/* Account Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активи</p>
                <p className="text-xl font-bold text-blue-600">
                  {(2500000 + 450000 + 890000).toLocaleString()} грн
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Капітал</p>
                <p className="text-xl font-bold text-green-600">2,000,000 грн</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Витрати</p>
                <p className="text-xl font-bold text-orange-600">1,250,000 грн</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього рахунків</p>
                <p className="text-xl font-bold text-purple-600">
                  {accounts.reduce((sum, acc) => sum + (acc.children?.length || 0) + 1, 0)}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редагування рахунку</DialogTitle>
          </DialogHeader>
          
          <AccountForm
            form={accountForm}
            setForm={setAccountForm}
            accounts={accounts}
            onSubmit={() => {
              // Mock update
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
    </div>
  )
}

// Account Form Component
function AccountForm({ form, setForm, accounts, onSubmit, onCancel, isEdit = false }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const parentAccounts = accounts.filter(acc => !acc.parent)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Код рахунку *</Label>
          <Input
            id="code"
            value={form.code}
            onChange={(e) => updateForm('code', e.target.value)}
            placeholder="101"
            disabled={isEdit}
          />
        </div>
        <div>
          <Label htmlFor="class">Клас рахунку *</Label>
          <Select value={form.class} onValueChange={(value) => updateForm('class', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Виберіть клас" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Необоротні активи</SelectItem>
              <SelectItem value="2">2 - Оборотні активи</SelectItem>
              <SelectItem value="3">3 - Витрати та амортизація</SelectItem>
              <SelectItem value="4">4 - Власний капітал</SelectItem>
              <SelectItem value="5">5 - Довгострокові зобов'язання</SelectItem>
              <SelectItem value="6">6 - Поточні зобов'язання</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Назва рахунку *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
          placeholder="Основні засоби"
        />
      </div>

      <div>
        <Label htmlFor="nameEn">Назва англійською</Label>
        <Input
          id="nameEn"
          value={form.nameEn}
          onChange={(e) => updateForm('nameEn', e.target.value)}
          placeholder="Property, Plant and Equipment"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Тип рахунку *</Label>
          <Select value={form.type} onValueChange={(value) => updateForm('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Виберіть тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Актив</SelectItem>
              <SelectItem value="liability">Зобов'язання</SelectItem>
              <SelectItem value="equity">Капітал</SelectItem>
              <SelectItem value="revenue">Дохід</SelectItem>
              <SelectItem value="expense">Витрати</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="parent">Батьківський рахунок</Label>
          <Select value={form.parent} onValueChange={(value) => updateForm('parent', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Виберіть батьківський рахунок" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Немає (кореневий рахунок)</SelectItem>
              {parentAccounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </SelectItem>
              ))}
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
          placeholder="Детальний опис рахунку та його призначення"
        />
      </div>

      <div className="flex items-center space-x-4">
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
            checked={form.allowManualEntries}
            onChange={(e) => updateForm('allowManualEntries', e.target.checked)}
          />
          <span className="text-sm">Дозволити ручні проводки</span>
        </label>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700">
          {isEdit ? 'Оновити' : 'Створити'} рахунок
        </Button>
      </div>
    </div>
  )
}