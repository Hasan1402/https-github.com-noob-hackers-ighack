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
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Trash2,
  Filter,
  Download,
  Tag,
  DollarSign,
  Boxes,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export default function ProductsManagement({ user }) {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    categoryName: '',
    price: 0,
    cost: 0,
    currency: 'UAH',
    stockQuantity: 0,
    minStockLevel: 0,
    unit: 'шт',
    isActive: true,
    isService: false,
    vatRate: 20,
    images: []
  })

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parentId: 'none'
  })

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    services: 0,
    lowStock: 0,
    totalValue: 0
  })

  // Mock data
  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    const mockCategories = [
      {
        id: 'cat-001',
        name: 'Логістичні послуги',
        description: 'Основні логістичні та транспортні послуги',
        parentId: null
      },
      {
        id: 'cat-002',
        name: 'Внутрішні перевезення',
        description: 'Перевезення по Україні',
        parentId: 'cat-001'
      },
      {
        id: 'cat-003',
        name: 'Міжнародні перевезення',
        description: 'Міжнародна логістика',
        parentId: 'cat-001'
      },
      {
        id: 'cat-004',
        name: 'Складські послуги',
        description: 'Зберігання та обробка товарів',
        parentId: null
      },
      {
        id: 'cat-005',
        name: 'Додаткові послуги',
        description: 'Супутні послуги та сервіси',
        parentId: null
      }
    ]

    const mockProducts = [
      {
        id: 'product-001',
        name: 'Стандартна внутрішня доставка',
        sku: 'DELIV-STD-001',
        description: 'Стандартна доставка по Україні вагою до 30 кг',
        categoryId: 'cat-002',
        categoryName: 'Внутрішні перевезення',
        price: 150,
        cost: 100,
        currency: 'UAH',
        stockQuantity: 0,
        minStockLevel: 0,
        unit: 'послуга',
        isActive: true,
        isService: true,
        vatRate: 20,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-002',
        name: 'Експрес доставка',
        sku: 'DELIV-EXP-001',
        description: 'Терміна доставка протягом 24 годин',
        categoryId: 'cat-002',
        categoryName: 'Внутрішні перевезення',
        price: 300,
        cost: 200,
        currency: 'UAH',
        stockQuantity: 0,
        minStockLevel: 0,
        unit: 'послуга',
        isActive: true,
        isService: true,
        vatRate: 20,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-003',
        name: 'Міжнародна експрес доставка',
        sku: 'DELIV-INT-001',
        description: 'Міжнародна доставка в країни ЄС',
        categoryId: 'cat-003',
        categoryName: 'Міжнародні перевезення',
        price: 1200,
        cost: 800,
        currency: 'UAH',
        stockQuantity: 0,
        minStockLevel: 0,
        unit: 'послуга',
        isActive: true,
        isService: true,
        vatRate: 0,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-004',
        name: 'Короткострокове зберігання',
        sku: 'STOR-SHORT-001',
        description: 'Зберігання товарів до 30 днів',
        categoryId: 'cat-004',
        categoryName: 'Складські послуги',
        price: 50,
        cost: 30,
        currency: 'UAH',
        stockQuantity: 0,
        minStockLevel: 0,
        unit: 'день/м³',
        isActive: true,
        isService: true,
        vatRate: 20,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-005',
        name: 'Упаковочні матеріали',
        sku: 'PACK-MAT-001',
        description: 'Коробки, плівка, наповнювач',
        categoryId: 'cat-005',
        categoryName: 'Додаткові послуги',
        price: 25,
        cost: 15,
        currency: 'UAH',
        stockQuantity: 500,
        minStockLevel: 100,
        unit: 'комплект',
        isActive: true,
        isService: false,
        vatRate: 20,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-006',
        name: 'Страхування вантажу',
        sku: 'INSUR-001',
        description: 'Страхування товарів під час транспортування',
        categoryId: 'cat-005',
        categoryName: 'Додаткові послуги',
        price: 100,
        cost: 50,
        currency: 'UAH',
        stockQuantity: 0,
        minStockLevel: 0,
        unit: 'полica',
        isActive: true,
        isService: true,
        vatRate: 0,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-007',
        name: 'Паллети дерев\'яні',
        sku: 'PALLET-WOOD-001',
        description: 'Стандартні дерев\'яні паллети 120x80 см',
        categoryId: 'cat-005',
        categoryName: 'Додаткові послуги',
        price: 200,
        cost: 150,
        currency: 'UAH',
        stockQuantity: 45,
        minStockLevel: 50,
        unit: 'шт',
        isActive: true,
        isService: false,
        vatRate: 20,
        images: [],
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-01T14:30:00Z'
      },
      {
        id: 'product-008',
        name: 'Спеціальна доставка (архів)',
        sku: 'DELIV-SPEC-OLD',
        description: 'Застаріла послуга спеціальної доставки',
        categoryId: 'cat-002',
        categoryName: 'Внутрішні перевезення',
        price: 400,
        cost: 250,
        currency: 'UAH',
        stockQuantity: 0,
        minStockLevel: 0,
        unit: 'послуга',
        isActive: false,
        isService: true,
        vatRate: 20,
        images: [],
        createdAt: '2024-05-01T09:00:00Z',
        updatedAt: '2024-11-01T14:30:00Z'
      }
    ]
    
    setCategories(mockCategories)
    setProducts(mockProducts)
    setFilteredProducts(mockProducts)
    updateStats(mockProducts)
  }

  const updateStats = (productsData) => {
    const stats = {
      total: productsData.length,
      active: productsData.filter(p => p.isActive).length,
      inactive: productsData.filter(p => !p.isActive).length,
      services: productsData.filter(p => p.isService).length,
      lowStock: productsData.filter(p => !p.isService && p.stockQuantity <= p.minStockLevel).length,
      totalValue: productsData.filter(p => !p.isService).reduce((sum, p) => sum + (p.stockQuantity * p.cost), 0)
    }
    setStats(stats)
  }

  useEffect(() => {
    filterProducts()
  }, [searchTerm, filterCategory, filterStatus, filterType, products])

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === filterCategory)
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(product => 
        filterStatus === 'active' ? product.isActive : !product.isActive
      )
    }

    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(product =>
        filterType === 'service' ? product.isService : !product.isService
      )
    }

    setFilteredProducts(filtered)
    updateStats(filtered)
  }

  const handleCreateProduct = async () => {
    try {
      setIsLoading(true)
      
      // Find category name
      const category = categories.find(c => c.id === productForm.categoryId)
      
      const newProduct = {
        id: `product-${Date.now()}`,
        ...productForm,
        categoryName: category?.name || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setProducts(prev => [newProduct, ...prev])
      setShowCreateDialog(false)
      resetProductForm()
      toast.success('Товар створено успішно')
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Помилка створення товару')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      const newCategory = {
        id: `cat-${Date.now()}`,
        ...categoryForm,
        parentId: categoryForm.parentId === 'none' ? null : categoryForm.parentId,
        createdAt: new Date().toISOString()
      }

      setCategories(prev => [newCategory, ...prev])
      setShowCategoryDialog(false)
      setCategoryForm({ name: '', description: '', parentId: 'none' })
      toast.success('Категорію створено успішно')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Помилка створення категорії')
    }
  }

  const resetProductForm = () => {
    setProductForm({
      name: '',
      sku: '',
      description: '',
      categoryId: '',
      categoryName: '',
      price: 0,
      cost: 0,
      currency: 'UAH',
      stockQuantity: 0,
      minStockLevel: 0,
      unit: 'шт',
      isActive: true,
      isService: false,
      vatRate: 20,
      images: []
    })
  }

  const getStockBadge = (product) => {
    if (product.isService) {
      return <Badge className="bg-blue-100 text-blue-800">Послуга</Badge>
    }
    
    if (product.stockQuantity <= product.minStockLevel) {
      return <Badge className="bg-red-100 text-red-800">Низький залишок</Badge>
    }
    
    return <Badge className="bg-green-100 text-green-800">В наявності</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Товари та послуги</h2>
          <p className="text-gray-600">Управління каталогом продукції</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Категорії
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Експорт
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Додати товар
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Додати новий товар/послугу</DialogTitle>
              </DialogHeader>

              <ProductForm
                form={productForm}
                setForm={setProductForm}
                categories={categories}
                onSubmit={handleCreateProduct}
                onCancel={() => {
                  setShowCreateDialog(false)
                  resetProductForm()
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всього позицій</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активні</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Неактивні</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Послуги</p>
                <p className="text-2xl font-bold text-purple-600">{stats.services}</p>
              </div>
              <Boxes className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Низький залишок</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Вартість запасів</p>
                <p className="text-xl font-bold text-indigo-600">
                  {Math.round(stats.totalValue).toLocaleString()} ₴
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Пошук товарів та послуг..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Категорія" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі категорії</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі</SelectItem>
                <SelectItem value="active">Активні</SelectItem>
                <SelectItem value="inactive">Неактивні</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі типи</SelectItem>
                <SelectItem value="service">Послуги</SelectItem>
                <SelectItem value="product">Товари</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Товарів не знайдено</h3>
                <p className="text-gray-600">Додайте перший товар або змініть критерії пошуку</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(product) => {
                setSelectedProduct(product)
                setShowDetailsDialog(true)
              }}
              onEdit={(product) => {
                setSelectedProduct(product)
                setProductForm(product)
                setShowEditDialog(true)
              }}
              getStockBadge={getStockBadge}
            />
          ))
        )}
      </div>

      {/* Product Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати товар/послугу</DialogTitle>
          </DialogHeader>

          <ProductForm
            form={productForm}
            setForm={setProductForm}
            categories={categories}
            onSubmit={async () => {
              try {
                setIsLoading(true)
                
                // Find category name
                const category = categories.find(c => c.id === productForm.categoryId)
                
                const updatedProduct = {
                  ...selectedProduct,
                  ...productForm,
                  categoryName: category?.name || '',
                  updatedAt: new Date().toISOString()
                }

                setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updatedProduct : p))
                setShowEditDialog(false)
                toast.success('Товар оновлено успішно')
              } catch (error) {
                console.error('Error updating product:', error)
                toast.error('Помилка оновлення товару')
              } finally {
                setIsLoading(false)
              }
            }}
            onCancel={() => {
              setShowEditDialog(false)
              resetProductForm()
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі товару/послуги</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <ProductDetails product={selectedProduct} getStockBadge={getStockBadge} />
          )}
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Створити категорію</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Назва категорії *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Назва категорії"
              />
            </div>

            <div>
              <Label htmlFor="categoryDescription">Опис</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Опис категорії"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="parentCategory">Батьківська категорія</Label>
              <Select 
                value={categoryForm.parentId} 
                onValueChange={(value) => setCategoryForm(prev => ({ ...prev, parentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Немає (кореневий рівень)</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Скасувати
              </Button>
              <Button onClick={handleCreateCategory} className="bg-red-600 hover:bg-red-700">
                Створити категорію
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Product Card Component
function ProductCard({ product, onViewDetails, onEdit, getStockBadge }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
            <p className="text-xs text-gray-500 font-mono mb-2">SKU: {product.sku}</p>
            <div className="flex items-center space-x-2 mb-2">
              {getStockBadge(product)}
              {!product.isActive && (
                <Badge className="bg-gray-100 text-gray-800">Неактивний</Badge>
              )}
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(product)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(product)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4" onClick={() => onViewDetails(product)}>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Категорія:</span> {product.categoryName}
          </div>
          
          <div className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Ціна:</span>
            <span className="font-bold">
              {product.price.toLocaleString()} ₴/{product.unit}
            </span>
          </div>
          
          {!product.isService && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Залишок:</span>
              <span className={product.stockQuantity <= product.minStockLevel ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {product.stockQuantity} {product.unit}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>ПДВ: {product.vatRate}%</span>
          <span>{product.isService ? 'Послуга' : 'Товар'}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Product Form Component
function ProductForm({ form, setForm, categories, onSubmit, onCancel, isLoading = false }) {
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Основні дані</TabsTrigger>
        <TabsTrigger value="pricing">Ціни та залишки</TabsTrigger>
        <TabsTrigger value="settings">Налаштування</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div>
          <Label htmlFor="name">Назва *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="Назва товару або послуги"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">Артикул (SKU) *</Label>
            <Input
              id="sku"
              value={form.sku}
              onChange={(e) => updateForm('sku', e.target.value)}
              placeholder="PROD-001"
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="unit">Одиниця вимірювання</Label>
            <Input
              id="unit"
              value={form.unit}
              onChange={(e) => updateForm('unit', e.target.value)}
              placeholder="шт, кг, послуга"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="categoryId">Категорія</Label>
          <Select value={form.categoryId} onValueChange={(value) => updateForm('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Виберіть категорію" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Опис</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="Детальний опис товару або послуги"
            rows={3}
          />
        </div>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Ціна продажу (₴) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => updateForm('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="cost">Собівартість (₴)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(e) => updateForm('cost', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>

        {!form.isService && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockQuantity">Поточний залишок</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={form.stockQuantity}
                onChange={(e) => updateForm('stockQuantity', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="minStockLevel">Мінімальний залишок</Label>
              <Input
                id="minStockLevel"
                type="number"
                value={form.minStockLevel}
                onChange={(e) => updateForm('minStockLevel', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="vatRate">Ставка ПДВ (%)</Label>
          <Select value={form.vatRate.toString()} onValueChange={(value) => updateForm('vatRate', parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (без ПДВ)</SelectItem>
              <SelectItem value="20">20% (стандартна ставка)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isService}
              onChange={(e) => updateForm('isService', e.target.checked)}
            />
            <span className="text-sm">Це послуга (не товар)</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateForm('isActive', e.target.checked)}
            />
            <span className="text-sm">Активний</span>
          </label>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Зображення товару</h4>
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Завантаження зображень буде додано в наступних версіях</p>
            </div>
          </div>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Скасувати
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
          {isLoading ? 'Створення...' : 'Створити товар'}
        </Button>
      </div>
    </Tabs>
  )
}

// Product Details Component
function ProductDetails({ product, getStockBadge }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-500 font-mono mt-1">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStockBadge(product)}
            {!product.isActive && (
              <Badge className="bg-gray-100 text-gray-800">Неактивний</Badge>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          Створено: {format(new Date(product.createdAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
          {product.updatedAt !== product.createdAt && (
            <span className="ml-4">
              Оновлено: {format(new Date(product.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: uk })}
            </span>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Основна інформація</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Категорія:</span>
              <span className="font-medium">{product.categoryName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Тип:</span>
              <span className="font-medium">
                {product.isService ? 'Послуга' : 'Товар'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Одиниця:</span>
              <span className="font-medium">{product.unit}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">ПДВ:</span>
              <span className="font-medium">{product.vatRate}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Статус:</span>
              <span className={`font-medium ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {product.isActive ? 'Активний' : 'Неактивний'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ціни та залишки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ціна продажу:</span>
              <span className="font-bold text-xl">
                {product.price.toLocaleString()} ₴/{product.unit}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Собівартість:</span>
              <span className="font-medium">
                {product.cost.toLocaleString()} ₴/{product.unit}
              </span>
            </div>
            
            {product.price > 0 && product.cost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Маржа:</span>
                <span className="font-medium text-green-600">
                  {Math.round(((product.price - product.cost) / product.price) * 100)}%
                </span>
              </div>
            )}
            
            {!product.isService && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">В наявності:</span>
                  <span className={`font-medium ${product.stockQuantity <= product.minStockLevel ? 'text-red-600' : 'text-gray-900'}`}>
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Мінімальний залишок:</span>
                  <span className="font-medium">{product.minStockLevel} {product.unit}</span>
                </div>
                
                {product.stockQuantity > 0 && product.cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Вартість запасів:</span>
                    <span className="font-bold text-purple-600">
                      {(product.stockQuantity * product.cost).toLocaleString()} ₴
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Опис</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Зображення</CardTitle>
        </CardHeader>
        <CardContent>
          {product.images && product.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={image.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Зображення не додані</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Warning */}
      {!product.isService && product.stockQuantity <= product.minStockLevel && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">Низький залишок товару</h4>
                <p className="text-sm text-orange-700">
                  Поточний залишок ({product.stockQuantity} {product.unit}) менший або дорівнює мінімальному рівню 
                  ({product.minStockLevel} {product.unit}). Рекомендується поповнити запаси.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Analytics */}
      {!product.isService && product.stockQuantity > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Аналітика товару</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{product.stockQuantity}</div>
                <div className="text-sm text-blue-800">В наявності</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(product.stockQuantity * product.cost).toLocaleString()}₴
                </div>
                <div className="text-sm text-green-800">Вартість запасів</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {product.price > 0 && product.cost > 0 
                    ? Math.round(((product.price - product.cost) / product.price) * 100) + '%'
                    : '0%'
                  }
                </div>
                <div className="text-sm text-purple-800">Маржа</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.max(0, product.minStockLevel - product.stockQuantity)}
                </div>
                <div className="text-sm text-orange-800">До мінімуму</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}