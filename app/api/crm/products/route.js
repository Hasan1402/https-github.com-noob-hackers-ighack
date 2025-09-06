import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { Product, ProductCategory } from '../../../../lib/models/CRM'
import { verifyJWT } from '../../../../lib/ssoAuth'

// GET /api/crm/products - Отримати всі товари
export async function GET(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    
    // Фільтри
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const isService = searchParams.get('isService')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // Побудова запиту
    let query = { tenantId: user.tenantId }
    
    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId
    }
    
    if (isActive !== null && isActive !== 'all') {
      query.isActive = isActive === 'true'
    }
    
    if (isService !== null && isService !== 'all') {
      query.isService = isService === 'true'
    }
    
    // Пошук по тексту
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    const total = await Product.countDocuments(query)
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Помилка завантаження товарів' }, { status: 500 })
  }
}

// POST /api/crm/products - Створити новий товар
export async function POST(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    // Валідація
    if (!body.name || !body.sku || body.price === undefined) {
      return NextResponse.json({ 
        error: 'Обовʼязкові поля: назва, артикул та ціна' 
      }, { status: 400 })
    }
    
    // Перевірка унікальності артикула
    const existingProduct = await Product.findOne({ 
      sku: body.sku, 
      tenantId: user.tenantId 
    })
    
    if (existingProduct) {
      return NextResponse.json({ 
        error: 'Товар з таким артикулом вже існує' 
      }, { status: 400 })
    }
    
    // Створення товару
    const productData = {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      sku: body.sku,
      description: body.description,
      categoryId: body.categoryId,
      categoryName: body.categoryName,
      price: body.price,
      cost: body.cost || 0,
      currency: body.currency || 'UAH',
      stockQuantity: body.stockQuantity || 0,
      minStockLevel: body.minStockLevel || 0,
      unit: body.unit || 'шт',
      isActive: body.isActive !== undefined ? body.isActive : true,
      isService: body.isService || false,
      images: body.images || [],
      vatRate: body.vatRate || 20,
      createdBy: user.id,
      tenantId: user.tenantId
    }
    
    const product = await Product.create(productData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Товар створено успішно',
      product
    })
    
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Помилка створення товару' }, { status: 500 })
  }
}

// PUT /api/crm/products - Оновити товар
export async function PUT(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID товару обовʼязковий' }, { status: 400 })
    }
    
    const existingProduct = await Product.findOne({ 
      id: body.id, 
      tenantId: user.tenantId 
    })
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Товар не знайдено' }, { status: 404 })
    }
    
    // Перевірка унікальності артикула (якщо змінюється)
    if (body.sku && body.sku !== existingProduct.sku) {
      const duplicateSku = await Product.findOne({ 
        sku: body.sku, 
        tenantId: user.tenantId,
        id: { $ne: body.id }  // Виключити поточний товар
      })
      
      if (duplicateSku) {
        return NextResponse.json({ 
          error: 'Товар з таким артикулом вже існує' 
        }, { status: 400 })
      }
    }
    
    // Оновлення
    const updateData = {
      ...body,
      updatedAt: new Date(),
      tenantId: user.tenantId
    }
    
    delete updateData.id
    delete updateData.createdAt
    delete updateData.createdBy
    
    const updatedProduct = await Product.findOneAndUpdate(
      { id: body.id, tenantId: user.tenantId },
      updateData,
      { new: true, lean: true }
    )
    
    return NextResponse.json({ 
      success: true, 
      message: 'Товар оновлено успішно',
      product: updatedProduct
    })
    
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Помилка оновлення товару' }, { status: 500 })
  }
}

// DELETE /api/crm/products - Видалити товар
export async function DELETE(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyJWT(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')
    
    if (!productId) {
      return NextResponse.json({ error: 'ID товару обовʼязковий' }, { status: 400 })
    }
    
    const deletedProduct = await Product.findOneAndDelete({ 
      id: productId, 
      tenantId: user.tenantId 
    })
    
    if (!deletedProduct) {
      return NextResponse.json({ error: 'Товар не знайдено' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Товар видалено успішно'
    })
    
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Помилка видалення товару' }, { status: 500 })
  }
}