import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      // Users table
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string
          role: 'manager' | 'cashier' | 'waiter' | 'kitchen'
          salary: number
          shift: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone: string
          role: 'manager' | 'cashier' | 'waiter' | 'kitchen'
          salary: number
          shift: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          role?: 'manager' | 'cashier' | 'waiter' | 'kitchen'
          salary?: number
          shift?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Categories table
      categories: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          image_url?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Products table
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string
          barcode: string
          sku: string
          cost_price: number
          selling_price: number
          tax_rate: number
          preparation_time: number
          image_url: string
          is_available: boolean
          kitchen_printer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string
          barcode?: string
          sku?: string
          cost_price: number
          selling_price: number
          tax_rate?: number
          preparation_time?: number
          image_url?: string
          is_available?: boolean
          kitchen_printer?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string
          barcode?: string
          sku?: string
          cost_price?: number
          selling_price?: number
          tax_rate?: number
          preparation_time?: number
          image_url?: string
          is_available?: boolean
          kitchen_printer?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Product variants
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          price_modifier: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          price_modifier: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          price_modifier?: number
          is_default?: boolean
          created_at?: string
        }
      }
      // Product sizes
      product_sizes: {
        Row: {
          id: string
          product_id: string
          name: string
          price_modifier: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          price_modifier: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          price_modifier?: number
          is_default?: boolean
          created_at?: string
        }
      }
      // Toppings
      toppings: {
        Row: {
          id: string
          name: string
          price: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Tables
      tables: {
        Row: {
          id: string
          number: number
          room_id: string
          capacity: number
          status: 'available' | 'occupied' | 'reserved' | 'cleaning'
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: number
          room_id: string
          capacity: number
          status?: 'available' | 'occupied' | 'reserved' | 'cleaning'
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: number
          room_id?: string
          capacity?: number
          status?: 'available' | 'occupied' | 'reserved' | 'cleaning'
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Rooms
      rooms: {
        Row: {
          id: string
          name: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
        }
      }
      // Orders
      orders: {
        Row: {
          id: string
          table_id: string
          customer_id: string
          waiter_id: string
          cashier_id: string
          order_type: 'dine_in' | 'takeaway' | 'delivery'
          status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
          subtotal: number
          discount: number
          tax: number
          service_charge: number
          total: number
          payment_method: string
          payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id?: string
          customer_id?: string
          waiter_id?: string
          cashier_id?: string
          order_type: 'dine_in' | 'takeaway' | 'delivery'
          status?: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
          subtotal: number
          discount?: number
          tax?: number
          service_charge?: number
          total: number
          payment_method?: string
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          customer_id?: string
          waiter_id?: string
          cashier_id?: string
          order_type?: 'dine_in' | 'takeaway' | 'delivery'
          status?: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
          subtotal?: number
          discount?: number
          tax?: number
          service_charge?: number
          total?: number
          payment_method?: string
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Order items
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string
          size_id: string
          quantity: number
          unit_price: number
          total_price: number
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variant_id?: string
          size_id?: string
          quantity: number
          unit_price: number
          total_price: number
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variant_id?: string
          size_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          notes?: string
          created_at?: string
        }
      }
      // Order item toppings
      order_item_toppings: {
        Row: {
          id: string
          order_item_id: string
          topping_id: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          order_item_id: string
          topping_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          order_item_id?: string
          topping_id?: string
          quantity?: number
          price?: number
        }
      }
      // Customers
      customers: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string
          loyalty_points?: number
          total_spending?: number
          address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string
          loyalty_points?: number
          total_spending?: number
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Ingredients
      ingredients: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          unit: string
          current_stock: number
          min_stock: number
          cost_per_unit: number
          supplier_id?: string
          barcode?: string
          expiry_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          unit?: string
          current_stock?: number
          min_stock?: number
          cost_per_unit?: number
          supplier_id?: string
          barcode?: string
          expiry_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Product ingredients (recipes)
      product_ingredients: {
        Row: {
          id: string
          product_id: string
          ingredient_id: string
          quantity: number
        }
        Insert: {
          id?: string
          product_id: string
          ingredient_id: string
          quantity: number
        }
        Update: {
          id?: string
          product_id?: string
          ingredient_id?: string
          quantity?: number
        }
      }
      // Suppliers
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string
          phone: string
          email: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string
          phone: string
          email?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string
          phone?: string
          email?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Purchase orders
      purchase_orders: {
        Row: {
          id: string
          supplier_id: string
          order_date: string
          expected_date: string
          status: 'pending' | 'ordered' | 'received' | 'cancelled'
          total_amount: number
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          order_date: string
          expected_date?: string
          status?: 'pending' | 'ordered' | 'received' | 'cancelled'
          total_amount: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          order_date?: string
          expected_date?: string
          status?: 'pending' | 'ordered' | 'received' | 'cancelled'
          total_amount?: number
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Purchase order items
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          ingredient_id: string
          quantity: number
          unit_price: number
          total_price: number
        }
        Insert: {
          id?: string
          purchase_order_id: string
          ingredient_id: string
          quantity: number
          unit_price: number
          total_price: number
        }
        Update: {
          id?: string
          purchase_order_id?: string
          ingredient_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
        }
      }
      // Expenses
      expenses: {
        Row: {
          id: string
          category: string
          amount: number
          description: string
          expense_date: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          amount: number
          description?: string
          expense_date: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          amount?: number
          description?: string
          expense_date?: string
          created_by?: string
          created_at?: string
        }
      }
      // Attendance
      attendance: {
        Row: {
          id: string
          user_id: string
          check_in: string
          check_out: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          check_in: string
          check_out?: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          check_in?: string
          check_out?: string
          date?: string
          created_at?: string
        }
      }
      // Settings
      settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string
          updated_at?: string
        }
      }
      // Audit logs
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: any
          new_values: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: any
          new_values?: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: any
          new_values?: any
          created_at?: string
        }
      }
    }
  }
}
