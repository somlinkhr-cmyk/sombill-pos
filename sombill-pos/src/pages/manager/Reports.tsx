import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Chart } from '../../components/ui/Chart'
import {
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  FileText,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react'

interface ReportData {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  categoryBreakdown: { category: string; revenue: number; orders: number }[]
  dailySales: { date: string; sales: number; orders: number }[]
  staffPerformance: { name: string; orders: number; revenue: number }[]
  customerStats: { total: number; new: number; returning: number }
}

export default function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week')
  const [reportType, setReportType] = useState<'sales' | 'products' | 'staff' | 'customers'>('sales')

  useEffect(() => {
    loadReportData()
  }, [dateRange, reportType])

  async function loadReportData() {
    try {
      setLoading(true)
      
      // Load real data from Supabase
      const startDate = getStartDate(dateRange)
      
      const [ordersData, productsData, staffData] = await Promise.all([
        supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false }),
        supabase
          .from('order_items')
          .select('*, products(*, categories(*))')
          .gte('created_at', startDate),
        supabase
          .from('orders')
          .select('*, users(name)')
          .gte('created_at', startDate),
      ])

      if (ordersData.error) throw ordersData.error
      if (productsData.error) throw productsData.error
      if (staffData.error) throw staffData.error

      const orders = ordersData.data || []
      const totalSales = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

      // Calculate top products
      const productMap = new Map()
      productsData.data?.forEach(item => {
        const productName = item.products?.name || 'Unknown'
        const current = productMap.get(productName) || { quantity: 0, revenue: 0 }
        productMap.set(productName, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity),
        })
      })
      const topProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate category breakdown
      const categoryMap = new Map()
      productsData.data?.forEach(item => {
        const category = item.products?.categories?.name || 'Uncategorized'
        const current = categoryMap.get(category) || { revenue: 0, orders: 0 }
        categoryMap.set(category, {
          revenue: current.revenue + (item.price * item.quantity),
          orders: current.orders + 1,
        })
      })
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))

      // Calculate daily sales
      const dailyMap = new Map()
      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' })
        const current = dailyMap.get(date) || { sales: 0, orders: 0 }
        dailyMap.set(date, {
          sales: current.sales + order.total_amount,
          orders: current.orders + 1,
        })
      })
      const dailySales = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))

      // Calculate staff performance
      const staffMap = new Map()
      staffData.data?.forEach(order => {
        const staffName = order.users?.name || 'Unassigned'
        const current = staffMap.get(staffName) || { orders: 0, revenue: 0 }
        staffMap.set(staffName, {
          orders: current.orders + 1,
          revenue: current.revenue + (order.total_amount || 0),
        })
      })
      const staffPerformance = Array.from(staffMap.entries())
        .map(([name, data]) => ({ name, ...data }))

      setReportData({
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts,
        categoryBreakdown,
        dailySales,
        staffPerformance,
        customerStats: { total: 0, new: 0, returning: 0 },
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      setReportData({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topProducts: [],
        categoryBreakdown: [],
        dailySales: [],
        staffPerformance: [],
        customerStats: { total: 0, new: 0, returning: 0 },
      })
    } finally {
      setLoading(false)
    }
  }

  function getStartDate(range: string): string {
    const now = new Date()
    switch (range) {
      case 'today':
        return now.toISOString().split('T')[0]
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  function handleExportReport() {
    if (!reportData) return
    
    const csvContent = generateCSV(reportData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function generateCSV(data: ReportData): string {
    let csv = 'Report Type,Sales Report\n'
    csv += `Date Range,${dateRange}\n`
    csv += `Generated,${new Date().toISOString()}\n\n`
    
    csv += 'Summary\n'
    csv += `Total Sales,${data.totalSales}\n`
    csv += `Total Orders,${data.totalOrders}\n`
    csv += `Average Order Value,${data.averageOrderValue.toFixed(2)}\n\n`
    
    csv += 'Top Products\n'
    csv += 'Product,Quantity,Revenue\n'
    data.topProducts.forEach(p => {
      csv += `${p.name},${p.quantity},${p.revenue}\n`
    })
    
    return csv
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">View and export business reports</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sales">Sales Report</option>
                <option value="products">Product Report</option>
                <option value="staff">Staff Performance</option>
                <option value="customers">Customer Report</option>
              </select>
            </div>

            <Button variant="outline" onClick={() => loadReportData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalSales)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.averageOrderValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Sales Trend</h3>
              </CardHeader>
              <CardContent>
                <Chart
                  type="line"
                  data={reportData.dailySales.map(d => ({
                    label: d.date,
                    value: d.sales,
                  }))}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Category Breakdown</h3>
              </CardHeader>
              <CardContent>
                <Chart
                  type="pie"
                  data={reportData.categoryBreakdown.map(c => ({
                    label: c.category,
                    value: c.revenue,
                  }))}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Top Selling Products</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{product.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Staff Performance</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.staffPerformance.map((staff, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium">{staff.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(staff.revenue)}</p>
                      <p className="text-sm text-gray-500">{staff.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No data available</div>
        </div>
      )}
    </div>
  )
}
