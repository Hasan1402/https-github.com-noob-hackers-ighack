import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { Product, ProductCategory } from '../../../../lib/models/CRM'
import { verifyToken } from '../../../../lib/ssoAuth'

// GET /api/crm/products - Отримати всі товари/послуги
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
    
    // Фільтри
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const isService = searchParams.get('isService')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    
    // Побудова запиту
    let query = { tenantId: user.tenantId }
    
    if (category && category !== 'all') {
      query.categoryId = category
    }
    
    if (isActive && isActive !== 'all') {
      query.isActive = isActive === 'true'
    }
    
    if (isService && isService !== 'all') {
      query.isService = isService === 'true'
    }
    
    // Пошук по тексту
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categoryName: { $regex: search, $options: 'i' } }
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
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Помилка завантаження товарів' },
      { status: 500 }
    )
  }
}

// POST /api/crm/products - Створити новий товар/послугу
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
    
    // Валідація обов'язкових полів
    if (!data.name || !data.categoryId || !data.price) {
      return NextResponse.json(
        { error: 'Обов\'язкові поля: назва, категорія, ціна' },
        { status: 400 }
      )
    }
    
    // Перевірка унікальності SKU
    if (data.sku) {
      const existingProduct = await Product.findOne({ 
        sku: data.sku, 
        tenantId: user.tenantId 
      })
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Товар з таким артикулом вже існує' },
          { status: 400 }
        )
      }
    }
    
    // Отримати назву категорії
    const category = await ProductCategory.findById(data.categoryId)
    const categoryName = category ? category.name : ''
    
    const newProduct = new Product({
      ...data,
      categoryName,
      tenantId: user.tenantId,
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    await newProduct.save()
    
    return NextResponse.json(newProduct, { status: 201 })
    
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Помилка створення товару' },
      { status: 500 }
    )
  }
}

// PUT /api/crm/products - Оновити товар/послугу
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
    const { id, ...updateData } = data
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID товару не вказано' },
        { status: 400 }
      )
    }
    
    // Валідація обов'язкових полів
    if (updateData.name !== undefined && !updateData.name) {
      return NextResponse.json(
        { error: 'Назва товару не може бути пустою' },
        { status: 400 }
      )
    }
    
    // Перевірка унікальності SKU (якщо змінюється)
    if (updateData.sku) {
      const existingProduct = await Product.findOne({ 
        sku: updateData.sku, 
        tenantId: user.tenantId,
        _id: { $ne: id }
      })
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Товар з таким артикулом вже існує' },
          { status: 400 }
        )
      }
    }
    
    // Отримати назву категорії (якщо змінилася)
    if (updateData.categoryId) {
      const category = await ProductCategory.findById(updateData.categoryId)
      updateData.categoryName = category ? category.name : ''
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId },
      { 
        ...updateData,
        updatedBy: user.id,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Товар не знайдено' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedProduct)
    
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Помилка оновлення товару' },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/products - Видалити товар/послугу
export async function DELETE(request) {
  await connectDB()
  
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Авторизація потрібна' }, { status: 401 })
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID товару не вказано' },
        { status: 400 }
      )
    }
    
    const deletedProduct = await Product.findOneAndDelete({
      _id: id,
      tenantId: user.tenantId
    })
    
    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Товар не знайдено' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Товар успішно видалено',
      deletedProduct 
    })
    
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Помилка видалення товару' },
      { status: 500 }
    )
  }
}