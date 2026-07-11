import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Settings,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

interface Restaurant {
  id: string
  tenant_id: string
  name: string
  slug: string
  business_type?: string
  logo_url?: string
  brand_color?: string
  phone?: string
  email?: string
  country?: string
  city?: string
  address?: string
  currency?: string
  timezone?: string
  language?: string
  status: 'active' | 'suspended' | 'disabled' | 'archived' | 'trial'
  storage_used: number
  storage_limit: number
  created_at: string
  updated_at: string
  subscription?: {
    plan_name: string
    status: string
    end_date: string
  }
  owner?: {
    id: string
    name: string
    email: string
  }
  employee_count?: number
  branch_count?: number
}

export default function SuperAdminRestaurants() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)

  const loadRestaurants = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('restaurants')
        .select('*, subscriptions(plan_name, status, end_date), tenants(name)')
        .order('created_at', { ascending: false })

      const { data: restaurantsData, error } = await query

      if (error) {
        console.error('Error loading restaurants:', error)
        toast.error('Failed to load restaurants')
        return
      }

      // Load owner info for each restaurant
      const restaurantsWithOwner = await Promise.all(
        (restaurantsData || []).map(async (restaurant: any) => {
          const { data: ownerData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('restaurant_id', restaurant.id)
            .eq('is_restaurant_owner', true)
            .limit(1)
            .single()

          // Load employee count
          const { count: employeeCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurant.id)

          // Load branch count
          const { count: branchCount } = await supabase
            .from('branches')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurant.id)

          return {
            ...restaurant,
            owner: ownerData ? {
              id: ownerData.id,
              name: `${ownerData.first_name} ${ownerData.last_name}`,
              email: ownerData.email,
            } : undefined,
            employee_count: employeeCount || 0,
            branch_count: branchCount || 0,
          }
        })
      )

      setRestaurants(restaurantsWithOwner)
    } catch (error) {
      console.error('Error loading restaurants:', error)
      toast.error('Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRestaurants()
  }, [loadRestaurants])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = searchQuery === '' ||
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.city?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [restaurants, searchQuery, statusFilter])

  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) return

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', selectedRestaurant.id)

      if (error) throw error

      toast.success('Restaurant deleted successfully')
      setShowDeleteModal(false)
      setSelectedRestaurant(null)
      loadRestaurants()
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error('Failed to delete restaurant')
    }
  }

  const handleSuspendRestaurant = async () => {
    if (!selectedRestaurant) return

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: 'suspended' })
        .eq('id', selectedRestaurant.id)

      if (error) throw error

      toast.success('Restaurant suspended successfully')
      setShowSuspendModal(false)
      setSelectedRestaurant(null)
      loadRestaurants()
    } catch (error) {
      console.error('Error suspending restaurant:', error)
      toast.error('Failed to suspend restaurant')
    }
  }

  const handleActivateRestaurant = async () => {
    if (!selectedRestaurant) return

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: 'active' })
        .eq('id', selectedRestaurant.id)

      if (error) throw error

      toast.success('Restaurant activated successfully')
      setShowActivateModal(false)
      setSelectedRestaurant(null)
      loadRestaurants()
    } catch (error) {
      console.error('Error activating restaurant:', error)
      toast.error('Failed to activate restaurant')
    }
  }

  const handleArchiveRestaurant = async () => {
    if (!selectedRestaurant) return

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ status: 'archived' })
        .eq('id', selectedRestaurant.id)

      if (error) throw error

      toast.success('Restaurant archived successfully')
      setShowArchiveModal(false)
      setSelectedRestaurant(null)
      loadRestaurants()
    } catch (error) {
      console.error('Error archiving restaurant:', error)
      toast.error('Failed to archive restaurant')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      disabled: 'bg-gray-100 text-gray-800',
      archived: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || styles.active
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'trial':
        return <Clock className="w-4 h-4" />
      case 'suspended':
        return <XCircle className="w-4 h-4" />
      case 'archived':
        return <Archive className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/superadmin" className="text-gray-600 hover:text-gray-900">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={loadRestaurants}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/superadmin/restaurants/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{restaurants.filter(r => r.status === 'active').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Trial</p>
                  <p className="text-2xl font-bold text-blue-600">{restaurants.filter(r => r.status === 'trial').length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">{restaurants.filter(r => r.status === 'suspended').length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Restaurants ({filteredRestaurants.length})</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Restaurant</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Employees</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Branches</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Storage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        No restaurants found
                      </td>
                    </tr>
                  ) : (
                    filteredRestaurants.map((restaurant) => (
                      <tr key={restaurant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {restaurant.logo_url ? (
                              <img
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{restaurant.name}</p>
                              <p className="text-sm text-gray-600">{restaurant.city}, {restaurant.country}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(restaurant.status)}`}>
                            {getStatusIcon(restaurant.status)}
                            <span className="ml-1 capitalize">{restaurant.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{restaurant.owner?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{restaurant.owner?.email || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{restaurant.subscription?.plan_name || 'N/A'}</p>
                            <p className="text-sm text-gray-600 capitalize">{restaurant.subscription?.status || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-900">{restaurant.employee_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">{restaurant.branch_count || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-900">
                              {((restaurant.storage_used / 1024 / 1024 / 1024) || 0).toFixed(2)} GB
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">
                            {new Date(restaurant.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Link to={`/superadmin/restaurants/${restaurant.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={`/superadmin/restaurants/${restaurant.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRestaurant(restaurant)
                                setShowSuspendModal(true)
                              }}
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRestaurant(restaurant)
                                setShowDeleteModal(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedRestaurant(null)
        }}
        title="Delete Restaurant"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedRestaurant?.name}</strong>?
            This action cannot be undone and will permanently delete all data associated with this restaurant.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedRestaurant(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRestaurant}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false)
          setSelectedRestaurant(null)
        }}
        title="Suspend Restaurant"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to suspend <strong>{selectedRestaurant?.name}</strong>?
            The restaurant will lose access to all services.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendModal(false)
                setSelectedRestaurant(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSuspendRestaurant}>
              Suspend
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activate Modal */}
      <Modal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false)
          setSelectedRestaurant(null)
        }}
        title="Activate Restaurant"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to activate <strong>{selectedRestaurant?.name}</strong>?
            The restaurant will regain access to all services.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowActivateModal(false)
                setSelectedRestaurant(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleActivateRestaurant}>
              Activate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false)
          setSelectedRestaurant(null)
        }}
        title="Archive Restaurant"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to archive <strong>{selectedRestaurant?.name}</strong>?
            The restaurant data will be preserved but the restaurant will be deactivated.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowArchiveModal(false)
                setSelectedRestaurant(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleArchiveRestaurant}>
              Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
