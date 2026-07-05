-- Sample Data for SomBill POS
-- Run this SQL in your Supabase SQL Editor after running supabase-schema.sql

-- Insert sample categories
INSERT INTO public.categories (id, name, description, display_order, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Beverages', 'Hot and cold drinks', 1, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Main Courses', 'Main dishes and entrees', 2, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Appetizers', 'Starters and appetizers', 3, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Desserts', 'Sweet treats and desserts', 4, true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Snacks', 'Quick snacks and sides', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (id, category_id, name, barcode, sku, cost_price, selling_price, tax_rate, preparation_time, is_available, is_best_seller, is_featured) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Espresso', '1234567890123', 'ESP001', 2.00, 3.50, 0.05, 2, true, true, true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Cappuccino', '1234567890124', 'CAP001', 2.50, 4.50, 0.05, 3, true, true, true),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Latte', '1234567890125', 'LAT001', 2.50, 4.50, 0.05, 3, true, true, false),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Iced Tea', '1234567890126', 'ICT001', 1.00, 2.50, 0.05, 2, true, false, false),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Fresh Juice', '1234567890127', 'JUS001', 2.00, 4.00, 0.05, 3, true, false, true),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Grilled Chicken', '1234567890128', 'GCH001', 8.00, 15.00, 0.10, 15, true, true, true),
  ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Beef Burger', '1234567890129', 'BUR001', 6.00, 12.00, 0.10, 12, true, true, true),
  ('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'Pasta Carbonara', '1234567890130', 'PAS001', 5.00, 10.00, 0.10, 10, true, false, false),
  ('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Caesar Salad', '1234567890131', 'SAL001', 4.00, 8.00, 0.05, 5, true, false, false),
  ('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'Garlic Bread', '1234567890132', 'GBR001', 2.00, 4.00, 0.05, 5, true, true, false),
  ('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Chocolate Cake', '1234567890133', 'CAK001', 3.00, 6.00, 0.05, 3, true, true, true),
  ('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'Ice Cream', '1234567890134', 'ICE001', 2.00, 4.00, 0.05, 2, true, false, false),
  ('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', 'French Fries', '1234567890135', 'FRY001', 1.50, 3.50, 0.05, 5, true, true, false),
  ('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'Onion Rings', '1234567890136', 'ONR001', 2.00, 4.00, 0.05, 5, true, false, false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample tables
INSERT INTO public.tables (id, number, capacity, status, position_x, position_y) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 1, 4, 'available', 100, 100),
  ('770e8400-e29b-41d4-a716-446655440002', 2, 4, 'available', 200, 100),
  ('770e8400-e29b-41d4-a716-446655440003', 3, 6, 'available', 100, 200),
  ('770e8400-e29b-41d4-a716-446655440004', 4, 6, 'occupied', 200, 200),
  ('770e8400-e29b-41d4-a716-446655440005', 5, 2, 'available', 300, 100),
  ('770e8400-e29b-41d4-a716-446655440006', 6, 2, 'reserved', 300, 200),
  ('770e8400-e29b-41d4-a716-446655440007', 7, 8, 'available', 100, 300),
  ('770e8400-e29b-41d4-a716-446655440008', 8, 8, 'cleaning', 200, 300)
ON CONFLICT (number) DO NOTHING;

-- Insert sample payment methods
INSERT INTO public.payment_methods (id, name, code, type, is_active, display_order) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Cash', 'CASH', 'cash', true, 1),
  ('880e8400-e29b-41d4-a716-446655440002', 'Zaad', 'ZAAD', 'mobile', true, 2),
  ('880e8400-e29b-41d4-a716-446655440003', 'eDahab', 'EDAHAB', 'mobile', true, 3),
  ('880e8400-e29b-41d4-a716-446655440004', 'Credit Card', 'CARD', 'card', true, 4),
  ('880e8400-e29b-41d4-a716-446655440005', 'Bank Transfer', 'TRANSFER', 'bank', true, 5)
ON CONFLICT (id) DO NOTHING;

-- Insert sample customers
INSERT INTO public.customers (id, name, phone, email, loyalty_points, total_spending) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Ahmed Ali', '+252612345678', 'ahmed@example.com', 150, 750.00),
  ('990e8400-e29b-41d4-a716-446655440002', 'Fatima Hassan', '+252612345679', 'fatima@example.com', 300, 1500.00),
  ('990e8400-e29b-41d4-a716-446655440003', 'Mohamed Ibrahim', '+252612345680', 'mohamed@example.com', 50, 250.00),
  ('990e8400-e29b-41d4-a716-446655440004', 'Aisha Omar', '+252612345681', 'aisha@example.com', 200, 1000.00),
  ('990e8400-e29b-41d4-a716-446655440005', 'Ali Yusuf', '+252612345682', 'ali@example.com', 100, 500.00)
ON CONFLICT (id) DO NOTHING;
