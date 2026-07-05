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
  Edit,
  Trash2,
  Eye,
  Users,
  RefreshCw,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  loyalty_points: number
  total_orders: number
  total_spent: number
  last_visit?: string
  created_at: string
  updated_at: string
}

interface FavoriteItem {
  id: string
  customer_id: string
  product_id: string
  product_name: string
  order_count: number
}

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [searchQuery])

  async function loadData() {
    try {
      setLoading(true)
      
      let query = supabase.from('customers').select('*').order('name')
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCustomer(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating customer with data:', data)
      const { error, data: result } = await supabase.from('customers').insert({
        ...data,
        loyalty_points: 0,
        total_spending: 0,
      }).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Customer created successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Customer created successfully')
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateCustomer(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating customer with id:', id, 'data:', data)
      const { error, data: result } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Customer updated successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Customer updated successfully')
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteCustomer(id: string) {
    try {
      console.log('Deleting customer with id:', id)
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Customer deleted successfully')
      loadData()
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error(`Failed to delete customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleAddLoyaltyPoints(id: string, points: number) {
    try {
      const { error } = await supabase.rpc('add_loyalty_points', {
        customer_id: id,
        points_to_add: points,
      })
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error adding loyalty points:', error)
    }
  }

  function handleViewCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    setModalMode('view')
    setFormData(customer as any)
    setShowModal(true)
    
    // Load favorite items
    if (!import.meta.env.VITE_SUPABASE_URL?.includes('placeholder')) {
      supabase
        .from('favorite_items')
        .select('*')
        .eq('customer_id', customer.id)
        .order('order_count', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          setFavoriteItems(data || [])
        })
    }
  }

  function handleEditCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    setModalMode('edit')
    setFormData(customer as any)
    setShowModal(true)
  }

  function handleCreateCustomerClick() {
    setSelectedCustomer(null)
    setModalMode('create')
    setFormData({})
    setShowModal(true)
  }

  const customerColumns = [
    {
      key: 'name',
      header: 'Customer',
      render: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium">{customer.name}</p>
            <p className="text-sm text-gray-500">{customer.email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{customer.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'loyalty_points',
      header: 'Loyalty Points',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold">{customer.loyalty_points}</span>
        </div>
      ),
    },
    {
      key: 'total_orders',
      header: 'Orders',
      render: (customer: Customer) => (
        <span className="font-semibold">{customer.total_orders}</span>
      ),
    },
    {
      key: 'total_spent',
      header: 'Total Spent',
      render: (customer: Customer) => (
        <span className="font-semibold">{formatCurrency(customer.total_spent)}</span>
      ),
    },
    {
      key: 'last_visit',
      header: 'Last Visit',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (customer: Customer) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewCustomer(customer)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditCustomer(customer)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteCustomer(customer.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600 mt-1">Manage customer profiles and loyalty programs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{customers.length}</p>
                <p className="text-sm text-purple-700">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-900">
                  {customers.reduce((sum, c) => sum + c.loyalty_points, 0)}
                </p>
                <p className="text-sm text-yellow-700">Total Loyalty Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(customers.reduce((sum, c) => sum + c.total_spent, 0))}
                </p>
                <p className="text-sm text-green-700">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <Button onClick={handleCreateCustomerClick}>
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>

            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <DataGrid data={customers} columns={customerColumns} loading={loading} />

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalMode === 'create' ? 'Create' : modalMode === 'edit' ? 'Edit' : 'View'} Customer`}
          size="lg"
        >
          {modalMode === 'view' && selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg font-semibold">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{selectedCustomer.address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Loyalty Points</label>
                  <p className="text-lg font-semibold">{selectedCustomer.loyalty_points}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Orders</label>
                  <p className="text-lg font-semibold">{selectedCustomer.total_orders}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Spent</label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedCustomer.total_spent)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Visit</label>
                  <p className="text-gray-900">
                    {selectedCustomer.last_visit ? new Date(selectedCustomer.last_visit).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              {favoriteItems.length > 0 && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-600 mb-3 block">Favorite Items</label>
                  <div className="space-y-2">
                    {favoriteItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{item.product_name}</span>
                        <span className="text-sm text-gray-500">{item.order_count} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-600 mb-3 block">Quick Actions</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    buttonSize="sm"
                    onClick={() => handleAddLoyaltyPoints(selectedCustomer.id, 100)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Add 100 Points
                  </Button>
                  <Button
                    variant="outline"
                    buttonSize="sm"
                    onClick={() => handleAddLoyaltyPoints(selectedCustomer.id, 500)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Add 500 Points
                  </Button>
                </div>
              </div>
            </div>
          )}

          {(modalMode === 'create' || modalMode === 'edit') && (
            <Form
              data={formData}
              onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
              onSubmit={async () => {
                if (modalMode === 'create') {
                  await handleCreateCustomer(formData)
                } else {
                  await handleUpdateCustomer(selectedCustomer!.id, formData)
                }
              }}
              loading={formLoading}
              fields={[
                {
                  name: 'name',
                  label: 'Full Name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'email',
                  label: 'Email',
                  type: 'email',
                },
                {
                  name: 'phone',
                  label: 'Phone',
                  type: 'text',
                },
                {
                  name: 'address',
                  label: 'Address',
                  type: 'textarea',
                },
              ]}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
