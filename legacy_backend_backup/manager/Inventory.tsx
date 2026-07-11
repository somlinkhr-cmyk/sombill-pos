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
  Package,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Truck,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  description?: string
  unit: string
  current_stock: number
  min_stock: number
  unit_cost: number
  supplier_id?: string
  created_at: string
  updated_at: string
}

interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  created_at: string
}

interface PurchaseOrder {
  id: string
  supplier_id: string
  order_date: string
  expected_date?: string
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  total_amount: number
  notes?: string
  created_at: string
}

interface WasteRecord {
  id: string
  ingredient_id: string
  quantity: number
  reason: string
  recorded_by?: string
  recorded_at: string
  cost: number
}

export default function Inventory() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'ingredients' | 'suppliers' | 'orders' | 'waste'>('ingredients')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedItem, setSelectedItem] = useState<Ingredient | Supplier | PurchaseOrder | WasteRecord | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab, searchQuery])

  async function loadData() {
    try {
      setLoading(true)
      
      if (activeTab === 'ingredients') {
        let query = supabase.from('ingredients').select('*, suppliers(name)').eq('tenant_id', user?.tenant_id).order('name')
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }
        
        const { data, error } = await query
        if (error) throw error
        setIngredients(data || [])
      } else if (activeTab === 'suppliers') {
        let query = supabase.from('suppliers').select('*').eq('tenant_id', user?.tenant_id).order('name')
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }
        
        const { data, error } = await query
        if (error) throw error
        setSuppliers(data || [])
      } else if (activeTab === 'orders') {
        const { data, error } = await supabase
          .from('purchase_orders')
          .select('*, suppliers(*)')
          .eq('tenant_id', user?.tenant_id)
          .order('order_date', { ascending: false })
        if (error) throw error
        setPurchaseOrders(data || [])
      } else if (activeTab === 'waste') {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'ingredients')
          .eq('tenant_id', user?.tenant_id)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) throw error
        setWasteRecords(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setIngredients([])
      setSuppliers([])
      setPurchaseOrders([])
      setWasteRecords([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateIngredient(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating ingredient with data:', data)
      const { error, data: result } = await supabase.from('ingredients').insert({
        ...data,
        current_stock: parseFloat(data.current_stock),
        min_stock: parseFloat(data.min_stock),
        cost_per_unit: parseFloat(data.cost_per_unit),
        tenant_id: user?.tenant_id,
      }).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Ingredient created successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Ingredient created successfully')
    } catch (error) {
      console.error('Error creating ingredient:', error)
      toast.error(`Failed to create ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateIngredient(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating ingredient with id:', id, 'data:', data)
      const { error, data: result } = await supabase
        .from('ingredients')
        .update({
          ...data,
          current_stock: parseFloat(data.current_stock),
          min_stock: parseFloat(data.min_stock),
          cost_per_unit: parseFloat(data.cost_per_unit),
        })
        .eq('id', id)
        .select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Ingredient updated successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Ingredient updated successfully')
    } catch (error) {
      console.error('Error updating ingredient:', error)
      toast.error(`Failed to update ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteIngredient(id: string) {
    try {
      console.log('Deleting ingredient with id:', id)
      const { error } = await supabase.from('ingredients').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Ingredient deleted successfully')
      loadData()
      toast.success('Ingredient deleted successfully')
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      toast.error(`Failed to delete ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleCreateSupplier(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating supplier with data:', data)
      const { error, data: result } = await supabase.from('suppliers').insert(data).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Supplier created successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Supplier created successfully')
    } catch (error) {
      console.error('Error creating supplier:', error)
      toast.error(`Failed to create supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateSupplier(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating supplier with id:', id, 'data:', data)
      const { error, data: result } = await supabase.from('suppliers').update(data).eq('id', id).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Supplier updated successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Supplier updated successfully')
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error(`Failed to update supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteSupplier(id: string) {
    try {
      console.log('Deleting supplier with id:', id)
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Supplier deleted successfully')
      loadData()
      toast.success('Supplier deleted successfully')
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error(`Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  function handleViewItem(item: Ingredient | Supplier | PurchaseOrder | WasteRecord) {
    setSelectedItem(item)
    setModalMode('view')
    setFormData(item as any)
    setShowModal(true)
  }

  function handleEditItem(item: Ingredient | Supplier | PurchaseOrder | WasteRecord) {
    setSelectedItem(item)
    setModalMode('edit')
    setFormData(item as any)
    setShowModal(true)
  }

  function handleCreateItem() {
    setSelectedItem(null)
    setModalMode('create')
    setFormData({})
    setShowModal(true)
  }

  const ingredientColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (ingredient: Ingredient) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium">{ingredient.name}</p>
            <p className="text-sm text-gray-500">{ingredient.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'current_stock',
      header: 'Stock',
      render: (ingredient: Ingredient) => (
        <div>
          <span className="font-semibold">{ingredient.current_stock} {ingredient.unit}</span>
          {ingredient.current_stock <= ingredient.min_stock && (
            <span className="ml-2 text-red-600 text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Low Stock
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'min_stock',
      header: 'Min Stock',
      render: (ingredient: Ingredient) => (
        <span>{ingredient.min_stock} {ingredient.unit}</span>
      ),
    },
    {
      key: 'unit_cost',
      header: 'Unit Cost',
      render: (ingredient: Ingredient) => (
        <span className="font-semibold">{formatCurrency(ingredient.unit_cost)}</span>
      ),
    },
    {
      key: 'total_value',
      header: 'Total Value',
      render: (ingredient: Ingredient) => (
        <span className="font-semibold">{formatCurrency(ingredient.current_stock * ingredient.unit_cost)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ingredient: Ingredient) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(ingredient)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(ingredient)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteIngredient(ingredient.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const supplierColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{supplier.name}</p>
            <p className="text-sm text-gray-500">{supplier.contact_person || 'No contact'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (supplier: Supplier) => (
        <span>{supplier.phone || 'N/A'}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (supplier: Supplier) => (
        <span>{supplier.email || 'N/A'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(supplier)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(supplier)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteSupplier(supplier.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const orderColumns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (order: PurchaseOrder) => (
        <span className="font-mono">{order.id}</span>
      ),
    },
    {
      key: 'supplier_id',
      header: 'Supplier',
      render: (order: PurchaseOrder) => {
        const supplier = suppliers.find(s => s.id === order.supplier_id)
        return <span>{supplier?.name || 'N/A'}</span>
      },
    },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (order: PurchaseOrder) => (
        <span>{(() => {
          try {
            return new Date(order.order_date).toLocaleDateString()
          } catch {
            return 'N/A'
          }
        })()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: PurchaseOrder) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          order.status === 'received' ? 'bg-green-100 text-green-700' :
          order.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {order.status}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (order: PurchaseOrder) => (
        <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(order)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(order)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const wasteColumns = [
    {
      key: 'ingredient_id',
      header: 'Ingredient',
      render: (waste: WasteRecord) => {
        const ingredient = ingredients.find(i => i.id === waste.ingredient_id)
        return <span>{ingredient?.name || 'N/A'}</span>
      },
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (waste: WasteRecord) => (
        <span className="font-semibold">{waste.quantity}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (waste: WasteRecord) => (
        <span>{waste.reason}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (waste: WasteRecord) => (
        <span className="font-semibold text-red-600">{formatCurrency(waste.cost)}</span>
      ),
    },
    {
      key: 'recorded_at',
      header: 'Date',
      render: (waste: WasteRecord) => (
        <span>{(() => {
          try {
            return new Date(waste.recorded_at).toLocaleDateString()
          } catch {
            return 'N/A'
          }
        })()}</span>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Manage ingredients, suppliers, and stock</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'ingredients' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('ingredients')}
        >
          <Package className="w-4 h-4 mr-2" />
          Ingredients
        </Button>
        <Button
          variant={activeTab === 'suppliers' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('suppliers')}
        >
          <Truck className="w-4 h-4 mr-2" />
          Suppliers
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('orders')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Purchase Orders
        </Button>
        <Button
          variant={activeTab === 'waste' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('waste')}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Waste Tracking
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

            {activeTab !== 'waste' && (
              <Button onClick={handleCreateItem}>
                <Plus className="w-4 h-4 mr-2" />
                New {activeTab.slice(0, -1)}
              </Button>
            )}

            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {activeTab === 'ingredients' && ingredients.filter(i => i.current_stock <= i.min_stock).length > 0 && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Low Stock Alert</p>
                <p className="text-sm text-red-700">
                  {ingredients.filter(i => i.current_stock <= i.min_stock).length} ingredient(s) need to be restocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Grid */}
      {activeTab === 'ingredients' && (
        <DataGrid data={ingredients} columns={ingredientColumns} loading={loading} />
      )}
      {activeTab === 'suppliers' && (
        <DataGrid data={suppliers} columns={supplierColumns} loading={loading} />
      )}
      {activeTab === 'orders' && (
        <DataGrid data={purchaseOrders} columns={orderColumns} loading={loading} />
      )}
      {activeTab === 'waste' && (
        <DataGrid data={wasteRecords} columns={wasteColumns} loading={loading} />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalMode === 'create' ? 'Create' : modalMode === 'edit' ? 'Edit' : 'View'} ${activeTab.slice(0, -1)}`}
          size="lg"
        >
          {activeTab === 'ingredients' && (
            <Form
              data={formData}
              onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
              onSubmit={async () => {
                if (modalMode === 'create') {
                  await handleCreateIngredient(formData)
                } else {
                  await handleUpdateIngredient((selectedItem as Ingredient)!.id, formData)
                }
              }}
              loading={formLoading}
              fields={[
                {
                  name: 'name',
                  label: 'Ingredient Name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  label: 'Description',
                  type: 'textarea',
                },
                {
                  name: 'unit',
                  label: 'Unit',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'current_stock',
                  label: 'Current Stock',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'min_stock',
                  label: 'Minimum Stock',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'cost_per_unit',
                  label: 'Unit Cost',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'supplier_id',
                  label: 'Supplier',
                  type: 'select',
                  options: suppliers.map(s => ({ value: s.id, label: s.name })),
                },
              ]}
            />
          )}

          {activeTab === 'suppliers' && (
            <Form
              data={formData}
              onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
              onSubmit={async () => {
                if (modalMode === 'create') {
                  await handleCreateSupplier(formData)
                } else {
                  await handleUpdateSupplier((selectedItem as Supplier)!.id, formData)
                }
              }}
              loading={formLoading}
              fields={[
                {
                  name: 'name',
                  label: 'Supplier Name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'contact_person',
                  label: 'Contact Person',
                  type: 'text',
                },
                {
                  name: 'phone',
                  label: 'Phone',
                  type: 'text',
                },
                {
                  name: 'email',
                  label: 'Email',
                  type: 'email',
                },
                {
                  name: 'address',
                  label: 'Address',
                  type: 'textarea',
                },
              ]}
            />
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {modalMode === 'view' && selectedItem && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order ID</label>
                      <p className="text-lg font-semibold">{(selectedItem as PurchaseOrder).id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <p className="text-lg font-semibold">{(selectedItem as PurchaseOrder).status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Order Date</label>
                      <p className="text-lg font-semibold">{(() => {
                        try {
                          return new Date((selectedItem as PurchaseOrder).order_date).toLocaleDateString()
                        } catch {
                          return 'N/A'
                        }
                      })()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Amount</label>
                      <p className="text-lg font-semibold">{formatCurrency((selectedItem as PurchaseOrder).total_amount)}</p>
                    </div>
                  </div>
                  {(selectedItem as PurchaseOrder).notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900 mt-1">{(selectedItem as PurchaseOrder).notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
