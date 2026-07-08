-- =====================================================
-- SOMBILL POS SUPER ADMIN PLATFORM DATABASE SCHEMA
-- =====================================================
-- Adds Super Admin functionality to existing single-tenant schema
-- Preserves all existing tables and data
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ADD SUPER ADMIN COLUMN TO EXISTING USERS TABLE
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin);

-- =====================================================
-- SUPER ADMIN ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10, 2) NOT NULL,
    yearly_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    limits JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES sa_subscription_plans(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES sa_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    payment_method VARCHAR(50),
    gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    invoice_id VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    category VARCHAR(50),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPER ADMIN API KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sa_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HELPER FUNCTION FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_sa_subscription_plans_updated_at BEFORE UPDATE ON sa_subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sa_subscriptions_updated_at BEFORE UPDATE ON sa_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sa_payments_updated_at BEFORE UPDATE ON sa_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sa_system_settings_updated_at BEFORE UPDATE ON sa_system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sa_api_keys_updated_at BEFORE UPDATE ON sa_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO sa_subscription_plans (name, slug, description, monthly_price, yearly_price, limits, features) VALUES
('Starter', 'starter', 'Perfect for small restaurants', 29.99, 299.99,
 '{"monthly_orders": 500, "tables": 10, "staff": 5, "menu_items": 100, "branches": 1}'::jsonb,
 '{"waiter_dashboard": true, "kitchen_display": true, "nfc_menu": false, "advanced_reports": false, "multi_location": false, "api_access": false}'::jsonb),
('Professional', 'professional', 'For growing businesses', 79.99, 799.99,
 '{"monthly_orders": 2000, "tables": 25, "staff": 15, "menu_items": 500, "branches": 3}'::jsonb,
 '{"waiter_dashboard": true, "kitchen_display": true, "nfc_menu": true, "advanced_reports": true, "multi_location": false, "api_access": true}'::jsonb),
('Enterprise', 'enterprise', 'Full-featured for large chains', 199.99, 1999.99,
 '{"monthly_orders": 10000, "tables": 100, "staff": 50, "menu_items": 2000, "branches": 10}'::jsonb,
 '{"waiter_dashboard": true, "kitchen_display": true, "nfc_menu": true, "advanced_reports": true, "multi_location": true, "api_access": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =====================================================
INSERT INTO sa_system_settings (key, value, description, category, type) VALUES
('platform_name', '"SomBill POS"', 'Platform name displayed in UI', 'platform', 'string'),
('default_currency', '"USD"', 'Default currency for new restaurants', 'platform', 'string'),
('maintenance_mode', 'false', 'Enable maintenance mode', 'platform', 'boolean'),
('trial_days', '14', 'Trial period in days', 'subscription', 'number')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT SUPER ADMIN ROLE
-- =====================================================
INSERT INTO sa_roles (name, slug, description, permissions, is_system) VALUES
('Super Admin', 'super_admin', 'Full system access with all permissions',
 '{"all": true, "restaurants": true, "users": true, "subscriptions": true, "payments": true, "reports": true, "settings": true, "audit": true}'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;
