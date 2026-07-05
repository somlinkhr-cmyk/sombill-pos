export type UserRole = 'manager' | 'cashier' | 'waiter' | 'kitchen'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: UserRole
  salary: number
  shift: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  image_url: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string
  short_description?: string
  full_description?: string
  barcode: string
  sku: string
  cost_price: number
  selling_price: number
  tax_rate: number
  service_charge: number
  discount_price?: number
  currency: string
  preparation_time: number
  image_url: string
  is_available: boolean
  kitchen_printer: string
  // Inventory fields
  track_inventory: boolean
  current_stock: number
  min_stock_level: number
  max_stock_level: number
  reorder_level: number
  unit: string
  // Restaurant options
  available_dine_in: boolean
  available_takeaway: boolean
  available_delivery: boolean
  available_online: boolean
  // Product type
  product_type: string
  kitchen_section?: string
  brand?: string
  // Product status
  status: string
  // Display options
  is_featured: boolean
  is_best_seller: boolean
  is_new_item: boolean
  display_order: number
  product_color?: string
  product_icon?: string
  // Nutritional information
  calories?: number
  allergens?: string
  ingredients?: string
  // Relations
  category?: Category
  variants?: ProductVariant[]
  sizes?: ProductSize[]
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  price_modifier: number
  is_default: boolean
  created_at: string
}

export interface ProductSize {
  id: string
  product_id: string
  name: string
  price_modifier: number
  is_default: boolean
  created_at: string
}

export interface Topping {
  id: string
  name: string
  price: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export interface Table {
  id: string
  number: number
  room_id: string
  capacity: number
  status: TableStatus
  position_x: number
  position_y: number
  room?: Room
  current_order?: Order
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  description: string
  created_at: string
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery'
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'

export interface Order {
  id: string
  table_id: string
  customer_id: string
  waiter_id: string
  cashier_id: string
  order_type: OrderType
  status: OrderStatus
  subtotal: number
  discount: number
  tax: number
  service_charge: number
  total: number
  payment_method: string
  payment_status: PaymentStatus
  notes: string
  table?: Table
  customer?: Customer
  waiter?: User
  cashier?: User
  items?: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  size_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes: string
  product?: Product
  variant?: ProductVariant
  size?: ProductSize
  toppings?: OrderItemTopping[]
  created_at: string
}

export interface OrderItemTopping {
  id: string
  order_item_id: string
  topping_id: string
  quantity: number
  price: number
  topping?: Topping
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  loyalty_points: number
  total_spending: number
  address: string
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  name: string
  description: string
  unit: string
  current_stock: number
  min_stock: number
  cost_per_unit: number
  supplier_id: string
  barcode: string
  expiry_date: string
  supplier?: Supplier
  created_at: string
  updated_at: string
}

export interface ProductIngredient {
  id: string
  product_id: string
  ingredient_id: string
  quantity: number
  ingredient?: Ingredient
}

export interface Supplier {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  created_at: string
  updated_at: string
}

export type PurchaseOrderStatus = 'pending' | 'ordered' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  supplier_id: string
  order_date: string
  expected_date: string
  status: PurchaseOrderStatus
  total_amount: number
  notes: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  ingredient_id: string
  quantity: number
  unit_price: number
  total_price: number
  ingredient?: Ingredient
}

export interface Expense {
  id: string
  category: string
  amount: number
  description: string
  expense_date: string
  created_by: string
  created_at: string
}

export interface Attendance {
  id: string
  user_id: string
  check_in: string
  check_out: string
  date: string
  user?: User
  created_at: string
}

export interface Setting {
  id: string
  key: string
  value: string
  description: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values: any
  new_values: any
  user?: User
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
  variant?: ProductVariant
  size?: ProductSize
  toppings?: Topping[]
  notes?: string
}

export interface DashboardStats {
  todaySales: number
  monthlyRevenue: number
  ordersToday: number
  activeTables: number
  totalCustomers: number
  cashInRegister: number
  expenses: number
  profit: number
}
