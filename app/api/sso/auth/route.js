import { NextResponse } from 'next/server'
import { authenticateUser, verifyToken } from '../../../../lib/ssoAuth'
import { logAuditEvent } from '../../../../lib/auditLogger'
import connectDB from '../../../../lib/mongodb'

// POST /api/sso/auth - Login endpoint
export async function POST(request) {
  await connectDB()
  
  try {
    const body = await request.json()
    const { email, password, tenantSlug = 'nova-poshta' } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email та пароль обов\'язкові' },
        { status: 400 }
      )
    }
    
    // Get client info for audit logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    try {
      const authResult = await authenticateUser(email, password, tenantSlug)
      
      // Log successful login
      await logAuditEvent({
        userId: authResult.user.id,
        tenantId: authResult.user.tenantId,
        action: 'SSO_LOGIN_SUCCESS',
        resource: 'AUTH',
        details: {
          method: 'password',
          tenantSlug,
          accessLevel: authResult.user.accessLevel
        },
        ipAddress: clientIP,
        userAgent
      })
      
      // Create response with secure cookies
      const response = NextResponse.json({
        success: true,
        message: 'Успішний вхід до системи',
        user: authResult.user,
        tenant: authResult.tenant
      })
      
      // Set HTTP-only cookies for tokens
      response.cookies.set('access_token', authResult.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600 // 1 hour
      })
      
      response.cookies.set('refresh_token', authResult.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 604800 // 7 days
      })
      
      return response
      
    } catch (authError) {
      // Log failed login attempt
      await logAuditEvent({
        userId: 'anonymous',
        tenantId: 'unknown',
        action: 'SSO_LOGIN_FAILED',
        resource: 'AUTH',
        details: {
          email,
          tenantSlug,
          error: authError.message
        },
        ipAddress: clientIP,
        userAgent
      })
      
      // Handle different error types with Ukrainian messages
      let errorMessage = 'Помилка входу до системи'
      let statusCode = 401
      
      switch (authError.message) {
        case 'TENANT_NOT_FOUND':
          errorMessage = 'Організацію не знайдено'
          statusCode = 400
          break
        case 'INVALID_CREDENTIALS':
          errorMessage = 'Невірний email або пароль'
          break
        case 'PASSWORD_EXPIRED':
          errorMessage = 'Термін дії пароля минув. Зверніться до адміністратора'
          break
        default:
          if (authError.message.startsWith('ACCOUNT_LOCKED:')) {
            const minutes = authError.message.split(':')[1]
            errorMessage = `Обліковий запис заблоковано на ${minutes} хвилин`
          }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      )
    }
    
  } catch (error) {
    console.error('SSO Auth error:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/sso/auth - Verify token and get user info
export async function GET(request) {
  await connectDB()
  
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('access_token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const token = cookieToken || headerToken
    
    if (!token) {
      return NextResponse.json(
        { error: 'Токен не знайдено' },
        { status: 401 }
      )
    }
    
    try {
      const tokenData = await verifyToken(token)
      
      return NextResponse.json({
        success: true,
        user: {
          id: tokenData.user._id.toString(),
          email: tokenData.user.email,
          fullName: `${tokenData.user.firstName} ${tokenData.user.lastName}`,
          firstName: tokenData.user.firstName,
          lastName: tokenData.user.lastName,
          roles: tokenData.user.roles,
          department: tokenData.user.department,
          position: tokenData.user.position,
          accessLevel: tokenData.user.accessLevel,
          workLocation: tokenData.user.workLocation,
          tenantId: tokenData.user.tenantId,
          preferredLanguage: tokenData.user.preferredLanguage
        }
      })
      
    } catch (tokenError) {
      return NextResponse.json(
        { error: 'Невірний або застарілий токен' },
        { status: 401 }
      )
    }
    
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { error: 'Помилка перевірки токена' },
      { status: 500 }
    )
  }
}

// DELETE /api/sso/auth - Logout
export async function DELETE(request) {
  await connectDB()
  
  try {
    // Get user info from token before logout
    const cookieToken = request.cookies.get('access_token')?.value
    
    if (cookieToken) {
      try {
        const tokenData = await verifyToken(cookieToken)
        
        // Log logout
        await logAuditEvent({
          userId: tokenData.userId,
          tenantId: tokenData.tenantId,
          action: 'SSO_LOGOUT',
          resource: 'AUTH',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        })
      } catch (error) {
        // Token might be expired, continue with logout
      }
    }
    
    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Успішний вихід з системи'
    })
    
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Помилка виходу з системи' },
      { status: 500 }
    )
  }
}