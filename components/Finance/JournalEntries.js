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
  FileText, 
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
  Calculator,
  ArrowRightLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function JournalEntries({ user }) {
  const [entries, setEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Journal entry form state
  const [entryForm, setEntryForm] = useState({
    date: new Date(),
    description: '',
    reference: '',
    source: 'manual',
    status: 'draft',
    lines: [
      { account: '', accountName: '', debit: 0, credit: 0, description: '' },
      { account: '', accountName: '', debit: 0, credit: 0, description: '' }
    ],
    attachments: [],
    notes: ''
  })

  // Mock journal entries
  const mockEntries = [
    {
      id: 'JE-001',
      date: '2024-12-10',
      description: 'Нарахування заробітної плати за листопад 2024',
      reference: 'PAY-2024-11',
      source: 'payroll',
      status: 'posted',
      createdBy: 'Марія Петренко',
      approvedBy: 'Олександра Коваленко',
      lines: [
        {
          account: '611',
          accountName: 'Заробітна плата',
          debit: 450000,
          credit: 0,
          description: 'Нарахована зарплата співробітникам'
        },
        {
          account: '661',
          accountName: 'Розрахунки з оплати праці',
          debit: 0,
          credit: 360000,
          description: 'Зарплата до виплати'
        },
        {
          account: '641',
          accountName: 'Розрахунки за податками',
          debit: 0,
          credit: 90000,
          description: 'ПДФО та військовий збір'
        }
      ],
      totalDebit: 450000,
      totalCredit: 450000,
      createdDate: '2024-12-10T09:00:00Z',
      postedDate: '2024-12-10T14:30:00Z'
    },
    {
      id: 'JE-002',
      date: '2024-12-09',
      description: 'Закупівля палива для автопарку',
      reference: 'FUEL-2024-345',
      source: 'purchase',
      status: 'posted',
      createdBy: 'Олексій Коваленко',
      approvedBy: 'Марія Петренко',
      lines: [
        {
          account: '205',
          accountName: 'Паливо',
          debit: 120000,
          credit: 0,
          description: 'Закупівля дизельного палива'
        },
        {
          account: '641',
          accountName: 'Розрахунки за податками',
          debit: 24000,
          credit: 0,
          description: 'ПДВ до відшкодування'
        },
        {
          account: '631',
          accountName: 'Розрахунки з постачальниками',
          debit: 0,
          credit: 144000,
          description: 'Заборгованість по паливу'
        }
      ],
      totalDebit: 144000,
      totalCredit: 144000,
      createdDate: '2024-12-09T11:15:00Z',
      postedDate: '2024-12-09T16:45:00Z'
    },
    {
      id: 'JE-003',
      date: '2024-12-12',
      description: 'Амортизація транспортних засобів',
      reference: 'DEP-2024-12',
      source: 'automatic',
      status: 'draft',
      createdBy: 'Система',
      lines: [
        {
          account: '131',
          accountName: 'Знос транспортних засобів',
          debit: 85000,
          credit: 0,
          description: 'Амортизація за грудень 2024'
        },
        {
          account: '104',
          accountName: 'Транспортні засоби',
          debit: 0,
          credit: 85000,
          description: 'Нараховано амортизацію'
        }
      ],
      totalDebit: 85000,
      totalCredit: 85000,
      createdDate: '2024-12-12T00:00:00Z'
    }
  ]

  useEffect(() => {
    setEntries(mockEntries)
    setFilteredEntries(mockEntries)
  }, [])

  useEffect(() => {
    filterEntries()
  }, [searchTerm, filterStatus, entries])

  const filterEntries = () => {
    let filtered = entries

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.lines.some(line => 
          line.account.includes(searchTerm) || 
          line.accountName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(entry => entry.status === filterStatus)
    }

    setFilteredEntries(filtered)
  }

  const handleCreateEntry = async () => {
    try {
      // Validate double-entry bookkeeping
      const totalDebit = entryForm.lines.reduce((sum, line) => sum + (line.debit || 0), 0)
      const totalCredit = entryForm.lines.reduce((sum, line) => sum + (line.credit || 0), 0)

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast.error('Помилка балансу: Дебет та кредит мають бути рівними')
        return
      }

      const newEntry = {
        id: `JE-${Date.now()}`,
        ...entryForm,
        date: format(entryForm.date, 'yyyy-MM-dd'),
        totalDebit,
        totalCredit,
        createdBy: user?.fullName,
        createdDate: new Date().toISOString()
      }

      setEntries(prev => [newEntry, ...prev])
      setShowCreateDialog(false)
      resetEntryForm()
      toast.success('Проводку створено успішно')
    } catch (error) {
      console.error('Error creating journal entry:', error)
      toast.error('Помилка створення проводки')
    }
  }

  const postEntry = async (entryId) => {
    try {
      setEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { 
              ...entry, 
              status: 'posted', 
              approvedBy: user?.fullName,
              postedDate: new Date().toISOString()
            }
          : entry
      ))
      toast.success('Проводку проведено успішно')
    } catch (error) {
      console.error('Error posting entry:', error)
      toast.error('Помилка проведення проводки')
    }
  }

  const resetEntryForm = () => {
    setEntryForm({
      date: new Date(),
      description: '',
      reference: '',
      source: 'manual',
      status: 'draft',
      lines: [
        { account: '', accountName: '', debit: 0, credit: 0, description: '' },
        { account: '', accountName: '', debit: 0, credit: 0, description: '' }
      ],
      attachments: [],
      notes: ''
    })
  }

  const addLine = () => {
    setEntryForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account: '', accountName: '', debit: 0, credit: 0, description: '' }]
    }))
  }

  const removeLine = (index) => {
    setEntryForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }))
  }

  const updateLine = (index, field, value) => {
    setEntryForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'posted': return 'Проведено'
      case 'draft': return 'Чернетка'
      case 'cancelled': return 'Скасовано'
      default: return status
    }
  }

  const getSourceText = (source) => {
    switch (source) {
      case 'manual': return 'Ручна'
      case 'automatic': return 'Автоматична'
      case 'payroll': return 'Зарплата'
      case 'purchase': return 'Закупівля'
      case 'sale': return 'Продаж'
      default: return source
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Журнал проводок</h2>
          <p className="text-gray-600">Бухгалтерські записи та операції</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Нова проводка
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Нова бухгалтерська проводка</DialogTitle>
            </DialogHeader>

            <JournalEntryForm
              form={entryForm}
              setForm={setEntryForm}
              onSubmit={handleCreateEntry}
              onCancel={() => {
                setShowCreateDialog(false)
                resetEntryForm()
              }}
              addLine={addLine}
              removeLine={removeLine}
              updateLine={updateLine}
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
                  placeholder="Пошук проводок..."
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
                <SelectItem value="draft">Чернетки</SelectItem>
                <SelectItem value="posted">Проведені</SelectItem>
                <SelectItem value="cancelled">Скасовані</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Період" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі періоди</SelectItem>
                <SelectItem value="today">Сьогодні</SelectItem>
                <SelectItem value="week">Цей тиждень</SelectItem>
                <SelectItem value="month">Цей місяць</SelectItem>
                <SelectItem value="quarter">Цей квартал</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього проводок</p>
                <p className="text-2xl font-bold text-blue-600">{entries.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Проведені</p>
                <p className="text-2xl font-bold text-green-600">
                  {entries.filter(e => e.status === 'posted').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Чернетки</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {entries.filter(e => e.status === 'draft').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Сума оборотів</p>
                <p className="text-2xl font-bold text-purple-600">
                  {entries.reduce((sum, entry) => sum + entry.totalDebit, 0).toLocaleString()} грн
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Проводок не знайдено</h3>
              <p className="text-gray-600">Спробуйте змінити критерії пошуку або створіть нову проводку</p>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map(entry => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onViewDetails={(entry) => {
                setSelectedEntry(entry)
                setShowDetailsDialog(true)
              }}
              onPost={postEntry}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getSourceText={getSourceText}
              user={user}
            />
          ))
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі проводки</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <JournalEntryDetails 
              entry={selectedEntry}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getSourceText={getSourceText}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Journal Entry Card Component
function JournalEntryCard({ 
  entry, 
  onViewDetails, 
  onPost, 
  getStatusColor, 
  getStatusText, 
  getSourceText, 
  user 
}) {
  const canPost = user?.roles?.includes('admin') || user?.roles?.includes('accountant')

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-medium text-gray-900">{entry.id}</h3>
              <Badge className={getStatusColor(entry.status)}>
                {getStatusText(entry.status)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getSourceText(entry.source)}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {format(parseISO(entry.date), 'dd MMM yyyy', { locale: uk })}
              </div>
              
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {entry.totalDebit.toLocaleString()} грн
              </div>
              
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {entry.lines.length} записів
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(entry)
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>

            {canPost && entry.status === 'draft' && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPost(entry.id)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Провести
              </Button>
            )}
          </div>
        </div>

        {/* Journal Lines Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Бухгалтерські записи:</h4>
          <div className="space-y-2">
            {entry.lines.slice(0, 3).map((line, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {line.account}
                  </Badge>
                  <span className="text-gray-700">{line.accountName}</span>
                </div>
                <div className="flex space-x-4 font-mono text-xs">
                  <span className="text-green-600">
                    Дт: {line.debit ? line.debit.toLocaleString() : '—'}
                  </span>
                  <span className="text-red-600">
                    Кт: {line.credit ? line.credit.toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            ))}
            
            {entry.lines.length > 3 && (
              <div className="text-sm text-gray-500 text-center">
                ... та ще {entry.lines.length - 3} записів
              </div>
            )}
          </div>
        </div>

        {entry.createdBy && (
          <div className="mt-3 text-xs text-gray-500">
            Створено: {entry.createdBy} • {format(parseISO(entry.createdDate), 'dd.MM.yyyy HH:mm')}
            {entry.approvedBy && entry.postedDate && (
              <span> • Проведено: {entry.approvedBy} • {format(parseISO(entry.postedDate), 'dd.MM.yyyy HH:mm')}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Journal Entry Form Component
function JournalEntryForm({ 
  form, 
  setForm, 
  onSubmit, 
  onCancel, 
  addLine, 
  removeLine, 
  updateLine 
}) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const totalDebit = form.lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredit = form.lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Дата проводки *</Label>
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
          <Label htmlFor="reference">Документ-підстава</Label>
          <Input
            id="reference"
            value={form.reference}
            onChange={(e) => updateForm('reference', e.target.value)}
            placeholder="DOC-2024-001"
          />
        </div>

        <div>
          <Label htmlFor="source">Джерело</Label>
          <Select value={form.source} onValueChange={(value) => updateForm('source', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Ручна</SelectItem>
              <SelectItem value="automatic">Автоматична</SelectItem>
              <SelectItem value="payroll">Зарплата</SelectItem>
              <SelectItem value="purchase">Закупівля</SelectItem>
              <SelectItem value="sale">Продаж</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Опис проводки *</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder="Детальний опис бухгалтерської операції"
          rows={3}
        />
      </div>

      {/* Journal Lines */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Бухгалтерські записи</h4>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="w-4 h-4 mr-2" />
            Додати запис
          </Button>
        </div>

        {/* Lines Table Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-t-lg text-sm font-medium text-gray-700">
          <div className="col-span-2">Рахунок</div>
          <div className="col-span-4">Назва рахунку</div>
          <div className="col-span-2">Дебет</div>
          <div className="col-span-2">Кредит</div>
          <div className="col-span-1">Опис</div>
          <div className="col-span-1">Дії</div>
        </div>

        {/* Lines */}
        <div className="border rounded-b-lg">
          {form.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 p-3 border-b last:border-b-0 items-center">
              <div className="col-span-2">
                <Input
                  value={line.account}
                  onChange={(e) => updateLine(index, 'account', e.target.value)}
                  placeholder="101"
                  className="font-mono"
                />
              </div>
              <div className="col-span-4">
                <Input
                  value={line.accountName}
                  onChange={(e) => updateLine(index, 'accountName', e.target.value)}
                  placeholder="Назва рахунку"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  value={line.debit || ''}
                  onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="font-mono text-green-600"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  value={line.credit || ''}
                  onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="font-mono text-red-600"
                />
              </div>
              <div className="col-span-1">
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(index, 'description', e.target.value)}
                  placeholder="Примітка"
                  className="text-xs"
                />
              </div>
              <div className="col-span-1">
                {form.lines.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Balance Check */}
        <div className={`p-4 rounded-lg mt-4 ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {isBalanced ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Баланс дотримано</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Баланс порушено</span>
                </>
              )}
            </div>
            
            <div className="flex space-x-6 font-mono text-sm">
              <div className="text-green-600">
                Дебет: {totalDebit.toLocaleString()} грн
              </div>
              <div className="text-red-600">
                Кредит: {totalCredit.toLocaleString()} грн
              </div>
              <div className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                Різниця: {Math.abs(totalDebit - totalCredit).toLocaleString()} грн
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Додаткові примітки</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => updateForm('notes', e.target.value)}
          placeholder="Додаткова інформація до проводки"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button 
          onClick={onSubmit} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!isBalanced}
        >
          Створити проводку
        </Button>
      </div>
    </div>
  )
}

// Journal Entry Details Component
function JournalEntryDetails({ entry, getStatusColor, getStatusText, getSourceText }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{entry.id}</h3>
          <p className="text-gray-600">{entry.description}</p>
        </div>
        <Badge className={getStatusColor(entry.status)} size="lg">
          {getStatusText(entry.status)}
        </Badge>
      </div>

      {/* Entry Information */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Інформація про проводку</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Дата:</span>
              <span>{format(parseISO(entry.date), 'dd MMM yyyy', { locale: uk })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Документ-підстава:</span>
              <span>{entry.reference || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Джерело:</span>
              <Badge variant="outline">{getSourceText(entry.source)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Створено:</span>
              <span>{entry.createdBy} • {format(parseISO(entry.createdDate), 'dd.MM.yyyy HH:mm')}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Підсумки</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Загальна сума дебету:</span>
              <span className="font-mono text-green-600">{entry.totalDebit.toLocaleString()} грн</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Загальна сума кредиту:</span>
              <span className="font-mono text-red-600">{entry.totalCredit.toLocaleString()} грн</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Кількість записів:</span>
              <span>{entry.lines.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Баланс:</span>
              <span className="text-green-600 font-medium">
                {Math.abs(entry.totalDebit - entry.totalCredit) < 0.01 ? '✓ Збалансовано' : '✗ Не збалансовано'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Lines Details */}
      <div>
        <h4 className="font-medium mb-4">Детальні записи</h4>
        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-700">
                <th className="text-left p-3 border-b">Рахунок</th>
                <th className="text-left p-3 border-b">Назва рахунку</th>
                <th className="text-right p-3 border-b">Дебет</th>
                <th className="text-right p-3 border-b">Кредит</th>
                <th className="text-left p-3 border-b">Опис</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line, index) => (
                <tr key={index} className="text-sm border-b last:border-b-0">
                  <td className="p-3 font-mono font-medium">{line.account}</td>
                  <td className="p-3">{line.accountName}</td>
                  <td className="p-3 text-right font-mono text-green-600">
                    {line.debit ? line.debit.toLocaleString() : '—'}
                  </td>
                  <td className="p-3 text-right font-mono text-red-600">
                    {line.credit ? line.credit.toLocaleString() : '—'}
                  </td>
                  <td className="p-3 text-gray-600">{line.description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="text-sm font-medium">
                <td className="p-3" colSpan="2">РАЗОМ:</td>
                <td className="p-3 text-right font-mono text-green-600">
                  {totalDebit.toLocaleString()} грн
                </td>
                <td className="p-3 text-right font-mono text-red-600">
                  {totalCredit.toLocaleString()} грн
                </td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {entry.notes && (
        <div>
          <h4 className="font-medium mb-3">Примітки</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">{entry.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}