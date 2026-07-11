import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Users,
  Plus,
  Edit,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Shield,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  UserPlus,
  Crown,
  Key,
} from 'lucide-react'

interface User {
  id: string
  tenant_id: string
  restaurant_id: string
  restaurant_name?: string
  branch_id?: string
  branch_name?: string
  role_id: string
  role_name?: string
  role_slug?: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  is_restaurant_owner: boolean
  mfa_enabled: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

interface Role {
  id: string
  tenant_id: string
  restaurant_id: string
  name: string
  slug: string
  description: string
  permissions: Record<string, boolean>
  is_system: boolean
  created_at: string
}

export default function SuperAdminUsers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*, restaurants(name), branches(name), roles(name, slug)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedUsers = (usersData || []).map((u: any) => ({
        ...u,
        restaurant_name: u.restaurants?.name,
        branch_name: u.branches?.name,
        role_name: u.roles?.name,
        role_slug: u.roles?.slug,
      }))

      setUsers(formattedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRoles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else {
      loadRoles()
    }
  }, [activeTab, loadUsers, loadRoles])

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery === '' ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active)

      const matchesRole = roleFilter === 'all' || user.role_slug === roleFilter

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [users, searchQuery, statusFilter, roleFilter])

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success('User deleted successfully')
      setShowDeleteModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success('User suspended successfully')
      setShowSuspendModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    }
  }

  const handleActivateUser = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', selectedUser.id)

      if (error) throw error

      toast.success('User activated successfully')
      setShowActivateModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      console.error('Error activating user:', error)
      toast.error('Failed to activate user')
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return

    try {
      // Use Supabase Auth to send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(selectedUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent successfully')
      setShowResetPasswordModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to send password reset email')
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getRoleBadge = (slug: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800',
      waiter: 'bg-yellow-100 text-yellow-800',
      kitchen: 'bg-orange-100 text-orange-800',
    }
    return styles[slug] || 'bg-gray-100 text-gray-800'
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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => {
              if (activeTab === 'users') loadUsers()
              else loadRoles()
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/superadmin/users/new">
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Roles & Permissions
            </button>
          </nav>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
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
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
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
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Owners</p>
                      <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.is_restaurant_owner).length}</p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">MFA Enabled</p>
                      <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.mfa_enabled).length}</p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Users ({filteredUsers.length})</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Restaurant</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">MFA</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Last Login</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={user.first_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-gray-900">{user.restaurant_name || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role_slug || '')}`}>
                                {user.is_restaurant_owner && <Crown className="w-3 h-3 mr-1" />}
                                {user.role_name || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.is_active)}`}>
                                {user.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {user.mfa_enabled ? (
                                <Shield className="w-5 h-5 text-green-600" />
                              ) : (
                                <Shield className="w-5 h-5 text-gray-400" />
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-900">
                                {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-900">
                                {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <Link to={`/superadmin/users/${user.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {user.is_active ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setShowSuspendModal(true)
                                    }}
                                  >
                                    <Lock className="w-4 h-4 text-yellow-600" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setShowActivateModal(true)
                                    }}
                                  >
                                    <Unlock className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowResetPasswordModal(true)
                                  }}
                                >
                                  <Key className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
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
          </>
        ) : (
          <>
            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <Card key={role.id} className={role.is_system ? 'opacity-75' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{role.name}</h3>
                      </div>
                      {role.is_system && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">System</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Slug</span>
                        <span className="font-medium">{role.slug}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-gray-500 mb-2">Permissions</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(role.permissions).map(([key, value]) => (
                            value && (
                              <span
                                key={key}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                              >
                                {key}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link to={`/superadmin/roles/${role.id}`}>
                        <Button className="w-full" variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteUser}>
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
          setSelectedUser(null)
        }}
        title="Suspend User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to suspend <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
            The user will lose access to the system.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendModal(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSuspendUser}>
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
          setSelectedUser(null)
        }}
        title="Activate User"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to activate <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
            The user will regain access to the system.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowActivateModal(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleActivateUser}>
              Activate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false)
          setSelectedUser(null)
        }}
        title="Reset Password"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to send a password reset email to <strong>{selectedUser?.email}</strong>?
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetPasswordModal(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              Send Reset Email
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
