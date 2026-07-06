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
  Clock,
  DollarSign,
  Shield,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email?: string
  phone?: string
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier'
  salary: number
  hire_date: string
  status: 'active' | 'inactive' | 'on_leave'
  address?: string
  created_at: string
  updated_at: string
}

interface AttendanceRecord {
  id: string
  staff_id: string
  date: string
  check_in: string
  check_out?: string
  hours_worked: number
  created_at: string
}

interface Shift {
  id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

export default function Staff() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'shifts'>('staff')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedItem, setSelectedItem] = useState<StaffMember | AttendanceRecord | Shift | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab, searchQuery])

  async function loadData() {
    try {
      setLoading(true)
      
      if (activeTab === 'staff') {
        let query = supabase.from('users').select('*').eq('tenant_id', user?.tenant_id).order('name')
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`)
        }
        const { data, error } = await query
        if (error) throw error
        setStaff(data || [])
      } else if (activeTab === 'attendance') {
        const { data, error } = await supabase
          .from('attendance')
          .select('*, users(name)')
          .eq('tenant_id', user?.tenant_id)
          .order('date', { ascending: false })
        if (error) throw error
        setAttendance(data || [])
      } else if (activeTab === 'shifts') {
        const { data, error } = await supabase
          .from('shifts')
          .select('*, users(name)')
          .eq('tenant_id', user?.tenant_id)
          .order('date', { ascending: false })
        if (error) throw error
        setShifts(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setStaff([])
      setAttendance([])
      setShifts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateStaff(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating staff with data:', data)
      const { error, data: result } = await supabase.from('users').insert({
        ...data,
        salary: parseFloat(data.salary),
        tenant_id: user?.tenant_id,
      }).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Staff created successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Staff member created successfully')
    } catch (error) {
      console.error('Error creating staff member:', error)
      toast.error(`Failed to create staff member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateStaff(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating staff with id:', id, 'data:', data)
      const { error, data: result } = await supabase
        .from('users')
        .update({
          ...data,
          salary: parseFloat(data.salary),
        })
        .eq('id', id)
        .select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Staff updated successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Staff member updated successfully')
    } catch (error) {
      console.error('Error updating staff member:', error)
      toast.error(`Failed to update staff member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteStaff(id: string) {
    try {
      console.log('Deleting staff with id:', id)
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Staff deleted successfully')
      loadData()
      toast.success('Staff member deleted successfully')
    } catch (error) {
      console.error('Error deleting staff member:', error)
      toast.error(`Failed to delete staff member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  function handleViewItem(item: StaffMember | AttendanceRecord | Shift) {
    setSelectedItem(item)
    setModalMode('view')
    setFormData(item as any)
    setShowModal(true)
  }

  function handleEditItem(item: StaffMember | AttendanceRecord | Shift) {
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

  const staffColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (member: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{member.name}</p>
            <p className="text-sm text-gray-500">{member.email || 'No email'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (member: StaffMember) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="capitalize">{member.role}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (member: StaffMember) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{member.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      render: (member: StaffMember) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold">{formatCurrency(member.salary)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (member: StaffMember) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          member.status === 'active' ? 'bg-green-100 text-green-700' :
          member.status === 'inactive' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {member.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (member: StaffMember) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewItem(member)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditItem(member)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteStaff(member.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const attendanceColumns = [
    {
      key: 'staff_id',
      header: 'Staff',
      render: (record: AttendanceRecord) => {
        const staffMember = staff.find(s => s.id === record.staff_id)
        return <span>{staffMember?.name || 'N/A'}</span>
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (record: AttendanceRecord) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(record.date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'check_in',
      header: 'Check In',
      render: (record: AttendanceRecord) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{record.check_in}</span>
        </div>
      ),
    },
    {
      key: 'check_out',
      header: 'Check Out',
      render: (record: AttendanceRecord) => (
        <span>{record.check_out || 'Not checked out'}</span>
      ),
    },
    {
      key: 'hours_worked',
      header: 'Hours',
      render: (record: AttendanceRecord) => (
        <span className="font-semibold">{record.hours_worked}h</span>
      ),
    },
  ]

  const shiftColumns = [
    {
      key: 'staff_id',
      header: 'Staff',
      render: (shift: Shift) => {
        const staffMember = staff.find(s => s.id === shift.staff_id)
        return <span>{staffMember?.name || 'N/A'}</span>
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (shift: Shift) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(shift.date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (shift: Shift) => (
        <span>{shift.start_time} - {shift.end_time}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (shift: Shift) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          shift.status === 'completed' ? 'bg-green-100 text-green-700' :
          shift.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {shift.status}
        </span>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        <p className="text-gray-600 mt-1">Manage employees, attendance, and shifts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'staff' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('staff')}
        >
          <Users className="w-4 h-4 mr-2" />
          Staff
        </Button>
        <Button
          variant={activeTab === 'attendance' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('attendance')}
        >
          <Clock className="w-4 h-4 mr-2" />
          Attendance
        </Button>
        <Button
          variant={activeTab === 'shifts' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('shifts')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Shifts
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

            {activeTab === 'staff' && (
              <Button onClick={handleCreateItem}>
                <Plus className="w-4 h-4 mr-2" />
                New Staff
              </Button>
            )}

            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Grid */}
      {activeTab === 'staff' && (
        <DataGrid data={staff} columns={staffColumns} loading={loading} />
      )}
      {activeTab === 'attendance' && (
        <DataGrid data={attendance} columns={attendanceColumns} loading={loading} />
      )}
      {activeTab === 'shifts' && (
        <DataGrid data={shifts} columns={shiftColumns} loading={loading} />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalMode === 'create' ? 'Create' : modalMode === 'edit' ? 'Edit' : 'View'} Staff Member`}
          size="lg"
        >
          {activeTab === 'staff' && (
            <Form
              data={formData}
              onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
              onSubmit={async () => {
                if (modalMode === 'create') {
                  await handleCreateStaff(formData)
                } else {
                  await handleUpdateStaff((selectedItem as StaffMember)!.id, formData)
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
                  name: 'role',
                  label: 'Role',
                  type: 'select',
                  options: [
                    { value: 'admin', label: 'Admin' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'waiter', label: 'Waiter' },
                    { value: 'chef', label: 'Chef' },
                    { value: 'cashier', label: 'Cashier' },
                  ],
                  required: true,
                },
                {
                  name: 'salary',
                  label: 'Monthly Salary',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'hire_date',
                  label: 'Hire Date',
                  type: 'date',
                  required: true,
                },
                {
                  name: 'status',
                  label: 'Status',
                  type: 'select',
                  options: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'on_leave', label: 'On Leave' },
                  ],
                  required: true,
                },
                {
                  name: 'address',
                  label: 'Address',
                  type: 'textarea',
                },
              ]}
            />
          )}

          {modalMode === 'view' && selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg font-semibold">{(selectedItem as StaffMember).name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <p className="text-lg font-semibold capitalize">{(selectedItem as StaffMember).role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{(selectedItem as StaffMember).email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{(selectedItem as StaffMember).phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Salary</label>
                  <p className="text-lg font-semibold">{formatCurrency((selectedItem as StaffMember).salary)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-lg font-semibold capitalize">{(selectedItem as StaffMember).status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Hire Date</label>
                  <p className="text-gray-900">{new Date((selectedItem as StaffMember).hire_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              {(selectedItem as StaffMember).address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900 mt-1">{(selectedItem as StaffMember).address}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
