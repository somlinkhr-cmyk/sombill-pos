import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/auth'
import toast from 'react-hot-toast'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Flame,
  AlertTriangle,
  ChefHat,
  BookOpen,
  Tag,
  DollarSign,
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description?: string
  category: string
  price: number
  preparation_time: number
  ingredients?: string[]
  allergens?: string[]
  instructions?: string
  image_url?: string
  is_available: boolean
  kitchen_station?: string
  created_at: string
}

interface Category {
  id: string
  name: string
}

export default function KitchenMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [showItemDetail, setShowItemDetail] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load menu items - handle missing table gracefully
      let itemsData: MenuItem[] = []
      try {
        let itemsQuery = supabase
          .from('menu_items')
          .select('*')
          .order('name', { ascending: true })

        if (user?.tenant_id) {
          itemsQuery = itemsQuery.eq('tenant_id', user.tenant_id)
        }

        const { data: itemsDataResult, error: itemsError } = await itemsQuery

        if (itemsError) {
          // Suppress 404 errors for missing tables
          if (itemsError.code !== '404' && itemsError.code !== '42P01') {
            console.error('Error loading menu items:', itemsError)
          }
        } else {
          itemsData = itemsDataResult || []
        }
      } catch (e) {
        console.error('Error loading menu items:', e)
        toast.error('Failed to load menu items')
      }
      setMenuItems(itemsData)

      // Load categories - handle missing table gracefully
      let categoriesData: Category[] = []
      try {
        const { data: categoriesDataResult, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .order('name', { ascending: true })

        if (categoriesError) {
          // Suppress 404 errors for missing tables
          if (categoriesError.code !== '404' && categoriesError.code !== '42P01') {
            console.error('Error loading categories:', categoriesError)
          }
        } else {
          categoriesData = categoriesDataResult || []
        }
      } catch (e) {
        console.error('Error loading categories:', e)
      }
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user?.tenant_id])

  useEffect(() => {
    loadData()
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [loadData])

  const toggleAvailability = useCallback(async (itemId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', itemId)
      
      toast.success('Item availability updated')
      loadData()
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }, [loadData])

  const getPrepTimeColor = useCallback((minutes: number): string => {
    if (minutes <= 5) return 'text-[#1a9a56]'
    if (minutes <= 10) return 'text-[#d97706]'
    return 'text-[#dc2626]'
  }, [])

  const getPrepTimeLabel = useCallback((minutes: number): string => {
    if (minutes <= 5) return 'Fast'
    if (minutes <= 10) return 'Medium'
    return 'Long'
  }, [])

  const filteredItems = useMemo(() => menuItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  }), [menuItems, searchQuery, selectedCategory])

  const categoryCounts = useMemo(() => ({
    all: menuItems.length,
    ...categories.reduce((acc, cat) => {
      acc[cat.name] = menuItems.filter(item => item.category === cat.name).length
      return acc
    }, {} as Record<string, number>),
  }), [menuItems, categories])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f6f8]">
        <div className="text-center">
          <ChefHat className="w-12 h-12 animate-spin mx-auto mb-4 text-[#3d0f91]" />
          <p className="text-[#1c1530]">Loading Kitchen Menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] text-[#1c1530] font-['Inter']">
      {/* Sidebar */}
      <aside className="w-[236px] min-w-[236px] h-screen bg-gradient-to-b from-[#190a42] via-[#22105c] to-[#3d0f91] text-white flex flex-col p-[26px_18px] relative overflow-hidden">
        <div className="absolute right-[-70px] bottom-[-70px] w-[230px] h-[230px] rounded-full bg-[radial-gradient(circle,rgba(134,171,201,0.18),transparent_70%)]" />
        
        {/* Brand */}
        <div className="flex items-center gap-2.5 p-[4px_6px_28px_6px] relative z-10">
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
            <path d="M25 30 L55 30 Q70 30 70 42 Q70 54 55 54 L35 54 Q22 54 22 66 Q22 78 35 78 L65 78" stroke="#d7d9dc" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <path d="M25 30 L55 54 L35 78" stroke="#86abc9" strokeWidth="13" strokeLinecap="round" fill="none"/>
            <circle cx="70" cy="42" r="9" fill="#86abc9"/>
            <circle cx="22" cy="78" r="9" fill="#d7d9dc"/>
          </svg>
          <div>
            <div className="font-['Sora'] font-bold text-[19px] tracking-[-0.01em]">
              Som<span className="text-[#86abc9]">Bill</span>
            </div>
            <div className="text-[10.5px] text-white/50 tracking-[0.04em] uppercase mt-0.5">
              Kitchen Menu
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-white/38 p-[16px_10px_8px] relative z-10">
          Operations
        </div>
        <ul className="flex flex-col gap-0.5 relative z-10">
          <li>
            <Link to="/kitchen/operations" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <ChefHat width="17" height="17" />
              Operations
            </Link>
          </li>
          <li>
            <Link to="/kitchen/dashboard" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m7 15 4-6 3 3 5-7"/></svg>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/kitchen/system" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 3v10a2 2 0 0 0 2 2h1"/><path d="M7 3v6"/><path d="M4 3h3"/><path d="M15 3c-2 0-3 2-3 4s1 3 2 3v11"/><circle cx="19" cy="19" r="0"/></svg>
              Kitchen Display
            </Link>
          </li>
          <li>
            <Link to="/kitchen/orders" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h12l2 5H4l2-5Z"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M9 12h6"/></svg>
              Orders
            </Link>
          </li>
          <li>
            <Link to="/kitchen/menu" className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] bg-white/10 text-white text-[13.5px] font-medium transition-all shadow-[inset_3px_0_0_#86abc9]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Menu
            </Link>
          </li>
        </ul>

        {/* Footer */}
        <div className="mt-auto border-t border-white/10 pt-4 relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-[#86abc9] text-[#190a42] flex items-center justify-center font-['Sora'] font-bold text-[13px]">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KD'}
            </div>
            <div>
              <div className="text-[13px] font-semibold">{user?.name || 'Kitchen Staff'}</div>
              <div className="text-[11px] text-white/45">Kitchen Manager</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-[11px] p-[9px_12px] rounded-[10px] text-white/72 hover:bg-white/6 hover:text-white text-[13.5px] font-medium transition-all w-full"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#f5f6f8]">
        {/* Header */}
        <header className="bg-white border-b border-[#e7e8ea] p-[18px_30px] flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-['Sora'] text-[19px] font-bold tracking-[-0.01em]">Kitchen Menu</h1>
            <p className="text-[12.5px] text-[#5c5570] mt-0.5">View menu items, recipes, and preparation instructions</p>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex flex-col items-end pr-3.5 border-r border-[#e7e8ea]">
              <div className="font-['Sora'] font-bold text-[15px]">{currentTime.toLocaleTimeString()}</div>
              <div className="text-[11px] text-[#5c5570]">{currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            </div>
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[#3d0f91] text-white flex items-center justify-center font-['Sora'] font-bold text-[13px]">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KD'}
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <section className="p-[20px_30px]">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5570] w-4 h-4" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-[#e7e8ea] bg-white text-[13px] focus:outline-none focus:border-[#3d0f91]"
              />
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-[#e7e8ea] bg-white text-[13px] font-semibold hover:bg-[#f5f6f8] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
              Refresh
            </button>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="flex gap-2 px-[30px] pb-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-[100px] text-[13px] font-semibold border cursor-pointer flex items-center gap-1.5 transition-all ${
              selectedCategory === 'all' ? 'bg-[#3d0f91] border-[#3d0f91] text-white' : 'bg-white border-[#e7e8ea] text-[#1c1530]'
            }`}
          >
            All Items <span className={`text-[11px] px-[7px] py-[1px] rounded-[100px] ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-[#f5f6f8] text-[#1c1530]'}`}>{categoryCounts.all}</span>
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-4 py-2 rounded-[100px] text-[13px] font-semibold border cursor-pointer flex items-center gap-1.5 transition-all ${
                selectedCategory === category.name ? 'bg-[#3d0f91] border-[#3d0f91] text-white' : 'bg-white border-[#e7e8ea] text-[#1c1530]'
              }`}
            >
              {category.name} <span className={`text-[11px] px-[7px] py-[1px] rounded-[100px] ${selectedCategory === category.name ? 'bg-white/20 text-white' : 'bg-[#f5f6f8] text-[#1c1530]'}`}>{categoryCounts[category.name] || 0}</span>
            </button>
          ))}
        </section>

        {/* Menu Items Grid */}
        <section className="px-[30px] pb-[30px]">
          {filteredItems.length === 0 ? (
            <div className="bg-white border border-[#e7e8ea] rounded-[14px] p-8 text-center text-[#5c5570]">
              No menu items found
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-[14px] p-[18px] shadow-[0_1px_2px_rgba(28,21,48,0.04),0_8px_24px_-12px_rgba(28,21,48,0.12)] cursor-pointer transition-all hover:shadow-lg ${
                    !item.is_available ? 'border-[#e7e8ea] opacity-60' : 'border-[#e7e8ea]'
                  }`}
                  onClick={() => { setSelectedItem(item); setShowItemDetail(true) }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-['Sora'] font-bold text-[15px] mb-1">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#5c5570] bg-[#f5f6f8] px-2 py-0.5 rounded-[6px]">
                          {item.category}
                        </span>
                        {item.kitchen_station && (
                          <span className="text-[11px] text-[#3d0f91] bg-[#efeafc] px-2 py-0.5 rounded-[6px]">
                            {item.kitchen_station}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${item.is_available ? 'bg-[#1a9a56]' : 'bg-[#dc2626]'}`} />
                  </div>

                  {item.description && (
                    <p className="text-[12px] text-[#5c5570] mb-3 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock width="14" height="14" className={getPrepTimeColor(item.preparation_time)} />
                      <span className={`text-[12px] font-semibold ${getPrepTimeColor(item.preparation_time)}`}>
                        {item.preparation_time}m
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] ${
                        getPrepTimeLabel(item.preparation_time) === 'Fast' ? 'bg-[#ecfdf5] text-[#059669]' :
                        getPrepTimeLabel(item.preparation_time) === 'Medium' ? 'bg-[#fef3c7] text-[#d97706]' :
                        'bg-[#fce9e8] text-[#dc2626]'
                      }`}>
                        {getPrepTimeLabel(item.preparation_time)}
                      </span>
                    </div>
                    <div className="font-['IBM_Plex_Mono'] font-bold text-[16px]">${item.price.toFixed(2)}</div>
                  </div>

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <AlertTriangle width="14" height="14" className="text-[#dc2626]" />
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.slice(0, 2).map((allergen, index) => (
                          <span key={index} className="text-[10px] text-[#dc2626] bg-[#fce9e8] px-1.5 py-0.5 rounded-[4px]">
                            {allergen}
                          </span>
                        ))}
                        {item.allergens.length > 2 && (
                          <span className="text-[10px] text-[#dc2626]">+{item.allergens.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-[#e7e8ea]">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAvailability(item.id, item.is_available) }}
                      className={`flex-1 py-2 rounded-[8px] text-[12px] font-semibold transition-all ${
                        item.is_available 
                          ? 'bg-[#dc2626] text-white hover:brightness-0.94' 
                          : 'bg-[#1a9a56] text-white hover:brightness-0.94'
                      }`}
                    >
                      {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setShowItemDetail(true) }}
                      className="flex-1 py-2 rounded-[8px] bg-[#3d0f91] text-white text-[12px] font-semibold hover:brightness-0.94 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Item Detail Modal */}
        {showItemDetail && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[14px] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-[20px] border-b border-[#e7e8ea] flex items-center justify-between">
                <h2 className="font-['Sora'] text-[18px] font-bold">{selectedItem.name}</h2>
                <button
                  onClick={() => setShowItemDetail(false)}
                  className="p-2 rounded-[8px] hover:bg-[#f5f6f8] transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div className="p-[20px]">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Category</div>
                    <div className="font-semibold text-[14px]">{selectedItem.category}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Kitchen Station</div>
                    <div className="font-semibold text-[14px]">{selectedItem.kitchen_station || 'Not assigned'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Price</div>
                    <div className="font-['IBM_Plex_Mono'] font-bold text-[14px]">${selectedItem.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Preparation Time</div>
                    <div className="flex items-center gap-1.5">
                      <Clock width="14" height="14" className={getPrepTimeColor(selectedItem.preparation_time)} />
                      <span className={`font-semibold text-[14px] ${getPrepTimeColor(selectedItem.preparation_time)}`}>
                        {selectedItem.preparation_time} minutes
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c5570] mb-1">Availability</div>
                    <div className={`font-semibold text-[14px] ${selectedItem.is_available ? 'text-[#1a9a56]' : 'text-[#dc2626]'}`}>
                      {selectedItem.is_available ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                </div>

                {selectedItem.description && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen width="16" height="16" className="text-[#3d0f91]" />
                      <h3 className="font-['Sora'] text-[15px] font-bold">Description</h3>
                    </div>
                    <p className="text-[13px] text-[#5c5570]">{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag width="16" height="16" className="text-[#3d0f91]" />
                      <h3 className="font-['Sora'] text-[15px] font-bold">Ingredients</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.ingredients.map((ingredient, index) => (
                        <span key={index} className="text-[12px] bg-[#f5f6f8] px-2 py-1 rounded-[6px]">
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                  <div className="mb-6 p-3 bg-[#fce9e8] rounded-[8px]">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle width="16" height="16" className="text-[#dc2626]" />
                      <h3 className="font-['Sora'] text-[15px] font-bold text-[#dc2626]">Allergens</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.allergens.map((allergen, index) => (
                        <span key={index} className="text-[12px] bg-[#dc2626] text-white px-2 py-1 rounded-[6px]">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.instructions && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame width="16" height="16" className="text-[#3d0f91]" />
                      <h3 className="font-['Sora'] text-[15px] font-bold">Preparation Instructions</h3>
                    </div>
                    <div className="text-[13px] text-[#5c5570] whitespace-pre-line bg-[#f5f6f8] p-3 rounded-[8px]">
                      {selectedItem.instructions}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-[#e7e8ea]">
                  <button
                    onClick={() => toggleAvailability(selectedItem.id, selectedItem.is_available)}
                    className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all ${
                      selectedItem.is_available 
                        ? 'bg-[#dc2626] text-white hover:brightness-0.94' 
                        : 'bg-[#1a9a56] text-white hover:brightness-0.94'
                    }`}
                  >
                    {selectedItem.is_available ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                  <button
                    onClick={() => setShowItemDetail(false)}
                    className="flex-1 py-2.5 rounded-[8px] border border-[#e7e8ea] bg-white text-[13px] font-semibold hover:bg-[#f5f6f8] transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
