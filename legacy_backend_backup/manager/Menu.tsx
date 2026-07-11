import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataGrid } from '../../components/ui/DataGrid'
import { Form } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
  Tag,
  Package,
  DollarSign,
  RefreshCw,
  Layers,
  X,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

interface Product {
  id: string
  name: string
  description?: string
  category_id: string
  price: number
  image_url?: string
  available: boolean
  created_at: string
  updated_at: string
}

interface Modifier {
  id: string
  name: string
  type: 'extra' | 'topping' | 'size' | 'variant'
  options: ModifierOption[]
  required: boolean
  created_at: string
}

interface ModifierOption {
  id: string
  modifier_id: string
  name: string
  price_adjustment: number
}

export default function Menu() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'modifiers'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedItem, setSelectedItem] = useState<Product | Category | Modifier | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formLoading, setFormLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([])
  const [skipNextLoad, setSkipNextLoad] = useState(false)

  useEffect(() => {
    if (skipNextLoad) {
      setSkipNextLoad(false)
      return
    }
    
    loadData()
    
    // Test Supabase connection
    async function testConnection() {
      try {
        const { data, error } = await supabase.from('products').select('id').limit(1)
        if (error) {
          console.error('Supabase connection test failed:', error)
          toast.error('Database connection error. Check console for details.')
        } else {
          console.log('Supabase connection successful')
        }
      } catch (error) {
        console.error('Supabase connection error:', error)
        toast.error('Failed to connect to database')
      }
    }
    testConnection()
    
    // Set up Supabase Realtime subscription for products
    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Realtime product change:', payload)
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [...prev, payload.new as Product])
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p))
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe()

    // Set up Supabase Realtime subscription for categories
    const categoriesSubscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        console.log('Realtime category change:', payload)
        if (payload.eventType === 'INSERT') {
          console.log('Category INSERT event:', payload.new)
          setCategories(prev => [...prev, payload.new as Category])
        } else if (payload.eventType === 'UPDATE') {
          console.log('Category UPDATE event:', payload.new)
          setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new as Category : c))
        } else if (payload.eventType === 'DELETE') {
          console.log('Category DELETE event:', payload.old)
          setCategories(prev => prev.filter(c => c.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      productsSubscription.unsubscribe()
      categoriesSubscription.unsubscribe()
    }
  }, [activeTab, searchQuery, selectedCategory])

  async function loadData() {
    try {
      setLoading(true)
      
      if (activeTab === 'products') {
        let query = supabase.from('products').select('*, categories(name)').eq('tenant_id', user?.tenant_id).order('name')
        
        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory)
        }
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }
        
        const { data, error } = await query
        if (error) throw error
        setProducts(data || [])
      } else if (activeTab === 'categories') {
        let query = supabase.from('categories').select('*').eq('tenant_id', user?.tenant_id).order('name')
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }
        
        const { data, error } = await query
        if (error) throw error
        setCategories(data || [])
      } else if (activeTab === 'modifiers') {
        const { data, error } = await supabase
          .from('toppings')
          .select('*')
          .eq('tenant_id', user?.tenant_id)
          .order('name')
        if (error) throw error
        setModifiers(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setProducts([])
      setCategories([])
      setModifiers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProduct(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating product with data:', data)
      
      // Check for duplicate barcode
      if (data.barcode) {
        const { data: existingBarcode } = await supabase
          .from('products')
          .select('id')
          .eq('barcode', data.barcode)
          .eq('tenant_id', user?.tenant_id)
          .single()
        if (existingBarcode) {
          toast.error('A product with this barcode already exists')
          setFormLoading(false)
          return
        }
      }
      
      // Check for duplicate SKU
      if (data.sku) {
        const { data: existingSKU } = await supabase
          .from('products')
          .select('id')
          .eq('sku', data.sku)
          .eq('tenant_id', user?.tenant_id)
          .single()
        if (existingSKU) {
          toast.error('A product with this SKU already exists')
          setFormLoading(false)
          return
        }
      }
      
      const { error, data: result } = await supabase.from('products').insert({
        name: data.name,
        product_code: data.product_code,
        description: data.full_description || data.description,
        short_description: data.short_description,
        category_id: data.category_id,
        barcode: data.barcode,
        sku: data.sku,
        cost_price: parseFloat(data.cost_price) || 0,
        selling_price: parseFloat(data.selling_price) || parseFloat(data.price) || 0,
        tax_rate: parseFloat(data.tax_rate) || 0,
        service_charge: parseFloat(data.service_charge) || 0,
        discount_price: parseFloat(data.discount_price) || null,
        currency: data.currency || 'USD',
        preparation_time: parseInt(data.preparation_time) || 0,
        image_url: data.image_url,
        is_available: data.status === 'active',
        kitchen_printer: data.kitchen_printer,
        tenant_id: user?.tenant_id,
        // Inventory fields
        track_inventory: data.track_inventory || false,
        current_stock: parseInt(data.current_stock) || 0,
        min_stock_level: parseInt(data.min_stock_level) || 0,
        max_stock_level: parseInt(data.max_stock_level) || 0,
        reorder_level: parseInt(data.reorder_level) || 0,
        unit: data.unit || 'piece',
        // Restaurant options
        available_dine_in: data.available_dine_in !== false,
        available_takeaway: data.available_takeaway !== false,
        available_delivery: data.available_delivery !== false,
        available_online: data.available_online !== false,
        // Product type
        product_type: data.product_type || 'standard',
        kitchen_section: data.kitchen_section,
        brand: data.brand,
        // Product status
        status: data.status || 'active',
        // Display options
        is_featured: data.is_featured || false,
        is_best_seller: data.is_best_seller || false,
        is_new_item: data.is_new_item || false,
        display_order: parseInt(data.display_order) || 0,
        product_color: data.product_color,
        product_icon: data.product_icon,
        // Nutritional information
        calories: parseInt(data.calories) || null,
        allergens: data.allergens,
        ingredients: data.ingredients,
      }).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Product created successfully:', result)
      setShowModal(false)
      setFormData({})
      setImagePreview('')
      loadData()
      toast.success('Product created successfully')
    } catch (error: any) {
      console.error('Error creating product:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        toast.error('A product with this barcode or SKU already exists')
      } else {
        toast.error(`Failed to create product: ${errorMessage}`)
      }
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateProduct(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating product with id:', id, 'data:', data)
      
      // Check for duplicate barcode (excluding current product)
      if (data.barcode) {
        const { data: existingBarcode } = await supabase
          .from('products')
          .select('id')
          .eq('barcode', data.barcode)
          .neq('id', id)
          .single()
        if (existingBarcode) {
          toast.error('A product with this barcode already exists')
          setFormLoading(false)
          return
        }
      }
      
      // Check for duplicate SKU (excluding current product)
      if (data.sku) {
        const { data: existingSKU } = await supabase
          .from('products')
          .select('id')
          .eq('sku', data.sku)
          .neq('id', id)
          .single()
        if (existingSKU) {
          toast.error('A product with this SKU already exists')
          setFormLoading(false)
          return
        }
      }
      
      const { error, data: result } = await supabase
        .from('products')
        .update({
          name: data.name,
          product_code: data.product_code,
          description: data.full_description || data.description,
          short_description: data.short_description,
          category_id: data.category_id,
          barcode: data.barcode,
          sku: data.sku,
          cost_price: parseFloat(data.cost_price) || 0,
          selling_price: parseFloat(data.selling_price) || parseFloat(data.price) || 0,
          tax_rate: parseFloat(data.tax_rate) || 0,
          service_charge: parseFloat(data.service_charge) || 0,
          discount_price: parseFloat(data.discount_price) || null,
          currency: data.currency || 'USD',
          preparation_time: parseInt(data.preparation_time) || 0,
          image_url: data.image_url,
          is_available: data.status === 'active',
          kitchen_printer: data.kitchen_printer,
          // Inventory fields
          track_inventory: data.track_inventory || false,
          current_stock: parseInt(data.current_stock) || 0,
          min_stock_level: parseInt(data.min_stock_level) || 0,
          max_stock_level: parseInt(data.max_stock_level) || 0,
          reorder_level: parseInt(data.reorder_level) || 0,
          unit: data.unit || 'piece',
          // Restaurant options
          available_dine_in: data.available_dine_in !== false,
          available_takeaway: data.available_takeaway !== false,
          available_delivery: data.available_delivery !== false,
          available_online: data.available_online !== false,
          // Product type
          product_type: data.product_type || 'standard',
          kitchen_section: data.kitchen_section,
          brand: data.brand,
          // Product status
          status: data.status || 'active',
          // Display options
          is_featured: data.is_featured || false,
          is_best_seller: data.is_best_seller || false,
          is_new_item: data.is_new_item || false,
          display_order: parseInt(data.display_order) || 0,
          product_color: data.product_color,
          product_icon: data.product_icon,
          // Nutritional information
          calories: parseInt(data.calories) || null,
          allergens: data.allergens,
          ingredients: data.ingredients,
        })
        .eq('id', id)
        .select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Product updated successfully:', result)
      setShowModal(false)
      setFormData({})
      setImagePreview('')
      loadData()
      toast.success('Product updated successfully')
    } catch (error: any) {
      console.error('Error updating product:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        toast.error('A product with this barcode or SKU already exists')
      } else {
        toast.error(`Failed to update product: ${errorMessage}`)
      }
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteProduct(id: string) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  async function handleCreateCategory(data: any) {
    try {
      setFormLoading(true)
      const { error } = await supabase.from('categories').insert({
        ...data,
        tenant_id: user?.tenant_id,
      })
      if (error) throw error
      setShowModal(false)
      loadData()
      toast.success('Category created successfully')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateCategory(id: string, data: any) {
    try {
      setFormLoading(true)
      const { error } = await supabase.from('categories').update(data).eq('id', id)
      if (error) throw error
      setShowModal(false)
      loadData()
      toast.success('Category updated successfully')
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      loadData()
      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  async function handleDeleteSelectedProducts(items: Product[]) {
    try {
      const ids = items.map(p => p.id)
      console.log('Attempting to delete products with IDs:', ids)
      
      // First, check if products exist
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', ids)
      
      if (checkError) {
        console.error('Error checking existing products:', checkError)
        toast.error('Failed to check products before deletion')
        return
      }
      
      console.log('Products to delete:', existingProducts)
      
      if (!existingProducts || existingProducts.length === 0) {
        toast.error('No products found with those IDs')
        return
      }
      
      // Check if products are referenced in orders
      const { data: orderItems, error: orderCheckError } = await supabase
        .from('order_items')
        .select('product_id, order_id')
        .in('product_id', ids)
      
      if (orderCheckError) {
        console.error('Error checking order references:', orderCheckError)
      }
      
      if (orderItems && orderItems.length > 0) {
        const productIds = [...new Set(orderItems.map(oi => oi.product_id))]
        const referencedProductNames = existingProducts
          .filter(p => productIds.includes(p.id))
          .map(p => p.name)
          .join(', ')
        toast.error(`Cannot delete products referenced in orders: ${referencedProductNames}`)
        return
      }
      
      // Perform the delete
      const { error, data } = await supabase.from('products').delete().in('id', ids).select()
      
      if (error) {
        console.error('Supabase delete error:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        throw error
      }
      
      console.log('Delete result:', data)
      console.log('Number of deleted records:', data?.length || 0)
      
      // Verify deletion by checking if products still exist
      const { data: remainingProducts, error: verifyError } = await supabase
        .from('products')
        .select('id')
        .in('id', ids)
      
      if (verifyError) {
        console.error('Error verifying deletion:', verifyError)
      }
      
      if (remainingProducts && remainingProducts.length > 0) {
        console.error('Products still exist after deletion:', remainingProducts)
        toast.error('Deletion failed - products still exist')
        return
      }
      
      // Manually update state to remove deleted products
      setProducts(prev => prev.filter(p => !ids.includes(p.id)))
      setSelectedProducts([])
      setSkipNextLoad(true) // Prevent useEffect from reloading immediately
      toast.success(`${data?.length || items.length} products deleted successfully`)
    } catch (error: any) {
      console.error('Error deleting products:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      
      if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
        toast.error('Cannot delete products that are referenced in orders. Delete the orders first.')
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        toast.error('Permission denied. Check RLS policies.')
      } else {
        toast.error(`Failed to delete products: ${errorMessage}`)
      }
    }
  }

  async function handleDeleteSelectedCategories(items: Category[]) {
    try {
      const ids = items.map(c => c.id)
      console.log('Attempting to delete categories with IDs:', ids)
      
      // Check if categories exist
      const { data: existingCategories, error: checkError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', ids)
      
      if (checkError) {
        console.error('Error checking existing categories:', checkError)
        toast.error('Failed to check categories before deletion')
        return
      }
      
      console.log('Categories to delete:', existingCategories)
      
      if (!existingCategories || existingCategories.length === 0) {
        toast.error('No categories found with those IDs')
        return
      }
      
      // Check if categories have products
      const { data: categoryProducts } = await supabase
        .from('products')
        .select('id, category_id')
        .in('category_id', ids)
      
      if (categoryProducts && categoryProducts.length > 0) {
        const categoryNames = items
          .filter(c => categoryProducts.some(p => p.category_id === c.id))
          .map(c => c.name)
          .join(', ')
        toast.error(`Cannot delete categories with products: ${categoryNames}`)
        return
      }
      
      const { error, data } = await supabase.from('categories').delete().in('id', ids).select()
      
      if (error) {
        console.error('Supabase delete error:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        throw error
      }
      
      console.log('Delete result:', data)
      console.log('Number of deleted records:', data?.length || 0)
      
      // Verify deletion
      const { data: remainingCategories, error: verifyError } = await supabase
        .from('categories')
        .select('id')
        .in('id', ids)
      
      if (verifyError) {
        console.error('Error verifying deletion:', verifyError)
      }
      
      if (remainingCategories && remainingCategories.length > 0) {
        console.error('Categories still exist after deletion:', remainingCategories)
        toast.error('Deletion failed - categories still exist')
        return
      }
      
      // Manually update state to remove deleted categories
      setCategories(prev => prev.filter(c => !ids.includes(c.id)))
      setSelectedCategories([])
      setSkipNextLoad(true) // Prevent useEffect from reloading immediately
      toast.success(`${data?.length || items.length} categories deleted successfully`)
    } catch (error: any) {
      console.error('Error deleting categories:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      
      if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
        toast.error('Cannot delete categories that are referenced by products.')
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        toast.error('Permission denied. Check RLS policies.')
      } else {
        toast.error(`Failed to delete categories: ${errorMessage}`)
      }
    }
  }

  async function handleDeleteSelectedModifiers(items: Modifier[]) {
    try {
      const ids = items.map(m => m.id)
      console.log('Attempting to delete modifiers with IDs:', ids)
      
      // Check if modifiers exist
      const { data: existingModifiers, error: checkError } = await supabase
        .from('toppings')
        .select('id, name')
        .in('id', ids)
      
      if (checkError) {
        console.error('Error checking existing modifiers:', checkError)
        toast.error('Failed to check modifiers before deletion')
        return
      }
      
      console.log('Modifiers to delete:', existingModifiers)
      
      if (!existingModifiers || existingModifiers.length === 0) {
        toast.error('No modifiers found with those IDs')
        return
      }
      
      const { error, data } = await supabase.from('toppings').delete().in('id', ids).select()
      
      if (error) {
        console.error('Supabase delete error:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        throw error
      }
      
      console.log('Delete result:', data)
      console.log('Number of deleted records:', data?.length || 0)
      
      // Verify deletion
      const { data: remainingModifiers, error: verifyError } = await supabase
        .from('toppings')
        .select('id')
        .in('id', ids)
      
      if (verifyError) {
        console.error('Error verifying deletion:', verifyError)
      }
      
      if (remainingModifiers && remainingModifiers.length > 0) {
        console.error('Modifiers still exist after deletion:', remainingModifiers)
        toast.error('Deletion failed - modifiers still exist')
        return
      }
      
      // Manually update state to remove deleted modifiers
      setModifiers(prev => prev.filter(m => !ids.includes(m.id)))
      setSelectedModifiers([])
      setSkipNextLoad(true) // Prevent useEffect from reloading immediately
      toast.success(`${data?.length || items.length} modifiers deleted successfully`)
    } catch (error: any) {
      console.error('Error deleting modifiers:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      
      if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
        toast.error('Cannot delete modifiers that are referenced in orders.')
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        toast.error('Permission denied. Check RLS policies.')
      } else {
        toast.error(`Failed to delete modifiers: ${errorMessage}`)
      }
    }
  }

  function handleViewItem(item: Product | Category | Modifier) {
    setSelectedItem(item)
    setModalMode('view')
    setFormData(item as any)
    if (activeTab === 'products' && (item as Product).image_url) {
      setImagePreview((item as Product).image_url || '')
    }
    setShowModal(true)
  }

  function handleEditItem(item: Product | Category | Modifier) {
    setSelectedItem(item)
    setModalMode('edit')
    setFormData(item as any)
    if (activeTab === 'products' && (item as Product).image_url) {
      setImagePreview((item as Product).image_url || '')
    }
    setShowModal(true)
  }

  function handleCreateItem() {
    setSelectedItem(null)
    setModalMode('create')
    setFormData({})
    setImagePreview('')
    setShowModal(true)
  }

  async function handleImageUpload(file: File) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setImagePreview(data.publicUrl)
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    }
  }

  const productColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">{product.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category_id',
      header: 'Category',
      render: (product: Product) => {
        const category = categories.find(c => c.id === product.category_id)
        return <span>{category?.name || 'Uncategorized'}</span>
      },
    },
    {
      key: 'price',
      header: 'Price',
      render: (product: Product) => <span className="font-semibold">{formatCurrency(product.price)}</span>,
    },
    {
      key: 'available',
      header: 'Available',
      render: (product: Product) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {product.available ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(product)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(product)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteProduct(product.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const categoryColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (category: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
            <Tag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-sm text-gray-500">{category.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'product_count',
      header: 'Products',
      render: (category: Category) => (
        <span>{products.filter(p => p.category_id === category.id).length}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (category: Category) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(category)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(category)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteCategory(category.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const modifierColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (modifier: Modifier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium">{modifier.name}</p>
            <p className="text-sm text-gray-500 capitalize">{modifier.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'options',
      header: 'Options',
      render: (modifier: Modifier) => (
        <span>{modifier.options?.length || 0} options</span>
      ),
    },
    {
      key: 'required',
      header: 'Required',
      render: (modifier: Modifier) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          modifier.required ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {modifier.required ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (modifier: Modifier) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(modifier)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(modifier)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => {}} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
        <p className="text-gray-600 mt-1">Manage products, categories, and modifiers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'products' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('products')}
        >
          <Package className="w-4 h-4 mr-2" />
          Products
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('categories')}
        >
          <Tag className="w-4 h-4 mr-2" />
          Categories
        </Button>
        <Button
          variant={activeTab === 'modifiers' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('modifiers')}
        >
          <Layers className="w-4 h-4 mr-2" />
          Modifiers
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {activeTab === 'products' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}

            <Button onClick={handleCreateItem}>
              <Plus className="w-4 h-4 mr-2" />
              New {activeTab.slice(0, -1)}
            </Button>

            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Grid */}
      {activeTab === 'products' && (
        <DataGrid
          data={products}
          columns={productColumns}
          loading={loading}
          selectable={true}
          onSelectionChange={setSelectedProducts}
          onDeleteSelected={handleDeleteSelectedProducts}
        />
      )}
      {activeTab === 'categories' && (
        <DataGrid
          data={categories}
          columns={categoryColumns}
          loading={loading}
          selectable={true}
          onSelectionChange={setSelectedCategories}
          onDeleteSelected={handleDeleteSelectedCategories}
        />
      )}
      {activeTab === 'modifiers' && (
        <DataGrid
          data={modifiers}
          columns={modifierColumns}
          loading={loading}
          selectable={true}
          onSelectionChange={setSelectedModifiers}
          onDeleteSelected={handleDeleteSelectedModifiers}
        />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalMode === 'create' ? 'Create' : modalMode === 'edit' ? 'Edit' : 'View'} ${activeTab.slice(0, -1)}`}
          size="lg"
        >
          {activeTab === 'products' && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Image Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  className="hidden"
                  id="product-image-upload"
                />
                <label htmlFor="product-image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Product preview" className="w-32 h-32 object-cover mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setImagePreview('')
                          setFormData(prev => ({ ...prev, image_url: '' }))
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>

              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                    <input
                      type="text"
                      value={formData.product_code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={formData.short_description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                  <textarea
                    value={formData.full_description || formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_description: e.target.value, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Category Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Category Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                    <select
                      value={formData.product_type || 'standard'}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="combo">Combo</option>
                      <option value="special">Special</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Section</label>
                    <input
                      type="text"
                      value={formData.kitchen_section || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, kitchen_section: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price || formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.service_charge || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_charge: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={formData.currency || 'USD'}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="SOS">SOS</option>
                    </select>
                  </div>
                </div>
                {/* Price Calculations */}
                {(formData.selling_price || formData.price) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Selling Price with Tax:</strong> {formatCurrency((formData.selling_price || formData.price || 0) * (1 + (formData.tax_rate || 0) / 100))}</p>
                    <p className="text-sm"><strong>Profit Margin:</strong> {formData.cost_price ? ((formData.selling_price || formData.price || 0) - formData.cost_price) / (formData.selling_price || formData.price || 0) * 100 : 0}%</p>
                    <p className="text-sm"><strong>Net Price:</strong> {formatCurrency((formData.selling_price || formData.price || 0) - (formData.discount_price || 0))}</p>
                  </div>
                )}
              </div>

              {/* Inventory Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="track_inventory"
                    checked={formData.track_inventory || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, track_inventory: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="track_inventory" className="text-sm font-medium text-gray-700">Track Inventory</label>
                </div>
                {formData.track_inventory && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                      <input
                        type="number"
                        value={formData.current_stock || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                      <input
                        type="number"
                        value={formData.min_stock_level || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock Level</label>
                      <input
                        type="number"
                        value={formData.max_stock_level || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_stock_level: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                      <input
                        type="number"
                        value={formData.reorder_level || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, reorder_level: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select
                        value={formData.unit || 'piece'}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="piece">Piece</option>
                        <option value="plate">Plate</option>
                        <option value="bottle">Bottle</option>
                        <option value="cup">Cup</option>
                        <option value="kg">Kg</option>
                        <option value="gram">Gram</option>
                        <option value="liter">Liter</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Restaurant Options Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Restaurant Options</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.preparation_time || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Printer</label>
                  <input
                    type="text"
                    value={formData.kitchen_printer || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, kitchen_printer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available_dine_in"
                      checked={formData.available_dine_in !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, available_dine_in: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="available_dine_in" className="text-sm font-medium text-gray-700">Available for Dine-In</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available_takeaway"
                      checked={formData.available_takeaway !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, available_takeaway: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="available_takeaway" className="text-sm font-medium text-gray-700">Available for Takeaway</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available_delivery"
                      checked={formData.available_delivery !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, available_delivery: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="available_delivery" className="text-sm font-medium text-gray-700">Available for Delivery</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available_online"
                      checked={formData.available_online !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, available_online: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="available_online" className="text-sm font-medium text-gray-700">Available for Online Orders</label>
                  </div>
                </div>
              </div>

              {/* Product Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Status</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value, is_available: e.target.value === 'active' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* Product Display Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Display</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-gray-700">Featured Product</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_best_seller"
                      checked={formData.is_best_seller || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_best_seller: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_best_seller" className="text-sm font-medium text-gray-700">Best Seller</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_new_item"
                      checked={formData.is_new_item || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_new_item: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_new_item" className="text-sm font-medium text-gray-700">New Item</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Color</label>
                    <input
                      type="color"
                      value={formData.product_color || '#6366f1'}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_color: e.target.value }))}
                      className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Nutritional Information (Optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Nutritional Information (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input
                      type="number"
                      value={formData.calories || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergens</label>
                    <input
                      type="text"
                      value={formData.allergens || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                    <textarea
                      value={formData.ingredients || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setFormData({})
                  setImagePreview('')
                }}>
                  Reset
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    // Validation
                    if (!formData.name) {
                      toast.error('Product Name is required')
                      return
                    }
                    if (!formData.category_id) {
                      toast.error('Category is required')
                      return
                    }
                    if (!formData.selling_price && !formData.price) {
                      toast.error('Selling Price must be greater than 0')
                      return
                    }
                    if (modalMode === 'create') {
                      await handleCreateProduct(formData)
                    } else {
                      await handleUpdateProduct((selectedItem as Product)!.id, formData)
                    }
                  }}
                  loading={formLoading}
                >
                  {modalMode === 'create' ? 'Save Product' : 'Update Product'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <Form
              data={formData}
              onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
              onSubmit={async () => {
                if (modalMode === 'create') {
                  await handleCreateCategory(formData)
                } else {
                  await handleUpdateCategory((selectedItem as Category)!.id, formData)
                }
              }}
              loading={formLoading}
              fields={[
                {
                  name: 'name',
                  label: 'Category Name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  label: 'Description',
                  type: 'textarea',
                },
              ]}
            />
          )}

          {activeTab === 'modifiers' && (
            <div className="space-y-4">
              {modalMode === 'view' && selectedItem && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-lg font-semibold">{(selectedItem as Modifier).name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <p className="text-lg font-semibold capitalize">{(selectedItem as Modifier).type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Required</label>
                      <p className="text-lg font-semibold">{(selectedItem as Modifier).required ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Options</label>
                    <div className="mt-2 space-y-2">
                      {(selectedItem as Modifier).options?.map((opt) => (
                        <div key={opt.id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{opt.name}</span>
                          <span className="font-semibold">
                            {opt.price_adjustment >= 0 ? '+' : ''}{formatCurrency(opt.price_adjustment)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
