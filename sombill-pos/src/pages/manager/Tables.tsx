import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
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
  Table as TableIcon,
  Users,
  MapPin,
  RefreshCw,
  Square,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

interface Table {
  id: string
  number: number
  room_id?: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  position_x?: number
  position_y?: number
  created_at: string
  updated_at: string
}

interface Waiter {
  id: string
  name: string
  email?: string
}

export default function Tables() {
  const { user } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [searchQuery])

  async function loadData() {
    try {
      setLoading(true)
      
      const [tablesData, waitersData] = await Promise.all([
        supabase.from('tables').select('*').order('number'),
        supabase.from('users').select('id, name, email').eq('role', 'waiter'),
      ])

      if (tablesData.error) throw tablesData.error
      if (waitersData.error) throw waitersData.error

      setTables(tablesData.data || [])
      setWaiters(waitersData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setTables([])
      setWaiters([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTable(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating table with data:', data)
      
      // Check if table number already exists
      const tableNumber = parseInt(data.number)
      const { data: existingTable } = await supabase
        .from('tables')
        .select('id')
        .eq('number', tableNumber)
        .single()
      
      if (existingTable) {
        toast.error(`Table number ${tableNumber} already exists. Please use a different number.`)
        setFormLoading(false)
        return
      }
      
      // Prepare table data - only include fields that exist in the schema
      const tableData: any = {
        number: tableNumber,
        capacity: parseInt(data.capacity),
        status: data.status || 'available',
        position_x: parseInt(data.position_x) || 0,
        position_y: parseInt(data.position_y) || 0,
      }
      
      // Only include room_id if it's a valid UUID (not a number or empty string)
      if (data.room_id && data.room_id !== '' && data.room_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        tableData.room_id = data.room_id
      }
      
      console.log('Prepared table data:', tableData)
      
      const { error, data: result } = await supabase.from('tables').insert(tableData).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Table created successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Table created successfully')
    } catch (error: any) {
      console.error('Error creating table:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        toast.error(`Table number ${data.number} already exists. Please use a different number.`)
      } else {
        toast.error(`Failed to create table: ${errorMessage}`)
      }
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateTable(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating table with id:', id, 'data:', data)
      
      // Prepare table data - only include fields that exist in the schema
      const tableData: any = {
        number: parseInt(data.number),
        capacity: parseInt(data.capacity),
        status: data.status || 'available',
        position_x: parseInt(data.position_x) || 0,
        position_y: parseInt(data.position_y) || 0,
      }
      
      // Only include room_id if it's a valid UUID (not a number or empty string)
      if (data.room_id && data.room_id !== '' && data.room_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        tableData.room_id = data.room_id
      }
      
      const { error, data: result } = await supabase
        .from('tables')
        .update(tableData)
        .eq('id', id)
        .select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Table updated successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Table updated successfully')
    } catch (error: any) {
      console.error('Error updating table:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      toast.error(`Failed to update table: ${errorMessage}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteTable(id: string) {
    try {
      console.log('Deleting table with id:', id)
      const { error } = await supabase.from('tables').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Table deleted successfully')
      loadData()
      toast.success('Table deleted successfully')
    } catch (error: any) {
      console.error('Error deleting table:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      toast.error(`Failed to delete table: ${errorMessage}`)
    }
  }

  async function handleUpdateStatus(id: string, status: Table['status']) {
    try {
      const { error } = await supabase.from('tables').update({ status }).eq('id', id)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error updating table status:', error)
    }
  }

  function handleViewTable(table: Table) {
    setSelectedTable(table)
    setModalMode('view')
    setFormData(table as any)
    setShowModal(true)
  }

  function handleEditTable(table: Table) {
    setSelectedTable(table)
    setModalMode('edit')
    setFormData(table as any)
    setShowModal(true)
  }

  function handleCreateTableClick() {
    setSelectedTable(null)
    setModalMode('create')
    setFormData({})
    setShowModal(true)
  }

  const tableColumns = [
    {
      key: 'number',
      header: 'Table',
      render: (table: Table) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
            <TableIcon className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-semibold text-lg">#{table.number}</span>
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (table: Table) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{table.capacity} seats</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Room',
      render: (table: Table) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{table.room_id || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (table: Table) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          table.status === 'available' ? 'bg-green-100 text-green-700' :
          table.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
          table.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {table.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (table: Table) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewTable(table)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditTable(table)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteTable(table.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'occupied': return 'bg-blue-500'
      case 'reserved': return 'bg-yellow-500'
      case 'cleaning': return 'bg-gray-500'
      default: return 'bg-gray-300'
    }
  }

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-6 h-6 text-white" />
      case 'occupied': return <Users className="w-6 h-6 text-white" />
      case 'reserved': return <Clock className="w-6 h-6 text-white" />
      case 'cleaning': return <Square className="w-6 h-6 text-white" />
      default: return <XCircle className="w-6 h-6 text-white" />
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
        <p className="text-gray-600 mt-1">Manage restaurant tables and reservations</p>
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
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <Button onClick={handleCreateTableClick}>
              <Plus className="w-4 h-4 mr-2" />
              New Table
            </Button>

            <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
              {viewMode === 'list' ? <TableIcon className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </Button>

            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{tables.filter(t => t.status === 'available').length}</p>
                <p className="text-sm text-green-700">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{tables.filter(t => t.status === 'occupied').length}</p>
                <p className="text-sm text-blue-700">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-900">{tables.filter(t => t.status === 'reserved').length}</p>
                <p className="text-sm text-yellow-700">Reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Square className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{tables.filter(t => t.status === 'cleaning').length}</p>
                <p className="text-sm text-gray-700">Cleaning</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Grid or Grid View */}
      {viewMode === 'list' ? (
        <DataGrid data={tables} columns={tableColumns} loading={loading} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => handleViewTable(table)}
              className="cursor-pointer"
            >
              <Card className={`hover:shadow-lg transition-shadow ${getStatusColor(table.status)} text-white`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3">
                      {getStatusIcon(table.status)}
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Table #{table.number}</h3>
                    <p className="text-sm opacity-90 mb-2">{table.capacity} seats</p>
                    <p className="text-xs opacity-75">{table.room_id || 'No room'}</p>
                    <div className="mt-3 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {table.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalMode === 'create' ? 'Create' : modalMode === 'edit' ? 'Edit' : 'View'} Table`}
          size="md"
        >
          {modalMode === 'view' && selectedTable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Table Number</label>
                  <p className="text-lg font-semibold">#{selectedTable.number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Capacity</label>
                  <p className="text-lg font-semibold">{selectedTable.capacity} seats</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Room ID</label>
                  <p className="text-lg font-semibold">{selectedTable.room_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-lg font-semibold capitalize">{selectedTable.status}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Capacity</label>
                <p className="text-gray-900 mt-1">{selectedTable.capacity} seats</p>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-600 mb-3 block">Quick Actions</label>
                <div className="flex flex-wrap gap-2">
                  {(['available', 'occupied', 'reserved', 'cleaning'] as Table['status'][]).map((status) => (
                    <Button
                      key={status}
                      variant={selectedTable.status === status ? 'primary' : 'outline'}
                      buttonSize="sm"
                      onClick={() => handleUpdateStatus(selectedTable.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
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
                  await handleCreateTable(formData)
                } else {
                  await handleUpdateTable(selectedTable!.id, formData)
                }
              }}
              loading={formLoading}
              fields={[
                {
                  name: 'number',
                  label: 'Table Number',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'capacity',
                  label: 'Capacity (seats)',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'room_id',
                  label: 'Room',
                  type: 'text',
                },
                {
                  name: 'status',
                  label: 'Status',
                  type: 'select',
                  options: [
                    { value: 'available', label: 'Available' },
                    { value: 'occupied', label: 'Occupied' },
                    { value: 'reserved', label: 'Reserved' },
                    { value: 'cleaning', label: 'Cleaning' },
                  ],
                  required: true,
                },
                {
                  name: 'waiter_id',
                  label: 'Assign Waiter',
                  type: 'select',
                  options: waiters.map(w => ({ value: w.id, label: w.name })),
                },
              ]}
            />
          )}
        </Modal>
      )}
    </div>
  )
}
