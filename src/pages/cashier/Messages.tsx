import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/auth'
import { useAuth } from '../../contexts/AuthContext'
import { Bell, Clock, CheckCircle, AlertTriangle, Info, Trash2, X, Filter, ArrowLeft } from 'lucide-react'

interface Notification {
  id: string
  type: 'kitchen_ready' | 'manager_message' | 'low_stock' | 'payment_success' | 'shift_notification' | 'info'
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: any
}

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    filterNotifications()
  }, [notifications, filterType])

  async function loadNotifications() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterNotifications() {
    if (filterType === 'all') {
      setFilteredNotifications(notifications)
    } else if (filterType === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.is_read))
    } else {
      setFilteredNotifications(notifications.filter(n => n.type === filterType))
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'kitchen_ready': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'manager_message': return <Info className="w-5 h-5 text-blue-600" />
      case 'low_stock': return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'payment_success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'shift_notification': return <Clock className="w-5 h-5 text-purple-600" />
      default: return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'kitchen_ready': return 'bg-green-50 border-green-200'
      case 'manager_message': return 'bg-blue-50 border-blue-200'
      case 'low_stock': return 'bg-orange-50 border-orange-200'
      case 'payment_success': return 'bg-green-50 border-green-200'
      case 'shift_notification': return 'bg-purple-50 border-purple-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) throw error
      loadNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      loadNotifications()
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">View and manage notifications</p>
            </div>
          </div>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-[#1976D2] text-white rounded-lg hover:bg-[#0D47A1] flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Mark All Read
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="kitchen_ready">Kitchen Ready</option>
                <option value="manager_message">Manager Messages</option>
                <option value="low_stock">Low Stock Alerts</option>
                <option value="payment_success">Payment Success</option>
                <option value="shift_notification">Shift Notifications</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total: {notifications.length}</span>
              <span>Unread: {notifications.filter(n => !n.is_read).length}</span>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => {
                setSelectedNotification(notification)
                if (!notification.is_read) {
                  markAsRead(notification.id)
                }
              }}
              className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow border-2 ${
                notification.is_read ? 'border-transparent' : 'border-[#1976D2]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          )}
        </div>

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${getNotificationColor(selectedNotification.type)}`}>
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedNotification.title}</h2>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedNotification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>

                {selectedNotification.data && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Additional Details</h3>
                    <pre className="text-sm text-gray-600 overflow-x-auto">
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      deleteNotification(selectedNotification.id)
                      setSelectedNotification(null)
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
