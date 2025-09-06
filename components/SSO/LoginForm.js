'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building, Shield, Users } from 'lucide-react'

export default function LoginForm({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantSlug: 'nova-poshta'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDemo, setShowDemo] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sso/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        onLoginSuccess(result.user, result.tenant)
      } else {
        setError(result.error || 'Помилка входу до системи')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Помилка з\'єднання з сервером')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = (role) => {
    const demoUsers = {
      admin: { email: 'admin@novaposhta.ua', password: 'NovaPoshtaAdmin2025!' },
      hr: { email: 'hr@novaposhta.ua', password: 'NovaPoshtaHR2025!' },
      warehouse: { email: 'warehouse@novaposhta.ua', password: 'NovaPoshtaWH2025!' },
      courier: { email: 'courier@novaposhta.ua', password: 'NovaPoshta2025!' }
    }

    const demo = demoUsers[role]
    setFormData(prev => ({
      ...prev,
      email: demo.email,
      password: demo.password
    }))
    setShowDemo(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 200 80" className="w-10 h-8 text-red-600" fill="currentColor">
              {/* Nova Poshta Logo */}
              <path d="M15 15 L50 15 L50 25 L25 25 L25 35 L45 35 L45 45 L25 45 L25 55 L50 55 L50 65 L15 65 Z" />
              <path d="M60 15 L70 15 L85 45 L100 15 L110 15 L110 65 L100 65 L100 35 L90 55 L80 55 L70 35 L70 65 L60 65 Z" />
              <circle cx="130" cy="40" r="25" strokeWidth="8" stroke="currentColor" fill="none" />
              <path d="M120 40 L125 45 L140 30" strokeWidth="4" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="165" y="30" fontSize="12" fontWeight="bold" fill="currentColor">NOVA</text>
              <text x="165" y="50" fontSize="12" fontWeight="bold" fill="currentColor">POSHTA</text>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Nova KIC
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Комплексна інформаційна система для ефективного управління
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Електронна пошта</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                placeholder="ivan.petrov@novaposhta.ua"
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                placeholder="Введіть ваш пароль"
                required
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вхід до системи...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Увійти до системи
                </>
              )}
            </Button>

            {/* Demo Users Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowDemo(!showDemo)}
              disabled={isLoading}
            >
              <Users className="mr-2 h-4 w-4" />
              Демо-користувачі
            </Button>
          </form>

          {/* Demo Users Panel */}
          {showDemo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Тестові облікові записи:
              </h4>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleDemoLogin('admin')}
                >
                  <div>
                    <div className="font-medium">Системний адміністратор</div>
                    <div className="text-xs text-gray-500">admin@novaposhta.ua</div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleDemoLogin('hr')}
                >
                  <div>
                    <div className="font-medium">HR менеджер</div>
                    <div className="text-xs text-gray-500">hr@novaposhta.ua</div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleDemoLogin('warehouse')}
                >
                  <div>
                    <div className="font-medium">Менеджер складу</div>
                    <div className="text-xs text-gray-500">warehouse@novaposhta.ua</div>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleDemoLogin('courier')}
                >
                  <div>
                    <div className="font-medium">Курʼєр</div>
                    <div className="text-xs text-gray-500">courier@novaposhta.ua</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* System Info */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              Корпоративна SSO-авторизація v1.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Безпечний вхід для співробітників Нова Пошта
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}