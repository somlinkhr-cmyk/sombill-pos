import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter, Download, Printer, Check, Trash2 } from 'lucide-react'

interface Column<T> {
  key: string
  title?: string
  header?: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataGridProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  printable?: boolean
  selectable?: boolean
  onSearch?: (query: string) => void
  onFilter?: (filters: any) => void
  onExport?: () => void
  onPrint?: () => void
  onRowClick?: (item: T) => void
  onSelectionChange?: (selectedItems: T[]) => void
  onDeleteSelected?: (selectedItems: T[]) => void
  pageSize?: number
}

export function DataGrid<T>({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  exportable = true,
  printable = true,
  selectable = false,
  onSearch,
  onFilter,
  onExport,
  onPrint,
  onRowClick,
  onSelectionChange,
  onDeleteSelected,
  pageSize = 10,
}: DataGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    return columns.some(col => {
      const value = (item as any)[col.key]
      return String(value).toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    const aValue = (a as any)[sortColumn]
    const bValue = (b as any)[sortColumn]
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    onSearch?.(value)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const newSelected = new Set(paginatedData)
      setSelectedItems(newSelected)
      onSelectionChange?.(Array.from(newSelected))
    } else {
      setSelectedItems(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(item)
    } else {
      newSelected.delete(item)
    }
    setSelectedItems(newSelected)
    setSelectAll(newSelected.size === paginatedData.length && paginatedData.length > 0)
    onSelectionChange?.(Array.from(newSelected))
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size > 0 && onDeleteSelected) {
      onDeleteSelected(Array.from(selectedItems))
      setSelectedItems(new Set())
      setSelectAll(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {selectable && selectedItems.size > 0 && onDeleteSelected && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedItems.size})
            </button>
          )}
          {filterable && onFilter && (
            <button
              onClick={() => onFilter({})}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          )}
          {exportable && onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          {printable && onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.title || col.header}
                    {col.sortable && sortColumn === col.key && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectItem(item, e.target.checked)
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
