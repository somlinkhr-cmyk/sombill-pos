import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'
import { Table as TableIcon, Users, Plus, Edit, Trash2, Move, Merge, Split, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

interface Table {
  id: string
  number: number
  room_id: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
  room?: { name: string }
  current_order?: {
    id: string
    status: string
    total: number
  }
}

export default function Tables() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number')

      if (error) {
        console.error('Error loading tables:', error)
        setTables([])
      } else {
        setTables(data || [])
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'occupied': return 'bg-red-500'
      case 'reserved': return 'bg-yellow-500'
      case 'cleaning': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'available': return <CheckCircle className="w-5 h-5" />
      case 'occupied': return <Users className="w-5 h-5" />
      case 'reserved': return <Clock className="w-5 h-5" />
      case 'cleaning': return <AlertCircle className="w-5 h-5" />
      default: return <TableIcon className="w-5 h-5" />
    }
  }

  async function handleOpenTable(table: Table) {
    // Navigate to POS with this table selected
    navigate('/cashier', { state: { selectedTable: table } })
  }

  async function handleReserveTable(table: Table) {
    setShowReserveModal(true)
    setSelectedTable(table)
  }

  async function handleMergeTables() {
    setShowMergeModal(true)
  }

  async function handleSplitTable(table: Table) {
    setShowSplitModal(true)
    setSelectedTable(table)
  }

  async function handleMoveOrder(table: Table) {
    setShowMoveModal(true)
    setSelectedTable(table)
  }

  async function handleUpdateStatus(table: Table, newStatus: string) {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: newStatus })
        .eq('id', table.id)

      if (error) throw error
      loadTables()
    } catch (error) {
      console.error('Error updating table status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1976D2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => navigate('/cashier')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
              <p className="text-gray-600">Manage restaurant tables</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <TableIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Tables Found</h2>
            <p className="text-gray-600 mb-4">There are no tables in the database yet.</p>
            <button
              onClick={loadTables}
              className="px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1]"
            >
              Reload Tables
            </button>
          </div>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
              <p className="text-gray-600">Manage restaurant tables</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1] flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Table
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'available').length}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'occupied').length}
                </p>
                <p className="text-sm text-gray-600">Occupied</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'reserved').length}
                </p>
                <p className="text-sm text-gray-600">Reserved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {tables.filter(t => t.status === 'cleaning').length}
                </p>
                <p className="text-sm text-gray-600">Cleaning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenTable(table)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-full ${getStatusColor(table.status)} flex items-center justify-center`}>
                  {getStatusIcon(table.status)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReserveTable(table)
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Clock className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveOrder(table)
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Move className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{table.number}</p>
                <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  {table.capacity}
                </p>
              </div>

              {table.current_order && (
                <div className="mt-3 pt-3 border-t text-center">
                  <p className="text-xs text-gray-600">Current Order</p>
                  <p className="text-sm font-semibold text-[#0D47A1]">
                    ${table.current_order.total.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              <div className="mt-3 pt-3 border-t">
                <select
                  value={table.status}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleUpdateStatus(table, e.target.value)
                  }}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3">Bulk Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={handleMergeTables}
              className="px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1] flex items-center gap-2"
            >
              <Merge className="w-4 h-4" />
              Merge Tables
            </button>
            <button
              onClick={() => setShowSplitModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Split className="w-4 h-4" />
              Split Table
            </button>
          </div>
        </div>
      </div>

      {/* Reserve Table Modal */}
      {showReserveModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Reserve Table {selectedTable.number}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reservation Time</label>
                <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]" rows={3} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowReserveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Implement reserve logic
                  setShowReserveModal(false)
                }}
                className="flex-1 px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1]"
              >
                Reserve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Tables Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Merge Tables</h2>
            <p className="text-gray-600 mb-4">Select tables to merge together</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tables.filter(t => t.status === 'occupied').map(table => (
                <label key={table.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="font-medium">Table {table.number}</span>
                  <span className="text-sm text-gray-600">({table.capacity} seats)</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowMergeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Implement merge logic
                  setShowMergeModal(false)
                }}
                className="flex-1 px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1]"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Table Modal */}
      {showSplitModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Split Table {selectedTable.number}</h2>
            <p className="text-gray-600 mb-4">How would you like to split this table?</p>
            <div className="space-y-2">
              <button className="w-full p-3 border rounded-lg text-left hover:bg-gray-50">
                <p className="font-medium">Split by Items</p>
                <p className="text-sm text-gray-600">Divide order items between tables</p>
              </button>
              <button className="w-full p-3 border rounded-lg text-left hover:bg-gray-50">
                <p className="font-medium">Split by Amount</p>
                <p className="text-sm text-gray-600">Divide total amount evenly</p>
              </button>
              <button className="w-full p-3 border rounded-lg text-left hover:bg-gray-50">
                <p className="font-medium">Custom Split</p>
                <p className="text-sm text-gray-600">Specify amounts for each table</p>
              </button>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSplitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Order Modal */}
      {showMoveModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Move Order</h2>
            <p className="text-gray-600 mb-4">Select destination table for order from Table {selectedTable.number}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tables.filter(t => t.id !== selectedTable.id && t.status === 'available').map(table => (
                <button
                  key={table.id}
                  onClick={() => {
                    // Implement move logic
                    setShowMoveModal(false)
                  }}
                  className="w-full p-3 border rounded-lg text-left hover:bg-gray-50"
                >
                  <p className="font-medium">Table {table.number}</p>
                  <p className="text-sm text-gray-600">({table.capacity} seats)</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
