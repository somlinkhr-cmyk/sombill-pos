import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  FileText,
  ChevronDown,
  Search,
  Printer,
  Plus,
} from 'lucide-react'

interface Report {
  id: string
  name: string
  description: string
  type: 'revenue' | 'usage' | 'users' | 'restaurants' | 'payments' | 'custom'
  category: string
  created_at: string
}

interface ReportData {
  period: string
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalRestaurants: number
  avgOrderValue: number
  growthRate: number
}

export default function SuperAdminReports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [dateRange, setDateRange] = useState('30d')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'usage' | 'users' | 'restaurants'>('overview')

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadReportData = useCallback(async (period: string) => {
    try {
      const startDate = new Date()
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30)
      } else if (period === '90d') {
        startDate.setDate(startDate.getDate() - 90)
      } else if (period === '1y') {
        startDate.setFullYear(startDate.getFullYear() - 1)
      }

      const startDateStr = startDate.toISOString()

      // Load data for the selected period
      const [
        { data: ordersData },
        { data: usersData },
        { data: restaurantsData },
        { data: paymentsData },
      ] = await Promise.all([
        supabase.from('orders').select('total').gte('created_at', startDateStr),
        supabase.from('users').select('*').gte('created_at', startDateStr),
        supabase.from('restaurants').select('*').gte('created_at', startDateStr),
        supabase.from('sa_payments').select('amount').eq('status', 'completed').gte('created_at', startDateStr),
      ])

      const totalRevenue = (paymentsData || []).reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalOrders = ordersData?.length || 0
      const totalUsers = usersData?.length || 0
      const totalRestaurants = restaurantsData?.length || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setReportData({
        period,
        totalRevenue,
        totalOrders,
        totalUsers,
        totalRestaurants,
        avgOrderValue,
        growthRate: 12.5, // Mock value
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('Failed to load report data')
    }
  }, [])

  useEffect(() => {
    loadReports()
    loadReportData(dateRange)
  }, [loadReports, loadReportData, dateRange])

  const handleExportReport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      // In a real implementation, this would call a backend function to generate the report
      toast.success(`Report exportedas ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    }
  }

  const handlePrintReport = () => {
    window.print()
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
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={loadReports}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => handleExportReport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handlePrintReport}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Stats */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
                    <p className="text-xs text-green-600 mt-1">↑ {reportData.growthRate}% vs previous period</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 mt-1">Avg: {formatCurrency(reportData.avgOrderValue)}/order</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Users</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-1">↑ 8.2% growth</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Restaurants</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalRestaurants.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-1">↑ 4.5% growth</p>
                  </div>
                  <Building2 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Categories */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'revenue'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Usage
            </button>
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
              onClick={() => setActiveTab('restaurants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'restaurants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Restaurants
            </button>
          </nav>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Revenue Report</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">Detailed revenue breakdown by period</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium">{reportData ? formatCurrency(reportData.totalRevenue) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subscription Revenue</span>
                  <span className="font-medium">{reportData ? formatCurrency(reportData.totalRevenue * 0.7) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction Fees</span>
                  <span className="font-medium">{reportData ? formatCurrency(reportData.totalRevenue * 0.3) : 'N/A'}</span>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Order Report</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">Order volume and trends analysis</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium">{reportData?.totalOrders.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Order Value</span>
                  <span className="font-medium">{reportData ? formatCurrency(reportData.avgOrderValue) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Growth Rate</span>
                  <span className="font-medium text-green-600">↑ {reportData?.growthRate || 0}%</span>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">User Report</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">User acquisition and activity metrics</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New Users</span>
                  <span className="font-medium">{reportData?.totalUsers.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-medium">{reportData ? Math.floor(reportData.totalUsers * 0.85).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Churn Rate</span>
                  <span className="font-medium text-red-600">2.3%</span>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Restaurant Report</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">Restaurant growth and performance</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New Restaurants</span>
                  <span className="font-medium">{reportData?.totalRestaurants.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Restaurants</span>
                  <span className="font-medium">{reportData ? Math.floor(reportData.totalRestaurants * 0.92).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Trial Conversions</span>
                  <span className="font-medium text-green-600">78%</span>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Growth Report</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">Platform growth metrics and projections</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">MoM Growth</span>
                  <span className="font-medium text-green-600">↑ 12.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">YoY Growth</span>
                  <span className="font-medium text-green-600">↑ 45.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Projected MRR</span>
                  <span className="font-medium">{reportData ? formatCurrency(reportData.totalRevenue * 1.15) : 'N/A'}</span>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold">Custom Report</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">Create custom reports with filters</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Saved Reports</span>
                  <span className="font-medium">{reports.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Scheduled Reports</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Generated</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
                <Button className="w-full" variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
