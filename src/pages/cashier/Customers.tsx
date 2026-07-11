import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Plus, Phone, Mail, MapPin, Star, History, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  loyalty_points: number
  total_spending: number
  address?: string
  created_at: string
  updated_at: string
}

interface CustomerOrder {
  id: string
  total: number
  status: string
  created_at: string
}

export default function Customers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchQuery])

  async function loadCustomers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterCustomers() {
    if (!searchQuery) {
      setFilteredCustomers(customers)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    )
    setFilteredCustomers(filtered)
  }

  async function loadCustomerOrders(customerId: string) {
    try {
      setLoadingOrders(true)
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, status, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setCustomerOrders(data || [])
    } catch (error) {
      console.error('Error loading customer orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  async function handleAddCustomer(customerData: Partial<Customer>) {
    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address,
          loyalty_points: 0,
          total_spending: 0
        })

      if (error) throw error
      loadCustomers()
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding customer:', error)
    }
  }

  async function handleUpdateCustomer(customerData: Partial<Customer>) {
    if (!selectedCustomer) return

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          address: customerData.address
        })
        .eq('id', selectedCustomer.id)

      if (error) throw error
      loadCustomers()
      setShowEditModal(false)
      setSelectedCustomer(null)
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  async function handleDeleteCustomer(customerId: string) {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error
      loadCustomers()
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  function handleSelectCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    loadCustomerOrders(customer.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1976D2]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/cashier')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Manage customer information and loyalty</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customers List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  selectedCustomer?.id === customer.id ? 'ring-2 ring-[#1976D2]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCustomer(customer)
                        setShowEditModal(true)
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCustomer(customer.id)
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{customer.loyalty_points}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{formatCurrency(customer.total_spending)} spent</span>
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No customers found
              </div>
            )}
          </div>

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <p className="text-gray-600">Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-yellow-600 fill-current" />
                    <p className="text-sm text-gray-600">Loyalty Points</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.loyalty_points}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <History className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{customerOrders.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">$</span>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedCustomer.total_spending)}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{selectedCustomer.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Orders
                </h3>
                {loadingOrders ? (
                  <div className="text-center py-4 text-gray-500">Loading orders...</div>
                ) : customerOrders.length > 0 ? (
                  <div className="space-y-2">
                    {customerOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#0D47A1]">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-gray-600 capitalize">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No orders yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerFormModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddCustomer}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <CustomerFormModal
          customer={selectedCustomer}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCustomer(null)
          }}
          onSubmit={handleUpdateCustomer}
        />
      )}
    </div>
  )
}

function CustomerFormModal({ customer, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || ''
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1]"
            >
              {customer ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
