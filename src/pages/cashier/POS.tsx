import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/auth'
import { formatCurrency } from '../../lib/utils'
import { printReceipt, downloadReceiptPDF, reprintReceipt } from '../../lib/receiptPrinter'
import { Button } from '../../components/ui/Button'
import PaymentModal from '../../components/PaymentModal'
import {
  Search,
  ShoppingCart,
  Printer,
  X,
  Plus,
  Minus,
  CreditCard,
  LogOut,
  User,
  Table as TableIcon,
  Clock,
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileText,
  Download,
  Star,
  Package,
  RefreshCw,
} from 'lucide-react'
import { CartItem, Product, Category, Table } from '../../types'

export default function CashierPOS() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todaySales, setTodaySales] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [shiftStartTime, setShiftStartTime] = useState(new Date())
  const [heldOrders, setHeldOrders] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')

  useEffect(() => {
    loadData()
    // setupRealtimeSubscriptions() // Temporarily disabled due to subscription error
    
    // Check if a table was passed from navigation
    if (location.state?.selectedTable) {
      setSelectedTable(location.state.selectedTable)
      setOrderType('dine_in')
    }
    
    // Update time every second
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Load today's stats
    loadTodayStats()
    
    // Barcode scanner listener
    let barcodeBuffer = ''
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if it's a barcode scanner input (typically ends with Enter)
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        e.preventDefault()
        handleBarcodeScan(barcodeBuffer)
        barcodeBuffer = ''
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key
      }
      
      // Clear buffer if too long (timeout)
      setTimeout(() => {
        if (barcodeBuffer.length > 0) {
          barcodeBuffer = ''
        }
      }, 100)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      clearInterval(timeInterval)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, []) // Remove products dependency to prevent re-running

  async function loadData() {
    setLoading(true)
    
    try {
      // Load each table individually with error handling
      let productsRes, categoriesRes, tablesRes, paymentMethodsRes, customersRes
      
      try {
        productsRes = await supabase.from('products').select('*').eq('tenant_id', user?.tenant_id)
      } catch (e) {
        productsRes = { error: e }
      }
      
      try {
        categoriesRes = await supabase.from('categories').select('*').eq('tenant_id', user?.tenant_id).order('display_order')
      } catch (e) {
        categoriesRes = { error: e }
      }
      
      try {
        tablesRes = await supabase.from('tables').select('*').eq('tenant_id', user?.tenant_id).order('number')
      } catch (e) {
        tablesRes = { error: e }
      }
      
      try {
        paymentMethodsRes = await supabase.from('payment_methods').select('*').eq('is_active', true).order('display_order')
      } catch (e) {
        paymentMethodsRes = { error: e }
      }
      
      try {
        customersRes = await supabase.from('customers').select('*').eq('tenant_id', user?.tenant_id).order('name')
      } catch (e) {
        customersRes = { error: e }
      }

      if (productsRes.error) {
        console.error('Products error:', productsRes.error)
      } else {
        setProducts(productsRes.data || [])
      }
      
      if (categoriesRes.error) {
        console.error('Categories error:', categoriesRes.error)
      } else {
        setCategories(categoriesRes.data || [])
      }
      
      if (tablesRes.error) {
        console.error('Tables error:', tablesRes.error)
      } else {
        setTables(tablesRes.data || [])
      }
      
      if (paymentMethodsRes.error) {
        console.error('Payment methods error:', paymentMethodsRes.error)
      } else {
        setPaymentMethods(paymentMethodsRes.data || [])
      }
      
      if (customersRes.error) {
        console.error('Customers error:', customersRes.error)
      } else {
        setCustomers(customersRes.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      // Set empty arrays to prevent undefined errors
      setProducts([])
      setCategories([])
      setTables([])
      setPaymentMethods([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function loadTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', today)
        .eq('status', 'completed')
        .eq('tenant_id', user?.tenant_id)
      
      if (orders) {
        setTodayOrders(orders.length)
        setTodaySales(orders.reduce((sum, order) => sum + (order.total || 0), 0))
      }
    } catch (error) {
      console.error('Error loading today stats:', error)
    }
  }

  function setupRealtimeSubscriptions() {
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Realtime product change:', payload)
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [...prev, payload.new as Product])
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p))
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Products channel subscribed')
        }
      })

    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        console.log('Realtime category change:', payload)
        if (payload.eventType === 'INSERT') {
          setCategories(prev => [...prev, payload.new as Category])
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new as Category : c))
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(c => c.id !== payload.old.id))
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Categories channel subscribed')
        }
      })

    const tablesChannel = supabase
      .channel('tables-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
        console.log('Realtime table change:', payload)
        if (payload.eventType === 'INSERT') {
          setTables(prev => [...prev, payload.new as Table])
        } else if (payload.eventType === 'UPDATE') {
          setTables(prev => prev.map(t => t.id === payload.new.id ? payload.new as Table : t))
        } else if (payload.eventType === 'DELETE') {
          setTables(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Tables channel subscribed')
        }
      })

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        console.log('Realtime customer change:', payload)
        if (payload.eventType === 'INSERT') {
          setCustomers(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setCustomers(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
        } else if (payload.eventType === 'DELETE') {
          setCustomers(prev => prev.filter(c => c.id !== payload.old.id))
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Customers channel subscribed')
        }
      })

    // Listen for kitchen notifications
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const notification = payload.new
        if (notification.type === 'kitchen_ready') {
          // Play sound if enabled
          const settings = localStorage.getItem('cashierSettings')
          if (settings) {
            const parsed = JSON.parse(settings)
            if (parsed.soundNotifications?.kitchenReady) {
              const audio = new Audio('/notification.mp3')
              audio.play().catch(() => {})
            }
          }
          // Show alert
          alert(`${notification.title}: ${notification.message}`)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Notifications channel subscribed')
        }
      })

    return () => {
      supabase.removeChannel(productsChannel)
      supabase.removeChannel(categoriesChannel)
      supabase.removeChannel(tablesChannel)
      supabase.removeChannel(customersChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }

  function addToCart(product: Product) {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  function clearCart() {
    setCart([])
    setSelectedTable(null)
    setSelectedCustomer(null)
  }

  function holdOrder() {
    if (cart.length === 0) return
    
    const heldOrder = {
      id: Date.now().toString(),
      cart: [...cart],
      table: selectedTable,
      customer: selectedCustomer,
      orderType,
      timestamp: new Date(),
      notes: ''
    }
    
    setHeldOrders([...heldOrders, heldOrder])
    clearCart()
    alert('Order held successfully!')
  }

  function resumeOrder(heldOrderId: string) {
    const heldOrder = heldOrders.find(o => o.id === heldOrderId)
    if (!heldOrder) return
    
    setCart(heldOrder.cart)
    setSelectedTable(heldOrder.table)
    setSelectedCustomer(heldOrder.customer)
    setOrderType(heldOrder.orderType)
    
    setHeldOrders(heldOrders.filter(o => o.id !== heldOrderId))
  }

  function deleteHeldOrder(heldOrderId: string) {
    setHeldOrders(heldOrders.filter(o => o.id !== heldOrderId))
  }

  function handleBarcodeScan(barcode: string) {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode)
    if (product) {
      if (product.is_available) {
        addToCart(product)
        // Play sound if enabled
        const settings = localStorage.getItem('cashierSettings')
        if (settings) {
          const parsed = JSON.parse(settings)
          if (parsed.barcodeScannerSettings?.soundEnabled) {
            // Play beep sound
            const audio = new Audio('/beep.mp3')
            audio.play().catch(() => {})
          }
        }
      } else {
        alert('Product is out of stock')
      }
    } else {
      alert('Product not found')
    }
  }

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.selling_price
    return sum + (price * item.quantity)
  }, 0)

  const tax = cartTotal * 0.05 // 5% tax
  const serviceCharge = cartTotal * 0.1 // 10% service charge
  const grandTotal = cartTotal + tax + serviceCharge

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function handlePaymentComplete(paymentData: any) {
    try {
      const { data: order } = await supabase.from('orders').insert({
        table_id: selectedTable?.id || null,
        cashier_id: user?.id,
        order_type: selectedTable ? 'dine_in' : 'takeaway',
        tenant_id: user?.tenant_id,
        source: 'cashier',
        status: 'completed',
        subtotal: cartTotal,
        tax,
        service_charge: serviceCharge,
        total: grandTotal,
        payment_method: paymentData.payment_method_code,
        payment_status: 'paid',
      }).select().single()

      if (order) {
        // Create payment transaction record
        await supabase.from('payment_transactions').insert({
          order_id: order.id,
          payment_method_id: paymentData.payment_method_id,
          amount: paymentData.amount,
          tenant_id: user?.tenant_id,
          status: 'paid',
          transaction_id: paymentData.transaction_id,
          reference_number: paymentData.reference_number,
          customer_phone: paymentData.customer_phone,
          payment_time: new Date().toISOString(),
        })

        // Create receipt
        const receiptNumber = `RCP-${Date.now()}`
        const { data: receipt } = await supabase.from('receipts').insert({
          order_id: order.id,
          receipt_number: receiptNumber,
          receipt_type: 'sale',
          tenant_id: user?.tenant_id,
          receipt_data: {
            restaurant_name: 'SomBill Restaurant',
            restaurant_address: 'Hargeisa, Somaliland',
            restaurant_phone: '+252 61 234 5678',
            receipt_number: receiptNumber,
            order_number: order.id,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            cashier_name: user?.name,
            table_number: selectedTable?.number,
            order_type: selectedTable ? 'dine_in' : 'takeaway',
            items: cart.map(item => ({
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: item.product.selling_price,
              total_price: item.product.selling_price * item.quantity,
            })),
            subtotal: cartTotal,
            tax,
            service_charge: serviceCharge,
            grand_total: grandTotal,
            amount_paid: paymentData.amount_paid,
            change: paymentData.change,
            payment_method: paymentData.payment_method_code.toUpperCase(),
          },
        }).select().single()

        // Create receipt items
        if (receipt) {
          for (const item of cart) {
            await supabase.from('receipt_items').insert({
              receipt_id: receipt.id,
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: item.product.selling_price,
              total_price: item.product.selling_price * item.quantity,
            })
          }
        }

        // Create order items
        for (const item of cart) {
          await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.selling_price,
            total_price: item.product.selling_price * item.quantity,
            tenant_id: user?.tenant_id,
          })
        }

        // Update order status to 'new' for kitchen
        await supabase.from('orders').update({ status: 'new' }).eq('id', order.id)

        // Create notification for kitchen
        await supabase.from('notifications').insert({
          type: 'kitchen_ready',
          title: `New Order #${order.id.slice(0, 8)}`,
          message: `Order for ${selectedTable ? `Table ${selectedTable.number}` : orderType} with ${cart.length} items`,
          tenant_id: user?.tenant_id,
          is_read: false,
          data: {
            order_id: order.id,
            table: selectedTable?.number,
            items: cart.map(item => item.product.name)
          }
        })

        if (selectedTable) {
          await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id)
        }

        // Update customer loyalty points if customer selected
        if (selectedCustomer) {
          const pointsEarned = Math.floor(grandTotal / 10) // 1 point per $10
          await supabase
            .from('customers')
            .update({
              loyalty_points: selectedCustomer.loyalty_points + pointsEarned,
              total_spending: selectedCustomer.total_spending + grandTotal
            })
            .eq('id', selectedCustomer.id)
        }

        // Print receipt automatically if enabled in settings
        const settings = localStorage.getItem('cashierSettings')
        if (settings) {
          const parsed = JSON.parse(settings)
          if (parsed.receiptSettings?.autoPrint && receipt) {
            const receiptData = {
              orderNumber: order.id.slice(0, 8),
              date: new Date(),
              cashier: user?.name || 'Cashier',
              table: selectedTable?.number?.toString(),
              customer: selectedCustomer?.name,
              customerPhone: selectedCustomer?.phone,
              orderType: selectedTable ? 'dine_in' : 'takeaway',
              items: cart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                unitPrice: item.product.selling_price,
                totalPrice: item.product.selling_price * item.quantity,
                notes: item.notes
              })),
              subtotal: cartTotal,
              tax: tax,
              serviceCharge: serviceCharge,
              discount: 0,
              total: grandTotal,
              paymentMethod: paymentData.payment_method_code,
              amountPaid: paymentData.amount_paid,
              change: paymentData.change,
              restaurantName: 'SomBill Restaurant',
              restaurantAddress: 'Mogadishu, Somalia',
              restaurantPhone: '+252 61 XXX XXXX'
            }
            
            // Direct window.open approach for printing
            const printWindow = window.open('', '_blank', 'width=800,height=1000')
            if (printWindow) {
              const html = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Receipt</title>
                  <style>
                    body { 
                      font-family: 'Courier New', monospace; 
                      padding: 30px; 
                      font-size: 14px;
                      line-height: 1.6;
                    }
                    .header { 
                      text-align: center; 
                      margin-bottom: 30px; 
                    }
                    .header h2 {
                      font-size: 24px;
                      margin-bottom: 10px;
                    }
                    .header p {
                      font-size: 14px;
                      margin: 5px 0;
                    }
                    .divider { 
                      border-top: 2px dashed #000; 
                      margin: 20px 0; 
                    }
                    .item { 
                      margin: 10px 0; 
                      font-size: 14px;
                    }
                    .total { 
                      font-weight: bold; 
                      margin-top: 20px; 
                      font-size: 16px;
                    }
                    @media print {
                      body { 
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h2>${receiptData.restaurantName}</h2>
                    <p>${receiptData.restaurantAddress}</p>
                    <p>Tel: ${receiptData.restaurantPhone}</p>
                  </div>
                  <div class="divider"></div>
                  <p><strong>Receipt #:</strong> ${receiptData.orderNumber}</p>
                  <p><strong>Date:</strong> ${receiptData.date.toLocaleString()}</p>
                  <p><strong>Cashier:</strong> ${receiptData.cashier}</p>
                  ${receiptData.table ? `<p><strong>Table:</strong> ${receiptData.table}</p>` : ''}
                  ${receiptData.customer ? `<p><strong>Customer:</strong> ${receiptData.customer}</p>` : ''}
                  <p><strong>Type:</strong> ${receiptData.orderType.toUpperCase()}</p>
                  <div class="divider"></div>
                  ${receiptData.items.map(item => `
                    <div class="item">
                      <p><strong>${item.name}</strong> x${item.quantity} - $${item.totalPrice.toFixed(2)}</p>
                    </div>
                  `).join('')}
                  <div class="divider"></div>
                  <div class="total">
                    <p><strong>Subtotal:</strong> $${receiptData.subtotal.toFixed(2)}</p>
                    <p><strong>Tax:</strong> $${receiptData.tax.toFixed(2)}</p>
                    <p><strong>Service Charge:</strong> $${receiptData.serviceCharge.toFixed(2)}</p>
                    <p style="font-size: 20px;"><strong>TOTAL:</strong> $${receiptData.total.toFixed(2)}</p>
                    <p><strong>Payment:</strong> ${receiptData.paymentMethod.toUpperCase()}</p>
                  </div>
                  <div class="divider"></div>
                  <div style="text-align: center; margin-top: 30px;">
                    <p><strong>Thank you for dining with us!</strong></p>
                    <p>${receiptData.restaurantName}</p>
                  </div>
                </body>
                </html>
              `
              printWindow.document.write(html)
              printWindow.document.close()
              printWindow.focus()
            }
          }

          // Print kitchen ticket if enabled
          if (parsed.receiptSettings?.printKitchenTicket) {
            const kitchenData = {
              orderNumber: order.id.slice(0, 8),
              date: new Date(),
              cashier: user?.name || 'Cashier',
              table: selectedTable?.number?.toString(),
              customer: selectedCustomer?.name,
              orderType: selectedTable ? 'dine_in' : 'takeaway',
              items: cart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                unitPrice: item.product.selling_price,
                totalPrice: item.product.selling_price * item.quantity,
                notes: item.notes
              })),
              subtotal: cartTotal,
              tax: tax,
              serviceCharge: serviceCharge,
              discount: 0,
              total: grandTotal,
              paymentMethod: paymentData.payment_method_code,
              amountPaid: paymentData.amount_paid,
              change: paymentData.change,
              restaurantName: 'SomBill Restaurant',
              restaurantAddress: 'Mogadishu, Somalia',
              restaurantPhone: '+252 61 XXX XXXX'
            }
            
            const printWindow = window.open('', '_blank', 'width=400,height=600')
            if (printWindow) {
              const html = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Kitchen Ticket</title>
                  <style>
                    body { font-family: monospace; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .item { margin: 5px 0; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h2>KITCHEN ORDER</h2>
                  </div>
                  <div class="divider"></div>
                  <p>Order #: ${kitchenData.orderNumber}</p>
                  <p>Date: ${kitchenData.date.toLocaleString()}</p>
                  ${kitchenData.table ? `<p>Table: ${kitchenData.table}</p>` : ''}
                  <p>Type: ${kitchenData.orderType.toUpperCase()}</p>
                  <div class="divider"></div>
                  ${kitchenData.items.map(item => `
                    <div class="item">
                      <p>${item.name} x${item.quantity}</p>
                    </div>
                  `).join('')}
                  <div class="divider"></div>
                  <script>
                    window.onload = function() {
                      window.print();
                      window.onafterprint = function() {
                        window.close();
                      }
                    }
                  </script>
                </body>
                </html>
              `
              printWindow.document.write(html)
              printWindow.document.close()
            }
          }
        }

        clearCart()
        setShowPaymentModal(false)
        alert('Order completed successfully!')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error processing payment')
    }
  }

  // Helper function for shift time formatting
  function formatShiftTime(current: Date, start: Date) {
    const diff = current.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Helper component for sidebar items
  function SidebarItem({ icon: Icon, label, collapsed, active, managerOnly, path, badge }: any) {
    if (managerOnly && user?.role !== 'manager') return null
    const isActive = active || (path === location.pathname)
    return (
      <li 
        onClick={() => path && navigate(path)}
        className={`flex items-center gap-3 p-3 px-4 rounded-lg cursor-pointer transition-all duration-150 ${
          isActive 
            ? 'bg-white/10 text-white' 
            : 'hover:bg-white/5 text-white/70'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{label}</span>
        {badge && (
          <span className="ml-auto bg-[#6B21A8] text-white text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </li>
    )
  }

  // Helper function for table status colors
  function getTableStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'occupied': return 'bg-red-500'
      case 'reserved': return 'bg-yellow-500'
      case 'cleaning': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D47A1] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Cashier Dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback if no data loaded but not loading - only show if loading failed completely
  if (!loading && products.length === 0 && categories.length === 0 && tables.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-4">
              The dashboard couldn't load data from the database. This could be due to:
            </p>
            <ul className="text-left text-sm text-gray-600 mb-4 space-y-1">
              <li>• Database connection issues</li>
              <li>• Missing or empty tables</li>
              <li>• Supabase configuration problems</li>
            </ul>
          </div>
          <button 
            onClick={() => {
              console.log('Retrying data load...')
              loadData()
            }}
            className="px-6 py-3 bg-[#6B21A8] text-white rounded-lg hover:bg-[#0D47A1] flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-[240px] bg-[#6B21A8] text-white flex flex-col p-4 flex-shrink-0">
        {/* Brand Row */}
        <div className="flex items-center gap-2.5 p-1.5 pb-5">
          <img 
            src="/design/Black and White Car Services Logo.png" 
            alt="SomBill Logo" 
            className="h-9 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="wordmark font-outfit font-bold text-base text-white">SomBill</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="nav-list list-none m-0 p-0 flex flex-col gap-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" collapsed={false} active path="/cashier" />
            <SidebarItem icon={ClipboardList} label="Orders" collapsed={false} path="/cashier/orders" badge={12} />
            <SidebarItem icon={TableIcon} label="Tables" collapsed={false} path="/cashier/tables" />
            <SidebarItem icon={FileText} label="Menu" collapsed={false} path="/cashier/menu" />
            <SidebarItem icon={BarChart3} label="Reports" collapsed={false} managerOnly path="/manager" />
            <SidebarItem icon={Settings} label="Settings" collapsed={false} path="/cashier/settings" />
          </ul>
        </nav>

        <div className="spacer flex-1"></div>

        {/* User Row */}
        <div className="user-row flex items-center gap-2.5 p-3 border-t border-white/20 mt-2">
          <div className="avatar w-8 h-8 rounded-lg bg-white text-[#6B21A8] flex items-center justify-center font-bold font-outfit flex-shrink-0 text-xs">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="user-name-role flex-1">
            <div className="name text-xs font-semibold text-white">{user?.name || 'User'}</div>
            <div className="role text-[10px] text-white/70">Cashier · Hargeisa</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="mt-3 mx-3 mb-2 flex items-center justify-center gap-2 p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-100 p-5 overflow-hidden">
        {/* Top Header */}
        <header className="main-head flex justify-between items-end mb-5 flex-wrap gap-3">
          <div>
            <h1 className="font-outfit text-xl m-0 mb-1 text-gray-900">Good evening, {user?.name?.split(' ')[0] || 'User'}</h1>
            <p className="m-0 text-gray-600 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })} — Dinner service is live</p>
          </div>
          <div className="table-pill inline-flex items-center gap-2 bg-white border border-gray-300 px-3 py-1.5 rounded-full text-xs font-semibold text-[#6B21A8]">
            <Clock className="w-3 h-3" />
            Shift · {formatShiftTime(currentTime, shiftStartTime)}
          </div>
        </header>

        {/* KPI Cards */}
        <div className="card-row grid grid-cols-4 gap-3 mb-5">
          <div className="kpi bg-white border border-gray-200 rounded-lg p-3">
            <div className="lbl font-ibmPlex text-[10px] text-gray-600 tracking-[0.05em] uppercase">Open orders</div>
            <div className="val font-outfit text-xl font-bold m-1 mb-0.5 text-gray-900">{todayOrders}</div>
            <div className="delta text-[11px] text-green-600 font-semibold">+3 vs last hour</div>
          </div>
          <div className="kpi bg-white border border-gray-200 rounded-lg p-3">
            <div className="lbl font-ibmPlex text-[10px] text-gray-600 tracking-[0.05em] uppercase">Today's revenue</div>
            <div className="val font-outfit text-xl font-bold m-1 mb-0.5 text-gray-900 font-ibmPlex">{formatCurrency(todaySales)}</div>
            <div className="delta text-[11px] text-green-600 font-semibold">+12% vs avg</div>
          </div>
          <div className="kpi bg-white border border-gray-200 rounded-lg p-3">
            <div className="lbl font-ibmPlex text-[10px] text-gray-600 tracking-[0.05em] uppercase">Tables occupied</div>
            <div className="val font-outfit text-xl font-bold m-1 mb-0.5 text-gray-900">{tables.filter(t => t.status === 'occupied').length} / {tables.length}</div>
            <div className="delta text-[11px] text-green-600 font-semibold">{Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100)}% capacity</div>
          </div>
          <div className="kpi bg-white border border-gray-200 rounded-lg p-3">
            <div className="lbl font-ibmPlex text-[10px] text-gray-600 tracking-[0.05em] uppercase">Avg. ticket time</div>
            <div className="val font-outfit text-xl font-bold m-1 mb-0.5 text-gray-900">11m</div>
            <div className="delta text-[11px] text-green-600 font-semibold">On target</div>
          </div>
        </div>

        {/* Existing POS Content - Products Grid */}
        <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
          {/* Left Side - Products */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search Bar */}
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search products or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6B21A8] bg-gray-50 text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Order Type Selection */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`flex-1 py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-xs font-medium ${
                  orderType === 'dine_in'
                    ? 'border-[#6B21A8] bg-[#6B21A8] text-white'
                    : 'border-gray-200 bg-white hover:border-[#6B21A8] text-gray-600'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Dine In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`flex-1 py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-xs font-medium ${
                  orderType === 'takeaway'
                    ? 'border-[#6B21A8] bg-[#6B21A8] text-white'
                    : 'border-gray-200 bg-white hover:border-[#6B21A8] text-gray-600'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Takeaway
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`flex-1 py-2 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-xs font-medium ${
                  orderType === 'delivery'
                    ? 'border-[#6B21A8] bg-[#6B21A8] text-white'
                    : 'border-gray-200 bg-white hover:border-[#6B21A8] text-gray-600'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Delivery
              </button>
            </div>

            {/* Table Selection (for Dine In) */}
            {orderType === 'dine_in' && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <TableIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-900">Select Table</span>
                </div>
                <div className="grid grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                  {tables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`relative p-1.5 rounded-lg border-2 transition-all h-16 ${
                        selectedTable?.id === table.id
                          ? 'border-[#6B21A8] bg-[#6B21A8]/10'
                          : 'border-gray-200 hover:border-[#6B21A8]'
                      }`}
                    >
                      <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${getTableStatusColor(table.status)}`} />
                      <p className="font-bold text-sm text-gray-900">{table.number}</p>
                      <p className="text-[9px] text-gray-600">{table.capacity} seats</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors text-xs ${
                  selectedCategory === 'all'
                    ? 'bg-[#6B21A8] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6B21A8]'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors text-xs ${
                    selectedCategory === category.id
                      ? 'bg-[#6B21A8] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-[#6B21A8]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {filteredProducts.map(product => {
                    const category = categories.find(c => c.id === product.category_id)
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 hover:shadow-md hover:border-[#6B21A8] transition-all text-left relative group w-full"
                      >
                        {!product.is_available && (
                          <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full z-10">
                            Out of stock
                          </div>
                        )}
                        <div className="aspect-square bg-gray-100 rounded-md mb-1.5 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-medium text-xs text-gray-900 truncate">{product.name}</h3>
                        <p className="text-[10px] text-gray-600 mb-0.5">{category?.name}</p>
                        <p className="font-bold text-[#6B21A8] text-xs">{formatCurrency(product.selling_price)}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Cart Panel */}
          <aside className="w-[320px] bg-white border border-gray-200 rounded-lg flex flex-col flex-shrink-0">
            {/* Cart Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-outfit text-sm font-bold text-gray-900">Current Order</h2>
                <button
                  onClick={clearCart}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={cart.length === 0}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Customer Selection */}
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full px-2.5 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs hover:border-[#6B21A8] transition-colors flex items-center justify-center gap-2 text-gray-600"
              >
                <Users className="w-3.5 h-3.5" />
                {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-2.5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                  <ShoppingCart className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[10px]">Add items to start an order</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="bg-gray-100 rounded-lg p-2.5 border border-gray-200">
                      <div className="flex gap-2.5 items-center">
                        <div className="w-9 h-9 bg-white rounded-md overflow-hidden flex-shrink-0">
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#6B21A8]/10">
                              <span className="text-[10px] text-[#6B21A8] font-bold">{item.product.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-900 text-xs truncate">{item.product.name}</p>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-gray-600 text-[10px]">{formatCurrency(item.product.selling_price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-[#6B21A8] transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-[#6B21A8] transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <p className="font-bold text-[#6B21A8] text-xs">{formatCurrency(item.product.selling_price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-100 rounded-b-lg">
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="text-gray-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Service Charge (10%)</span>
                  <span className="text-gray-900">{formatCurrency(serviceCharge)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#6B21A8]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cart.length === 0}
                  className="py-2.5 bg-[#6B21A8] text-white rounded-lg font-semibold text-xs hover:bg-[#0D47A1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Now
                </button>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  disabled={cart.length === 0}
                  className="py-2.5 bg-white border border-gray-200 text-gray-900 rounded-lg font-semibold text-xs hover:border-[#6B21A8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={holdOrder}
                  disabled={cart.length === 0}
                  className="flex-1 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-md text-[10px] hover:border-[#6B21A8] transition-colors disabled:opacity-50"
                >
                  Hold Order
                </button>
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="flex-1 py-1.5 bg-gray-100 border border-gray-200 text-red-500 rounded-md text-[10px] hover:border-red-300 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Held Orders Button */}
      {heldOrders.length > 0 && (
        <button
          onClick={() => setShowHeldOrdersModal(true)}
          className="fixed bottom-4 right-4 bg-[#6B21A8] text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-[#0D47A1] transition-colors z-40"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">{heldOrders.length} Held Orders</span>
        </button>
      )}

      {/* Held Orders Modal */}
      {showHeldOrdersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Held Orders</h2>
                <button
                  onClick={() => setShowHeldOrdersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {heldOrders.map(heldOrder => (
                  <div key={heldOrder.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {heldOrder.orderType.replace('_', ' ')}
                          {heldOrder.table && ` - Table ${heldOrder.table.number}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {heldOrder.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            resumeOrder(heldOrder.id)
                            setShowHeldOrdersModal(false)
                          }}
                          className="px-3 py-1 bg-[#6B21A8] text-white rounded text-sm hover:bg-[#0D47A1]"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => deleteHeldOrder(heldOrder.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {heldOrder.cart.length} items - {formatCurrency(
                        heldOrder.cart.reduce((sum: number, item: any) => 
                          sum + (item.product.selling_price * item.quantity), 0
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Select Customer</h2>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B21A8]"
                />
              </div>
              
              {/* Customer List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customers
                  .filter(c => 
                    !customerSearchQuery || 
                    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    c.phone.includes(customerSearchQuery)
                  )
                  .map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setShowCustomerModal(false)
                        setCustomerSearchQuery('')
                      }}
                      className="w-full p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        </div>
                        {customer.loyalty_points > 0 && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">{customer.loyalty_points}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
              
              {/* Add New Customer Button */}
              <button
                onClick={() => {
                  setShowCustomerModal(false)
                  navigate('/cashier/customers')
                }}
                className="w-full mt-4 px-4 py-2 bg-[#6B21A8] text-white rounded-lg hover:bg-[#0D47A1] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        subtotal={cartTotal}
        tax={tax}
        serviceCharge={serviceCharge}
        grandTotal={grandTotal}
        onPaymentComplete={handlePaymentComplete}
        paymentMethods={paymentMethods}
      />

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0D47A1]">Receipt Preview</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Receipt Content - Large Format */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 font-mono text-sm max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold">SomBill Restaurant</h3>
                  <p className="text-sm text-gray-600">Hargeisa, Somaliland</p>
                  <p className="text-sm text-gray-600">+252 61 234 5678</p>
                </div>
                
                <div className="border-t-2 border-b-2 border-gray-300 py-3 mb-6">
                  <div className="flex justify-between text-base">
                    <span>Receipt #: RCP-{Date.now()}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span>Cashier: {user?.name}</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  {selectedTable && (
                    <div className="flex justify-between text-base">
                      <span>Table: {selectedTable.number}</span>
                      <span>{orderType.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                
                <div className="mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.product.id} className="border-b border-gray-200">
                          <td className="py-2">{item.product.name}</td>
                          <td className="text-center py-2">{item.quantity}</td>
                          <td className="text-right py-2">{formatCurrency(item.product.selling_price)}</td>
                          <td className="text-right py-2">{formatCurrency(item.product.selling_price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between text-base mb-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-base mb-2">
                    <span>Tax (5%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-base mb-2">
                    <span>Service Charge (10%):</span>
                    <span>{formatCurrency(serviceCharge)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl border-t-2 border-gray-300 pt-4 mt-4">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
                
                <div className="text-center mt-6 pt-4 border-t-2 border-gray-300">
                  <p className="text-sm text-gray-600">Thank you for dining with us!</p>
                  <p className="text-sm text-gray-600">SomBill Restaurant</p>
                </div>
              </div>
              
              {/* Receipt Actions */}
              <div className="mt-6 space-y-2">
                <Button 
                  className="w-full bg-[#6B21A8] hover:bg-[#0D47A1]"
                  onClick={() => {
                    const receiptData = {
                      orderNumber: `RCP-${Date.now()}`,
                      date: new Date(),
                      cashier: user?.name || 'Cashier',
                      table: selectedTable?.number?.toString(),
                      customer: selectedCustomer?.name,
                      customerPhone: selectedCustomer?.phone,
                      orderType: selectedTable ? 'dine_in' : 'takeaway',
                      items: cart.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        unitPrice: item.product.selling_price,
                        totalPrice: item.product.selling_price * item.quantity,
                        notes: item.notes
                      })),
                      subtotal: cartTotal,
                      tax: tax,
                      serviceCharge: serviceCharge,
                      discount: 0,
                      total: grandTotal,
                      paymentMethod: 'Cash',
                      amountPaid: grandTotal,
                      change: 0,
                      restaurantName: 'SomBill Restaurant',
                      restaurantAddress: 'Hargeisa, Somaliland',
                      restaurantPhone: '+252 61 234 5678'
                    }
                    
                    printReceipt(receiptData, 'receipt')
                  }}
                >
                  Print Receipt
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const receiptData = {
                      orderNumber: `RCP-${Date.now()}`,
                      date: new Date(),
                      cashier: user?.name || 'Cashier',
                      table: selectedTable?.number?.toString(),
                      customer: selectedCustomer?.name,
                      customerPhone: selectedCustomer?.phone,
                      orderType: selectedTable ? 'dine_in' : 'takeaway',
                      items: cart.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        unitPrice: item.product.selling_price,
                        totalPrice: item.product.selling_price * item.quantity,
                        notes: item.notes
                      })),
                      subtotal: cartTotal,
                      tax: tax,
                      serviceCharge: serviceCharge,
                      discount: 0,
                      total: grandTotal,
                      paymentMethod: 'Cash',
                      amountPaid: grandTotal,
                      change: 0,
                      restaurantName: 'SomBill Restaurant',
                      restaurantAddress: 'Hargeisa, Somaliland',
                      restaurantPhone: '+252 61 234 5678'
                    }
                    
                    downloadReceiptPDF(receiptData)
                  }}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
