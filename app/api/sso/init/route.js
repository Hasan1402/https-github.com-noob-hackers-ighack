import { NextResponse } from 'next/server'
import { initializeNovaPoshtaTenant } from '../../../lib/seedTenant'

// GET /api/sso/init - Initialize Nova Poshta tenant and users
export async function GET() {
  try {
    // Check if this is a development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Ініціалізація дозволена тільки в режимі розробки' },
        { status: 403 }
      )
    }
    
    await initializeNovaPoshtaTenant()
    
    return NextResponse.json({
      success: true,
      message: 'Успішно ініціалізовано систему Нова Пошта',
      users: [
        {
          role: 'Системний адміністратор',
          email: 'admin@novaposhta.ua',
          password: 'NovaPoshtaAdmin2025!'
        },
        {
          role: 'HR менеджер',
          email: 'hr@novaposhta.ua', 
          password: 'NovaPoshtaHR2025!'
        },
        {
          role: 'Менеджер складу',
          email: 'warehouse@novaposhta.ua',
          password: 'NovaPoshtaWH2025!'
        },
        {
          role: 'Курʼєр',
          email: 'courier@novaposhta.ua',
          password: 'NovaPoshta2025!'
        }
      ]
    })
    
  } catch (error) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      { error: 'Помилка ініціалізації системи' },
      { status: 500 }
    )
  }
}

// POST /api/sso/init - Force re-initialization (dev only)
export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Переініціалізація дозволена тільки в режимі розробки' },
        { status: 403 }
      )
    }
    
    // This could include cleanup logic if needed
    await initializeNovaPoshtaTenant()
    
    return NextResponse.json({
      success: true,
      message: 'Система переініціалізована успішно'
    })
    
  } catch (error) {
    console.error('Re-initialization error:', error)
    return NextResponse.json(
      { error: 'Помилка переініціалізації' },
      { status: 500 }
    )
  }
}