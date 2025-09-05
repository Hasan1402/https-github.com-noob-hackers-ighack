'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Building2, 
  Clock, 
  Plane,
  BarChart3,
  Calendar,
  FileText,
  Settings
} from 'lucide-react'
import EmployeeManagement from './EmployeeManagement'
import DepartmentStructure from './DepartmentStructure'
import TimesheetManagement from './TimesheetManagement'
import BusinessTripManagement from './BusinessTripManagement'

export default function HRManagementTabs({ user }) {
  const [activeTab, setActiveTab] = useState('overview')

  // Mock statistics
  const hrStats = {
    totalEmployees: 45000,
    activeEmployees: 44750,
    departments: 15,
    pendingTrips: 8,
    monthlyHours: 176000,
    newHires: 250,
    turnoverRate: 3.2
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview" className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4" />
          <span>Огляд</span>
        </TabsTrigger>
        <TabsTrigger value="employees" className="flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Співробітники</span>
        </TabsTrigger>
        <TabsTrigger value="departments" className="flex items-center space-x-2">
          <Building2 className="w-4 h-4" />
          <span>Відділи</span>
        </TabsTrigger>
        <TabsTrigger value="timesheet" className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>Табель</span>
        </TabsTrigger>
        <TabsTrigger value="trips" className="flex items-center space-x-2">
          <Plane className="w-4 h-4" />
          <span>Відрядження</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        {/* HR Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всього співробітників</p>
                  <p className="text-2xl font-bold text-blue-600">{hrStats.totalEmployees.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  +{hrStats.newHires} цього місяця
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Активні співробітники</p>
                  <p className="text-2xl font-bold text-green-600">{hrStats.activeEmployees.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-gray-600">
                  {((hrStats.activeEmployees / hrStats.totalEmployees) * 100).toFixed(1)}% активність
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Відділи</p>
                  <p className="text-2xl font-bold text-purple-600">{hrStats.departments}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  Структура готова
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Заявки на відрядження</p>
                  <p className="text-2xl font-bold text-orange-600">{hrStats.pendingTrips}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Plane className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  На розгляді
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities & Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Останні активності HR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 pb-3 border-b">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Новий співробітник додано</p>
                    <p className="text-xs text-gray-500">Марія Іваненко - Відділ логістики</p>
                    <p className="text-xs text-gray-400">2 години тому</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 pb-3 border-b">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Відрядження затверджено</p>
                    <p className="text-xs text-gray-500">Олексій Коваленко - Львів</p>
                    <p className="text-xs text-gray-400">4 години тому</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 pb-3 border-b">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Табель затверджено</p>
                    <p className="text-xs text-gray-500">Відділ продажів - Листопад 2024</p>
                    <p className="text-xs text-gray-400">1 день тому</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Оновлена структура відділу</p>
                    <p className="text-xs text-gray-500">IT та розробка - нові підрозділи</p>
                    <p className="text-xs text-gray-400">2 дні тому</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Ключові показники
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Відвідуваність</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-20 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">94.2%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Плинність кадрів</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-3 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">{hrStats.turnoverRate}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Задоволеність персоналу</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-22 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">87.5%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Навчання завершено</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="w-18 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">76.3%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Загальний HR індекс</p>
                    <div className="text-3xl font-bold text-green-600 mt-1">8.7/10</div>
                    <Badge variant="outline" className="text-green-600 border-green-600 mt-2">
                      Відмінно
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Швидкі дії
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setActiveTab('employees')}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium">Додати співробітника</span>
              </button>

              <button 
                onClick={() => setActiveTab('departments')}
                className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Building2 className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium">Управління відділами</span>
              </button>

              <button 
                onClick={() => setActiveTab('timesheet')}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Clock className="w-8 h-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium">Табель робочого часу</span>
              </button>

              <button 
                onClick={() => setActiveTab('trips')}
                className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <Plane className="w-8 h-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium">Нове відрядження</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="employees" className="mt-6">
        <EmployeeManagement user={user} />
      </TabsContent>

      <TabsContent value="departments" className="mt-6">
        <DepartmentStructure user={user} />
      </TabsContent>

      <TabsContent value="timesheet" className="mt-6">
        <TimesheetManagement user={user} />
      </TabsContent>

      <TabsContent value="trips" className="mt-6">
        <BusinessTripManagement user={user} />
      </TabsContent>
    </Tabs>
  )
}