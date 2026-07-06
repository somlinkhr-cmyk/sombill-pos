import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { DataGrid } from '../../components/ui/DataGrid'
import { Form } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Modal'
import { Chart } from '../../components/ui/Chart'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  DollarSign,
  Receipt,
  Calendar,
  TrendingUp,
  Upload,
  FileText,
  X,
} from 'lucide-react'

interface Expense {
  id: string
  category_id?: string
  category?: string
  category_color?: string
  description?: string
  amount: number
  expense_date: string
  receipt_url?: string
  created_by?: string
  created_at: string
}

interface ExpenseCategory {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export default function Expenses() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [categoryFormData, setCategoryFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
  }, [searchQuery, selectedCategory, dateRange])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load categories
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('tenant_id', user?.tenant_id)
          .order('name')
        if (categoriesError) {
          console.error('Error loading expense_categories:', categoriesError)
          // Fallback: use hardcoded categories if table doesn't exist
          const fallbackCategories = [
            { id: '1', name: 'Rent', color: '#ef4444', is_active: true, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '2', name: 'Utilities', color: '#f59e0b', is_active: true, display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '3', name: 'Salaries', color: '#10b981', is_active: true, display_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '4', name: 'Inventory', color: '#3b82f6', is_active: true, display_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '5', name: 'Equipment', color: '#8b5cf6', is_active: true, display_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '6', name: 'Maintenance', color: '#ec4899', is_active: true, display_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '7', name: 'Marketing', color: '#06b6d4', is_active: true, display_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '8', name: 'Insurance', color: '#84cc16', is_active: true, display_order: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '9', name: 'Transportation', color: '#f97316', is_active: true, display_order: 9, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { id: '10', name: 'Other', color: '#6b7280', is_active: true, display_order: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ]
          setCategories(fallbackCategories)
          console.log('Using fallback categories')
        } else {
          setCategories(categoriesData || [])
          console.log('Loaded categories from database:', categoriesData?.length)
        }
      } catch (error) {
        console.error('Exception loading categories:', error)
        // Fallback to hardcoded categories
        const fallbackCategories = [
          { id: '1', name: 'Rent', color: '#ef4444', is_active: true, display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', name: 'Utilities', color: '#f59e0b', is_active: true, display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '3', name: 'Salaries', color: '#10b981', is_active: true, display_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '4', name: 'Inventory', color: '#3b82f6', is_active: true, display_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '5', name: 'Equipment', color: '#8b5cf6', is_active: true, display_order: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '6', name: 'Maintenance', color: '#ec4899', is_active: true, display_order: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '7', name: 'Marketing', color: '#06b6d4', is_active: true, display_order: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '8', name: 'Insurance', color: '#84cc16', is_active: true, display_order: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '9', name: 'Transportation', color: '#f97316', is_active: true, display_order: 9, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '10', name: 'Other', color: '#6b7280', is_active: true, display_order: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        setCategories(fallbackCategories)
        console.log('Using fallback categories due to exception')
      }

      // Load expenses
      const startDate = getStartDate(dateRange)
      let query = supabase
        .from('expenses')
        .select('*, expense_categories(name, color)')
        .eq('tenant_id', user?.tenant_id)
        .gte('expense_date', startDate)
        .order('expense_date', { ascending: false })
      
      if (searchQuery) {
        query = query.ilike('description', `%${searchQuery}%`)
      }
      
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }
      
      const { data, error } = await query
      if (error) {
        console.error('Error loading expenses:', error)
        // Try loading without the join if the relationship doesn't work
        const fallbackQuery = supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', startDate)
          .order('expense_date', { ascending: false })
        
        if (searchQuery) {
          fallbackQuery.ilike('description', `%${searchQuery}%`)
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          setExpenses([])
        } else {
          // Map fallback data to include category names
          const expensesWithCategory = (fallbackData || []).map(expense => ({
            ...expense,
            category: expense.category || 'Uncategorized',
            category_color: '#6b7280',
          }))
          setExpenses(expensesWithCategory)
        }
      } else {
        // Map the data to include category name
        const expensesWithCategory = (data || []).map(expense => ({
          ...expense,
          category: expense.expense_categories?.name || expense.category,
          category_color: expense.expense_categories?.color,
        }))
        setExpenses(expensesWithCategory)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setCategories([])
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  function getStartDate(range: string): string {
    const now = new Date()
    switch (range) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString()
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString()
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    }
  }

  async function handleCreateExpense(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating expense with data:', data)
      
      // Prepare expense data - use category (text) instead of category_id for compatibility
      const expenseData: any = {
        description: data.description,
        amount: parseFloat(data.amount),
        expense_date: data.expense_date,
      }
      
      // Use category name instead of category_id for better compatibility
      if (data.category_id && data.category_id !== 'all') {
        const category = categories.find(c => c.id === data.category_id)
        if (category) {
          expenseData.category = category.name
        }
      }
      
      // Only include created_by if user is authenticated
      if (user?.id) {
        expenseData.created_by = user.id
      }
      
      // Add tenant_id
      expenseData.tenant_id = user?.tenant_id
      
      console.log('Prepared expense data:', expenseData)
      
      const { error, data: result } = await supabase.from('expenses').insert(expenseData).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Expense created successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Expense created successfully')
    } catch (error: any) {
      console.error('Error creating expense:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      toast.error(`Failed to create expense: ${errorMessage}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleUpdateExpense(id: string, data: any) {
    try {
      setFormLoading(true)
      console.log('Updating expense with id:', id, 'data:', data)
      
      // Use category name instead of category_id for compatibility
      const expenseData: any = {
        description: data.description,
        amount: parseFloat(data.amount),
        expense_date: data.expense_date,
      }
      
      if (data.category_id && data.category_id !== 'all') {
        const category = categories.find(c => c.id === data.category_id)
        if (category) {
          expenseData.category = category.name
        }
      }
      
      const { error, data: result } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Expense updated successfully:', result)
      setShowModal(false)
      loadData()
      toast.success('Expense updated successfully')
    } catch (error: any) {
      console.error('Error updating expense:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      toast.error(`Failed to update expense: ${errorMessage}`)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      console.log('Deleting expense with id:', id)
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Expense deleted successfully')
      loadData()
      toast.success('Expense deleted successfully')
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error(`Failed to delete expense: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleCreateCategory(data: any) {
    try {
      setFormLoading(true)
      console.log('Creating expense category with data:', data)
      
      // Check if we're using fallback categories (table doesn't exist)
      const { data: tableCheck } = await supabase
        .from('expense_categories')
        .select('id')
        .limit(1)
      
      if (!tableCheck || tableCheck.length === 0) {
        toast.error('Expense categories table not found. Please apply the database schema first.')
        setFormLoading(false)
        return
      }
      
      // Check if category with same name already exists
      const { data: existingCategory } = await supabase
        .from('expense_categories')
        .select('id')
        .ilike('name', data.name)
        .single()
      
      if (existingCategory) {
        toast.error('A category with this name already exists')
        setFormLoading(false)
        return
      }
      
      const { error, data: result } = await supabase.from('expense_categories').insert({
        name: data.name,
        description: data.description,
        color: data.color || '#6366f1',
        icon: data.icon,
        is_active: true,
        display_order: 0,
      }).select()
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Expense category created successfully:', result)
      setShowCategoryModal(false)
      setCategoryFormData({})
      await loadData() // Wait for data to reload
      console.log('Categories after reload:', categories)
      toast.success('Expense category created successfully')
    } catch (error: any) {
      console.error('Error creating expense category:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error'
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        toast.error('A category with this name already exists')
      } else if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        toast.error('Expense categories table not found. Please apply the database schema first.')
      } else {
        toast.error(`Failed to create expense category: ${errorMessage}`)
      }
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      console.log('Deleting expense category with id:', id)
      const { error } = await supabase.from('expense_categories').delete().eq('id', id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      console.log('Expense category deleted successfully')
      loadData()
      toast.success('Expense category deleted successfully')
    } catch (error) {
      console.error('Error deleting expense category:', error)
      toast.error(`Failed to delete expense category: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function handleReceiptUpload(file: File): Promise<string | null> {
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading receipt:', error)
      return null
    }
  }

  function handleViewExpense(expense: Expense) {
    setSelectedExpense(expense)
    setModalMode('view')
    setFormData(expense as any)
    setShowModal(true)
  }

  function handleEditExpense(expense: Expense) {
    setSelectedExpense(expense)
    setModalMode('edit')
    setFormData(expense as any)
    setShowModal(true)
  }

  function handleCreateExpenseClick() {
    setSelectedExpense(null)
    setModalMode('create')
    setFormData({})
    setShowModal(true)
  }

  const expenseColumns = [
    {
      key: 'description',
      header: 'Expense',
      render: (expense: Expense) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: expense.category_color || '#ef4444', color: 'white' }}>
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">{expense.description || 'No description'}</p>
            <p className="text-sm text-gray-500">{expense.category || 'Uncategorized'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (expense: Expense) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: expense.category_color || '#6b7280' }}>
          {expense.category || 'Uncategorized'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</span>
        </div>
      ),
    },
    {
      key: 'expense_date',
      header: 'Date',
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{(() => {
            try {
              return new Date(expense.expense_date).toLocaleDateString()
            } catch {
              return 'N/A'
            }
          })()}</span>
        </div>
      ),
    },
    {
      key: 'receipt',
      header: 'Receipt',
      render: (expense: Expense) => (
        expense.receipt_url ? (
          <a
            href={expense.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View Receipt
          </a>
        ) : (
          <span className="text-gray-400 text-sm">No receipt</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (expense: Expense) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" buttonSize="sm" onClick={() => handleViewExpense(expense)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleEditExpense(expense)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" buttonSize="sm" onClick={() => handleDeleteExpense(expense.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const categoryBreakdown = categories.map(cat => ({
    category: cat.name,
    amount: expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color,
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-gray-600 mt-1">Track and manage business expenses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-red-700">Total Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{expenses.length}</p>
                <p className="text-sm text-blue-700">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{categories.length}</p>
                <p className="text-sm text-green-700">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <Button variant="ghost" buttonSize="sm" onClick={() => {
                setCategoryFormData({})
                setShowCategoryModal(true)
              }} title="Add New Category">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <Button onClick={handleCreateExpenseClick}>
              <Plus className="w-4 h-4 mr-2" />
              New Expense
            </Button>

            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Expenses by Category</h3>
          </CardHeader>
          <CardContent>
            <Chart
              type="pie"
              data={categoryBreakdown
                .filter(c => c.amount > 0)
                .map(c => ({ name: c.category, value: c.amount }))}
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Expenses by Category</h3>
          </CardHeader>
          <CardContent>
            <Chart
              type="bar"
              data={categoryBreakdown
                .filter(c => c.amount > 0)
                .map(c => ({
                  name: c.category,
                  value: c.amount,
                }))}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <DataGrid data={expenses} columns={expenseColumns} loading={loading} />

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalMode === 'create' ? 'Create' : modalMode === 'edit' ? 'Edit' : 'View'} Expense`}
          size="lg"
        >
          {modalMode === 'view' && selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-lg font-semibold">{selectedExpense.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <p className="text-gray-900">{selectedExpense.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900">{(() => {
                    try {
                      return new Date(selectedExpense.expense_date).toLocaleDateString()
                    } catch {
                      return 'N/A'
                    }
                  })()}</p>
                </div>
              </div>
              
              {selectedExpense.receipt_url && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Receipt</label>
                  <div className="mt-2">
                    <a
                      href={selectedExpense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {(modalMode === 'create' || modalMode === 'edit') && (
            <Form
              data={formData}
              onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
              onSubmit={async () => {
                try {
                  setFormLoading(true)
                  const submitData = {
                    category_id: formData.category_id,
                    description: formData.description,
                    amount: formData.amount,
                    expense_date: formData.expense_date,
                  }
                  
                  if (modalMode === 'create') {
                    await handleCreateExpense(submitData)
                  } else {
                    await handleUpdateExpense(selectedExpense!.id, submitData)
                  }
                } catch (error) {
                  console.error('Error submitting form:', error)
                } finally {
                  setFormLoading(false)
                }
              }}
              loading={formLoading}
              fields={[
                {
                  name: 'category_id',
                  label: 'Category',
                  type: 'select',
                  options: categories.map(cat => ({ value: cat.id, label: cat.name })),
                  required: true,
                },
                {
                  name: 'description',
                  label: 'Description',
                  type: 'textarea',
                },
                {
                  name: 'amount',
                  label: 'Amount',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'expense_date',
                  label: 'Date',
                  type: 'date',
                  required: true,
                },
              ]}
            />
          )}
        </Modal>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title="Create Expense Category"
          size="md"
        >
          <Form
            data={categoryFormData}
            onChange={(name, value) => setCategoryFormData(prev => ({ ...prev, [name]: value }))}
            onSubmit={async () => {
              await handleCreateCategory(categoryFormData)
            }}
            loading={formLoading}
            fields={[
              {
                name: 'name',
                label: 'Category Name',
                type: 'text',
                required: true,
              },
              {
                name: 'description',
                label: 'Description',
                type: 'textarea',
              },
              {
                name: 'color',
                label: 'Color (hex code)',
                type: 'text',
                placeholder: '#6366f1',
              },
            ]}
          />
        </Modal>
      )}
    </div>
  )
}
