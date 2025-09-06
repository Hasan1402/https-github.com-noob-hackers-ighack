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
            <svg viewBox="0 0 48 48" className="w-8 h-8 text-red-600" fill="currentColor">
              {/* Nova Poshta Logo - Stylized NP with package/mail elements */}
              
              {/* Main letter N */}
              <path d="M8 12 L8 36 L12 36 L12 26 L20 26 L20 36 L24 36 L24 12 L20 12 L20 22 L12 22 L12 12 Z" />
              
              {/* Letter P with modern design */}
              <path d="M28 12 L28 36 L32 36 L32 28 L38 28 Q42 28 42 24 L42 20 Q42 16 38 16 L32 16 L32 12 Z M32 20 L38 20 L38 24 L32 24 Z" />
              
              {/* Package/mail symbol in bottom right */}
              <rect x="34" y="30" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M34 30 L39 33 L44 30" stroke="currentColor" strokeWidth="1" fill="none" />
              
              {/* Decorative checkmark */}
              <circle cx="40" cy="8" r="4" strokeWidth="1" stroke="currentColor" fill="none" />
              <path d="M38 8 L39 9 L42 6" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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