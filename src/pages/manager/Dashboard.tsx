import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/StatCard'
import { Chart } from '../../components/ui/Chart'
import Orders from './Orders'
import MenuModule from './Menu'
import Inventory from './Inventory'
import Tables from './Tables'
import Staff from './Staff'
import Customers from './Customers'
import Reports from './Reports'
import Expenses from './Expenses'
import SubscriptionPanel from './SubscriptionPanel'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Table as TableIcon,
  TrendingUp,
  AlertTriangle,
  LogOut,
  Menu,
  Package,
  Settings,
  FileText,
  CreditCard,
  UserCheck,
  PackageSearch,
  Crown,
} from 'lucide-react'

export default function ManagerDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    todaySales: 0,
    weeklySales: 0,
    monthlyRevenue: 0,
    ordersToday: 0,
    activeTables: 0,
    totalCustomers: 0,
    totalMenuItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    cashInRegister: 0,
    expenses: 0,
    profit: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topSellingItems, setTopSellingItems] = useState<any[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [orderStatusData, setOrderStatusData] = useState<any[]>([])
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      // Today's sales
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', today)

      const todaySales = todayOrders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0

      // Weekly sales
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      const { data: weekOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', weekStart.toISOString())

      const weeklySales = weekOrders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0

      // Monthly revenue
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', monthStart)

      const monthlyRevenue = monthOrders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0

      // Orders today
      const { count: ordersToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', today)

      // Active tables
      const { count: activeTables } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'occupied')
        .eq('tenant_id', user?.tenant_id)

      // Total customers
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id)

      // Total menu items
      const { count: totalMenuItems } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', user?.tenant_id)

      // Low stock items - fetch all and filter
      const { data: allIngredients } = await supabase
        .from('ingredients')
        .select('id, current_stock, min_stock')
        .eq('tenant_id', user?.tenant_id)

      const lowStockItems = allIngredients?.filter((ing: any) => ing.current_stock < ing.min_stock).length || 0

      // Out of stock items
      const outOfStockItems = allIngredients?.filter((ing: any) => ing.current_stock === 0).length || 0

      // Expenses this month
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('tenant_id', user?.tenant_id)
        .gte('expense_date', monthStart)

      const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0

      // Recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*, tables(number)')
        .eq('tenant_id', user?.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5)

      const formattedRecentOrders = recent?.map((order: any) => ({
        id: order.id?.slice(0, 8) || order.id,
        table: order.tables?.number ? `Table ${order.tables.number}` : 'N/A',
        amount: order.total || 0,
        status: order.status || 'new',
        time: order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      })) || []

      // Top selling items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, products(name)')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', monthStart)

      const productSales: { [key: string]: number } = {}
      orderItems?.forEach((item: any) => {
        const productName = item.products?.name || 'Unknown'
        productSales[productName] = (productSales[productName] || 0) + (item.quantity || 0)
      })

      const topSellingItems = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      // Weekly sales data for chart
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const salesData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayName = days[date.getDay()]
        const dateStr = date.toISOString().split('T')[0]
        
        const { data: dayOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .eq('tenant_id', user?.tenant_id)
          .gte('created_at', dateStr)
          .lt('created_at', `${dateStr}T23:59:59.999Z`)
        
        const daySales = dayOrders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0
        salesData.push({ name: dayName, sales: daySales })
      }

      // Order status data
      const { data: allOrders } = await supabase
        .from('orders')
        .select('status')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', today)

      const statusCounts: { [key: string]: number } = {}
      allOrders?.forEach((order: any) => {
        const status = order.status || 'new'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })

      const orderStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

      // Payment method data
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('payment_method')
        .eq('payment_status', 'paid')
        .eq('tenant_id', user?.tenant_id)
        .gte('created_at', monthStart)

      const paymentCounts: { [key: string]: number } = {}
      paidOrders?.forEach((order: any) => {
        const method = order.payment_method || 'cash'
        paymentCounts[method] = (paymentCounts[method] || 0) + 1
      })

      const paymentMethodData = Object.entries(paymentCounts)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

      // Monthly revenue data (weeks)
      const revenueData = []
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        
        const { data: weekOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .eq('tenant_id', user?.tenant_id)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
        
        const weekRevenue = weekOrders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0
        revenueData.push({ name: `Week ${4 - i}`, revenue: weekRevenue })
      }

      setRecentOrders(formattedRecentOrders)
      setTopSellingItems(topSellingItems)
      setSalesData(salesData)
      setRevenueData(revenueData)
      setOrderStatusData(orderStatusData)
      setPaymentMethodData(paymentMethodData)

      setStats({
        todaySales,
        weeklySales,
        monthlyRevenue,
        ordersToday: ordersToday || 0,
        activeTables: activeTables || 0,
        totalCustomers: totalCustomers || 0,
        totalMenuItems: totalMenuItems || 0,
        lowStockItems,
        outOfStockItems,
        cashInRegister: todaySales * 0.7,
        expenses: totalExpenses,
        profit: monthlyRevenue - totalExpenses,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Set default values on error
      setStats({
        todaySales: 0,
        weeklySales: 0,
        monthlyRevenue: 0,
        ordersToday: 0,
        activeTables: 0,
        totalCustomers: 0,
        totalMenuItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        cashInRegister: 0,
        expenses: 0,
        profit: 0,
      })
      setRecentOrders([])
      setTopSellingItems([])
      setSalesData([])
      setRevenueData([])
      setOrderStatusData([])
      setPaymentMethodData([])
    } finally {
      setLoading(false)
    }
  }, [user?.tenant_id])

  useEffect(() => {
    loadDashboardStats()
    setupRealtimeSubscriptions()
  }, [loadDashboardStats])

  function setupRealtimeSubscriptions() {
    // Disabled for now - causing subscription errors
    // TODO: Fix realtime subscriptions with proper channel management
    return () => {}
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Menu },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'menu', label: 'Menu', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: PackageSearch },
    { id: 'tables', label: 'Tables', icon: TableIcon },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-700">SomBill POS</h1>
          <p className="text-sm text-gray-600 mt-1">Manager Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600 mt-1">Overview of your restaurant performance</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Today's Sales"
                    value={formatCurrency(stats.todaySales)}
                    icon={DollarSign}
                    color="blue"
                  />
                  <StatCard
                    title="Weekly Sales"
                    value={formatCurrency(stats.weeklySales)}
                    icon={TrendingUp}
                    color="green"
                  />
                  <StatCard
                    title="Monthly Revenue"
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={TrendingUp}
                    color="green"
                  />
                  <StatCard
                    title="Orders Today"
                    value={stats.ordersToday.toString()}
                    icon={ShoppingCart}
                    color="purple"
                  />
                  <StatCard
                    title="Active Tables"
                    value={stats.activeTables.toString()}
                    icon={TableIcon}
                    color="orange"
                  />
                  <StatCard
                    title="Total Customers"
                    value={stats.totalCustomers.toString()}
                    icon={Users}
                    color="purple"
                  />
                  <StatCard
                    title="Total Menu Items"
                    value={stats.totalMenuItems.toString()}
                    icon={Package}
                    color="blue"
                  />
                  <StatCard
                    title="Low Stock Items"
                    value={stats.lowStockItems.toString()}
                    icon={AlertTriangle}
                    color="yellow"
                  />
                  <StatCard
                    title="Out of Stock"
                    value={stats.outOfStockItems.toString()}
                    icon={AlertTriangle}
                    color="red"
                  />
                  <StatCard
                    title="Cash in Register"
                    value={formatCurrency(stats.cashInRegister)}
                    icon={CreditCard}
                    color="green"
                  />
                  <StatCard
                    title="Expenses"
                    value={formatCurrency(stats.expenses)}
                    icon={AlertTriangle}
                    color="red"
                  />
                  <StatCard
                    title="Profit"
                    value={formatCurrency(stats.profit)}
                    icon={TrendingUp}
                    color="green"
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Weekly Sales</h3>
                    </CardHeader>
                    <CardContent>
                      <Chart type="bar" data={salesData} dataKey="sales" height={300} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                    </CardHeader>
                    <CardContent>
                      <Chart type="line" data={revenueData} lines={['revenue']} height={300} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Order Status</h3>
                    </CardHeader>
                    <CardContent>
                      <Chart type="pie" data={orderStatusData} dataKey="value" height={300} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Payment Methods</h3>
                    </CardHeader>
                    <CardContent>
                      <Chart type="pie" data={paymentMethodData} dataKey="value" height={300} />
                    </CardContent>
                  </Card>
                </div>

                {/* Top Selling Items */}
                <Card className="mb-6">
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Top Selling Items</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topSellingItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-semibold text-primary-700">{item.sales} sold</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Recent Orders</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Table</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">{order.id}</td>
                              <td className="py-3 px-4">{order.table}</td>
                              <td className="py-3 px-4 font-semibold">{formatCurrency(order.amount)}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                  order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{order.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'orders' && <Orders />}
        {activeTab === 'menu' && <MenuModule />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'tables' && <Tables />}
        {activeTab === 'staff' && <Staff />}
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'expenses' && <Expenses />}
        {activeTab === 'subscription' && <SubscriptionPanel />}
        {activeTab !== 'dashboard' && activeTab !== 'orders' && activeTab !== 'menu' && activeTab !== 'inventory' && activeTab !== 'tables' && activeTab !== 'staff' && activeTab !== 'customers' && activeTab !== 'reports' && activeTab !== 'expenses' && activeTab !== 'subscription' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 text-lg">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} module</p>
              <p className="text-gray-400 mt-2">This module is under development</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
