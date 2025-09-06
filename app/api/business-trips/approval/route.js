import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { BusinessTrip } from '../../../../lib/models/BusinessTrip'
import { verifyToken } from '../../../../lib/ssoAuth'

// POST /api/business-trips/approval - Обробити узгодження відрядження
export async function POST(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const data = await request.json()
    
    const { tripId, action, comment, stage } = data
    
    // Валідація
    if (!tripId || !action || !stage) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: ID відрядження, дія, етап' },
        { status: 400 }
      )
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Дія повинна бути "approve" або "reject"' },
        { status: 400 }
      )
    }
    
    // Знайти відрядження
    const trip = await BusinessTrip.findOne({ 
      _id: tripId, 
      tenantId: user.tenantId 
    })
    
    if (!trip) {
      return NextResponse.json(
        { error: 'Відрядження не знайдено' },
        { status: 404 }
      )
    }
    
    // Перевірити, чи можна обробляти це узгодження
    const currentStage = trip.approvalWorkflow.find(w => w.stage === stage)
    
    if (!currentStage || currentStage.status !== 'pending') {
      return NextResponse.json(
        { error: 'Цей етап узгодження вже оброблено або недоступний' },
        { status: 400 }
      )
    }
    
    // Оновити статус етапу узгодження
    const updatedWorkflow = trip.approvalWorkflow.map(w => {
      if (w.stage === stage) {
        return {
          ...w,
          status: action === 'approve' ? 'approved' : 'rejected',
          approverName: user.fullName,
          approverId: user.id,
          comment: comment || '',
          processedAt: new Date()
        }
      }
      return w
    })
    
    // Визначити новий статус відрядження
    let newStatus = trip.status
    
    if (action === 'reject') {
      newStatus = 'rejected'
    } else if (action === 'approve') {
      if (stage === 'manager') {
        // Після погодження керівника - фінансове погодження
        newStatus = 'finance_review'
        // Додати етап фінансового погодження, якщо його ще немає
        if (!updatedWorkflow.find(w => w.stage === 'finance')) {
          updatedWorkflow.push({
            stage: 'finance',
            status: 'pending'
          })
        }
      } else if (stage === 'finance') {
        // Після фінансового погодження - затверджено
        newStatus = 'approved'
        updatedWorkflow.push({
          stage: 'final',
          status: 'approved',
          approverName: 'Система',
          approverId: 'system',
          processedAt: new Date()
        })
      }
    }
    
    // Оновити відрядження
    const updatedTrip = await BusinessTrip.findByIdAndUpdate(
      tripId,
      {
        status: newStatus,
        approvalWorkflow: updatedWorkflow,
        updatedBy: user.id,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    // Повідомлення для логів або нотифікацій
    const actionText = action === 'approve' ? 'затверджено' : 'відхилено'
    const stageText = stage === 'manager' ? 'керівником' : stage === 'finance' ? 'фінансовим відділом' : 'системою'
    
    return NextResponse.json({
      trip: updatedTrip,
      message: `Відрядження ${actionText} ${stageText}`
    })
    
  } catch (error) {
    console.error('Error processing trip approval:', error)
    return NextResponse.json(
      { error: 'Помилка обробки узгодження' },
      { status: 500 }
    )
  }
}

// GET /api/business-trips/approval - Отримати відрядження для узгодження
export async function GET(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    
    const stage = searchParams.get('stage') // 'manager' або 'finance'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // Побудова запиту залежно від ролі користувача та етапу
    let query = { tenantId: user.tenantId }
    
    if (stage === 'manager') {
      query.status = 'manager_review'
      query['approvalWorkflow.stage'] = 'manager'
      query['approvalWorkflow.status'] = 'pending'
    } else if (stage === 'finance') {
      query.status = 'finance_review'
      query['approvalWorkflow.stage'] = 'finance'
      query['approvalWorkflow.status'] = 'pending'
    } else {
      // Всі відрядження, що потребують узгодження
      query.status = { $in: ['manager_review', 'finance_review'] }
    }
    
    const skip = (page - 1) * limit
    
    const trips = await BusinessTrip.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await BusinessTrip.countDocuments(query)
    
    // Статистика для керівника/фінансового відділу
    const pendingStats = await BusinessTrip.aggregate([
      { $match: { tenantId: user.tenantId } },
      { $unwind: '$approvalWorkflow' },
      {
        $match: {
          'approvalWorkflow.status': 'pending'
        }
      },
      {
        $group: {
          _id: '$approvalWorkflow.stage',
          count: { $sum: 1 }
        }
      }
    ])
    
    const statistics = pendingStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})
    
    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics
    })
    
  } catch (error) {
    console.error('Error fetching trips for approval:', error)
    return NextResponse.json(
      { error: 'Помилка завантаження відряджень для узгодження' },
      { status: 500 }
    )
  }
}

// PUT /api/business-trips/approval - Масове узгодження
export async function PUT(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const data = await request.json()
    
    const { tripIds, action, comment, stage } = data
    
    // Валідація
    if (!tripIds || !Array.isArray(tripIds) || !action || !stage) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: список ID, дія, етап' },
        { status: 400 }
      )
    }
    
    const results = []
    const errors = []
    
    // Обробити кожне відрядження
    for (const tripId of tripIds) {
      try {
        const trip = await BusinessTrip.findOne({ 
          _id: tripId, 
          tenantId: user.tenantId 
        })
        
        if (!trip) {
          errors.push({ tripId, error: 'Відрядження не знайдено' })
          continue
        }
        
        // Перевірити етап узгодження
        const currentStage = trip.approvalWorkflow.find(w => w.stage === stage)
        
        if (!currentStage || currentStage.status !== 'pending') {
          errors.push({ tripId, error: 'Етап узгодження недоступний' })
          continue
        }
        
        // Оновити узгодження (аналогічно POST методу)
        const updatedWorkflow = trip.approvalWorkflow.map(w => {
          if (w.stage === stage) {
            return {
              ...w,
              status: action === 'approve' ? 'approved' : 'rejected',
              approverName: user.fullName,
              approverId: user.id,
              comment: comment || '',
              processedAt: new Date()
            }
          }
          return w
        })
        
        let newStatus = trip.status
        
        if (action === 'reject') {
          newStatus = 'rejected'
        } else if (action === 'approve') {
          if (stage === 'manager') {
            newStatus = 'finance_review'
            if (!updatedWorkflow.find(w => w.stage === 'finance')) {
              updatedWorkflow.push({
                stage: 'finance',
                status: 'pending'
              })
            }
          } else if (stage === 'finance') {
            newStatus = 'approved'
            updatedWorkflow.push({
              stage: 'final',
              status: 'approved',
              approverName: 'Система',
              approverId: 'system',
              processedAt: new Date()
            })
          }
        }
        
        await BusinessTrip.findByIdAndUpdate(tripId, {
          status: newStatus,
          approvalWorkflow: updatedWorkflow,
          updatedBy: user.id,
          updatedAt: new Date()
        })
        
        results.push({ tripId, status: 'success' })
        
      } catch (error) {
        errors.push({ tripId, error: error.message })
      }
    }
    
    return NextResponse.json({
      results,
      errors,
      summary: {
        processed: results.length,
        failed: errors.length,
        total: tripIds.length
      }
    })
    
  } catch (error) {
    console.error('Error processing bulk approval:', error)
    return NextResponse.json(
      { error: 'Помилка масового узгодження' },
      { status: 500 }
    )
  }
}