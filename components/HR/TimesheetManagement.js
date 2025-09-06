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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Clock, 
  Plus, 
  Download, 
  Calendar as CalendarIcon, 
  Edit, 
  Save, 
  Calculator,
  FileSpreadsheet,
  Timer,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, parseISO } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function TimesheetManagement({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState(user?.id || '')
  const [employees, setEmployees] = useState([])
  const [timesheetData, setTimesheetData] = useState({})
  const [workCodes, setWorkCodes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddCodeDialog, setShowAddCodeDialog] = useState(false)
  const [editingCell, setEditingCell] = useState(null)

  // Ukrainian work codes (standard for Ukrainian companies)
  const defaultWorkCodes = [
    { code: 'Я', name: 'Явка', description: 'Нормальний робочий день', hours: 8 },
    { code: 'В', name: 'Вихідний', description: 'Вихідний день', hours: 0 },
    { code: 'С', name: 'Святковий', description: 'Святковий день', hours: 0 },
    { code: 'Вп', name: 'Відпустка', description: 'Щорічна відпустка', hours: 0 },
    { code: 'Лк', name: 'Лікарняний', description: 'Тимчасова непрацездатність', hours: 0 },
    { code: 'Дв', name: 'Декретна відпустка', description: 'Відпустка по догляду за дитиною', hours: 0 },
    { code: 'Нп', name: 'Неявка', description: 'Неявка без поважних причин', hours: 0 },
    { code: 'Пр', name: 'Прогул', description: 'Прогул', hours: 0 },
    { code: 'Н1', name: 'Нічна зміна 1', description: 'Нічна зміна (00:00-08:00)', hours: 8 },
    { code: 'Н2', name: 'Нічна зміна 2', description: 'Нічна зміна (08:00-16:00)', hours: 8 },
    { code: 'Н3', name: 'Нічна зміна 3', description: 'Нічна зміна (16:00-00:00)', hours: 8 },
    { code: '4', name: '4 години', description: 'Неповний робочий день (4 год)', hours: 4 },
    { code: '6', name: '6 годин', description: 'Неповний робочий день (6 год)', hours: 6 },
    { code: 'Пн', name: 'Понаднормові', description: 'Понаднормовий час', hours: 10 }
  ]

  useEffect(() => {
    setWorkCodes(defaultWorkCodes)
    fetchEmployees()
    fetchTimesheetData()
  }, [currentDate, selectedEmployee])

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

  const fetchTimesheetData = async () => {
    setIsLoading(true)
    try {
      // Fetch real timesheet data from API
      const month = format(currentDate, 'yyyy-MM')
      const response = await fetch(`/api/timesheet/monthly?month=${month}&department=all`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Timesheet API response:', result)
        console.log('✅ Employees found:', result.employees?.length || 0)
        
        // Convert API data to component format
        const timesheetMap = {}
        
        if (result.employees && result.employees.length > 0) {
          // Find current employee data
          const currentEmp = result.employees.find(emp => emp.employee.id === selectedEmployee) 
            || result.employees[0] // fallback to first employee if current not found
          
          if (currentEmp && currentEmp.dailyEntries) {
            currentEmp.dailyEntries.forEach(entry => {
              const dayKey = format(new Date(entry.date), 'yyyy-MM-dd')
              
              // Map status to work codes
              let code = 'Я' // default work day
              let hours = entry.workHours || 8
              let note = entry.comments || ''
              
              if (entry.status === 'absent') {
                if (entry.absenceType === 'sick') {
                  code = 'Лк'
                  hours = 0
                } else if (entry.absenceType === 'vacation') {
                  code = 'Вп' 
                  hours = 0
                } else {
                  code = 'Н' // absent
                  hours = 0
                }
              } else if (entry.dayType === 'weekend') {
                code = 'В'
                hours = 0
              } else if (entry.dayType === 'holiday') {
                code = 'С'
                hours = 0
              }
              
              timesheetMap[dayKey] = { code, hours, note }
            })
          }
        }
        
        setTimesheetData(timesheetMap)
        
        // Update employees list if available
        if (result.employees) {
          const empList = result.employees.map(emp => ({
            id: emp.employee.id,
            name: emp.employee.fullName,
            department: emp.employee.department,
            position: emp.employee.position || 'Співробітник'
          }))
          setEmployees(empList)
        }
      } else {
        console.error('Failed to fetch timesheet data:', response.status)
        // Create fallback empty data for current month
        setTimesheetData({})
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error)
      toast.error('Помилка завантаження табеля')
      setTimesheetData({})
    } finally {
      setIsLoading(false)
    }
  }

  const updateTimesheetEntry = async (date, code, hours, note = '') => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const workCode = workCodes.find(wc => wc.code === code)
    
    setTimesheetData(prev => ({
      ...prev,
      [dayKey]: {
        code,
        hours: hours || workCode?.hours || 0,
        note
      }
    }))

    // In real app, save to API
    toast.success('Запис оновлено')
  }

  const calculateMonthlyStats = () => {
    const entries = Object.values(timesheetData)
    const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
    const workDays = entries.filter(entry => entry.code === 'Я' || entry.code?.includes('Н')).length
    const vacationDays = entries.filter(entry => entry.code === 'Вп').length
    const sickDays = entries.filter(entry => entry.code === 'Лк').length
    const overtimeHours = entries.filter(entry => entry.code === 'Пн').reduce((sum, entry) => sum + (entry.hours || 0), 0)

    return {
      totalHours,
      workDays,
      vacationDays,
      sickDays,
      overtimeHours
    }
  }

  const exportToExcel = () => {
    // Mock implementation - in real app, generate actual Excel file
    toast.success('Табель експортовано до Excel')
  }

  const exportToPDF = () => {
    // Mock implementation - in real app, generate actual PDF file
    toast.success('Табель експортовано до PDF')
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const stats = calculateMonthlyStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Табель обліку робочого часу</h2>
          <p className="text-gray-600">Введення та управління робочим часом</p>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchTimesheetData}
            disabled={isLoading}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            {isLoading ? (
              <Timer className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Завантаження...' : 'Оновити дані'}
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToPDF}
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Month Navigation and Employee Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <h3 className="text-lg font-medium min-w-[200px] text-center">
                  {format(currentDate, 'MMMM yyyy', { locale: uk })}
                </h3>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Select 
                value={selectedEmployee} 
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger className="w-64">
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

            {/* Monthly Statistics */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600">{stats.totalHours}</div>
                <div className="text-gray-500">Всього годин</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{stats.workDays}</div>
                <div className="text-gray-500">Робочих днів</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">{stats.overtimeHours}</div>
                <div className="text-gray-500">Понаднормові</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">{stats.vacationDays}</div>
                <div className="text-gray-500">Відпустка</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Календарний табель</TabsTrigger>
          <TabsTrigger value="codes">Коди відмітки</TabsTrigger>
          <TabsTrigger value="summary">Звіти</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Табель на {format(currentDate, 'MMMM yyyy', { locale: uk })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <TimesheetCalendar
                  days={days}
                  currentDate={currentDate}
                  timesheetData={timesheetData}
                  workCodes={workCodes}
                  onUpdateEntry={updateTimesheetEntry}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Timer className="w-5 h-5 mr-2" />
                  Коди відмітки часу
                </div>
                <Button 
                  onClick={() => setShowAddCodeDialog(true)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати код
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workCodes.map(code => (
                  <Card key={code.code} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="font-mono text-lg">
                          {code.code}
                        </Badge>
                        <span className="text-sm font-medium text-blue-600">
                          {code.hours}г
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{code.name}</h4>
                      <p className="text-sm text-gray-600">{code.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Розрахунки за місяць
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Загальна кількість годин:</span>
                    <span className="font-medium">{stats.totalHours} год</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Робочі дні:</span>
                    <span className="font-medium">{stats.workDays} днів</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Понаднормові години:</span>
                    <span className="font-medium text-orange-600">{stats.overtimeHours} год</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Дні відпустки:</span>
                    <span className="font-medium text-purple-600">{stats.vacationDays} днів</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Лікарняні дні:</span>
                    <span className="font-medium text-red-600">{stats.sickDays} днів</span>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded">
                      <span className="font-medium">До нарахування зарплати:</span>
                      <span className="font-bold text-blue-600">
                        {(stats.totalHours * 120).toLocaleString()} грн
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Аналітика відвідуваності
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Відвідуваність</span>
                      <span>{((stats.workDays / 22) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(stats.workDays / 22) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Понаднормові (%)</span>
                      <span>{((stats.overtimeHours / (stats.totalHours || 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${(stats.overtimeHours / (stats.totalHours || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Тенденції</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Стабільна відвідуваність
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Помірна кількість понаднормових
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Дотримання графіку роботи
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Timesheet Calendar Component
function TimesheetCalendar({ 
  days, 
  currentDate, 
  timesheetData, 
  workCodes, 
  onUpdateEntry, 
  editingCell, 
  setEditingCell 
}) {
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

  const getCodeColor = (code) => {
    switch (code) {
      case 'Я': return 'bg-green-100 text-green-800 border-green-200'
      case 'В': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'С': return 'bg-red-100 text-red-800 border-red-200'
      case 'Вп': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Лк': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Пн': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const handleCellClick = (day) => {
    const dayKey = format(day, 'yyyy-MM-dd')
    setEditingCell(dayKey)
  }

  const handleCodeSelect = (day, code) => {
    const workCode = workCodes.find(wc => wc.code === code)
    onUpdateEntry(day, code, workCode?.hours || 0)
    setEditingCell(null)
  }

  return (
    <div className="space-y-4">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-medium py-2 text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const entry = timesheetData[dayKey] || { code: '', hours: 0 }
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isWeekendDay = isWeekend(day)
          const isEditing = editingCell === dayKey

          return (
            <div
              key={dayKey}
              className={`
                relative p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isWeekendDay ? 'bg-red-50' : ''}
                hover:shadow-md
              `}
              onClick={() => handleCellClick(day)}
            >
              <div className="text-sm font-medium text-gray-700 mb-1">
                {format(day, 'd')}
              </div>

              {isEditing ? (
                <div className="absolute inset-2 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {workCodes.slice(0, 8).map(code => (
                      <button
                        key={code.code}
                        className={`
                          w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100
                          ${code.code === entry.code ? 'bg-blue-100' : ''}
                        `}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCodeSelect(day, code.code)
                        }}
                      >
                        <span className="font-mono font-medium">{code.code}</span> - {code.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : entry.code ? (
                <div className="space-y-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getCodeColor(entry.code)}`}
                  >
                    {entry.code}
                  </Badge>
                  {entry.hours > 0 && (
                    <div className="text-xs text-gray-600">
                      {entry.hours}г
                    </div>
                  )}
                  {entry.note && (
                    <div className="text-xs text-gray-500 truncate">
                      {entry.note}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span>Робочий день</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
          <span>Вихідний</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
          <span>Відпустка</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>Лікарняний</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
          <span>Понаднормові</span>
        </div>
      </div>
    </div>
  )
}