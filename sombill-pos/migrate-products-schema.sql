-- Migration Script: Add new columns to products table
-- Run this in your Supabase SQL Editor to update the existing products table

-- Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_code TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS full_description TEXT,
ADD COLUMN IF NOT EXISTS service_charge DECIMAL(5, 4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS current_stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS warehouse_id UUID,
ADD COLUMN IF NOT EXISTS available_dine_in BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS available_takeaway BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS available_delivery BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS available_online BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS kitchen_section TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'hidden')),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_item BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_color TEXT,
ADD COLUMN IF NOT EXISTS product_icon TEXT,
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS allergens TEXT,
ADD COLUMN IF NOT EXISTS ingredients TEXT;

-- Update existing records to have default values
UPDATE public.products 
SET 
  service_charge = 0,
  currency = 'USD',
  track_inventory = false,
  current_stock = 0,
  min_stock_level = 0,
  max_stock_level = 0,
  reorder_level = 0,
  unit = 'piece',
  available_dine_in = true,
  available_takeaway = true,
  available_delivery = true,
  available_online = true,
  product_type = 'standard',
  status = CASE WHEN is_available = true THEN 'active' ELSE 'inactive' END,
  is_featured = false,
  is_best_seller = false,
  is_new_item = false,
  display_order = 0
WHERE service_charge IS NULL OR currency IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.products.product_code IS 'Internal product code';
COMMENT ON COLUMN public.products.short_description IS 'Brief description for list views';
COMMENT ON COLUMN public.products.full_description IS 'Detailed product description';
COMMENT ON COLUMN public.products.service_charge IS 'Service charge percentage';
COMMENT ON COLUMN public.products.discount_price IS 'Special discount price';
COMMENT ON COLUMN public.products.currency IS 'Currency code (USD, EUR, GBP, SOS)';
COMMENT ON COLUMN public.products.track_inventory IS 'Enable inventory tracking';
COMMENT ON COLUMN public.products.current_stock IS 'Current stock quantity';
COMMENT ON COLUMN public.products.min_stock_level IS 'Minimum stock level before alert';
COMMENT ON COLUMN public.products.max_stock_level IS 'Maximum stock capacity';
COMMENT ON COLUMN public.products.reorder_level IS 'Stock level to trigger reorder';
COMMENT ON COLUMN public.products.unit IS 'Unit of measurement (piece, plate, bottle, etc)';
COMMENT ON COLUMN public.products.supplier_id IS 'Primary supplier reference';
COMMENT ON COLUMN public.products.warehouse_id IS 'Warehouse location reference';
COMMENT ON COLUMN public.products.available_dine_in IS 'Available for dine-in orders';
COMMENT ON COLUMN public.products.available_takeaway IS 'Available for takeaway orders';
COMMENT ON COLUMN public.products.available_delivery IS 'Available for delivery orders';
COMMENT ON COLUMN public.products.available_online IS 'Available for online orders';
COMMENT ON COLUMN public.products.product_type IS 'Product type (standard, combo, special, seasonal)';
COMMENT ON COLUMN public.products.kitchen_section IS 'Kitchen section for preparation';
COMMENT ON COLUMN public.products.brand IS 'Product brand name';
COMMENT ON COLUMN public.products.status IS 'Product status (active, inactive, out_of_stock, hidden)';
COMMENT ON COLUMN public.products.is_featured IS 'Mark as featured product';
COMMENT ON COLUMN public.products.is_best_seller IS 'Mark as best seller';
COMMENT ON COLUMN public.products.is_new_item IS 'Mark as new item';
COMMENT ON COLUMN public.products.display_order IS 'Display order in menus';
COMMENT ON COLUMN public.products.product_color IS 'Display color for UI';
COMMENT ON COLUMN public.products.product_icon IS 'Icon identifier for UI';
COMMENT ON COLUMN public.products.calories IS 'Calories per serving';
COMMENT ON COLUMN public.products.allergens IS 'Allergen information';
COMMENT ON COLUMN public.products.ingredients IS 'Ingredient list';

-- Enable RLS if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create or replace policy for full access
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Enable all access for products" 
    ON public.products FOR ALL 
    USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN null;
  END;
END $$;
