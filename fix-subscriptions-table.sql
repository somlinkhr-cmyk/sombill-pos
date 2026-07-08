-- Fix subscriptions table - Add missing columns
-- Run this in Supabase SQL Editor

-- Add restaurant_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'restaurant_id'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add billing_cycle column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'billing_cycle'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly'));
    END IF;
END $$;

-- Add current_period_start column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'current_period_start'
    ) THEN
        -- Add column without NOT NULL first
        ALTER TABLE public.subscriptions ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE;
        -- Set default value for existing rows
        UPDATE public.subscriptions SET current_period_start = NOW() WHERE current_period_start IS NULL;
        -- Now add NOT NULL constraint
        ALTER TABLE public.subscriptions ALTER COLUMN current_period_start SET NOT NULL;
    END IF;
END $$;

-- Add current_period_end column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'current_period_end'
    ) THEN
        -- Add column without NOT NULL first
        ALTER TABLE public.subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
        -- Set default value for existing rows
        UPDATE public.subscriptions SET current_period_end = NOW() + INTERVAL '1 month' WHERE current_period_end IS NULL;
        -- Now add NOT NULL constraint
        ALTER TABLE public.subscriptions ALTER COLUMN current_period_end SET NOT NULL;
    END IF;
END $$;

-- Add start_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'start_date'
    ) THEN
        -- Add column without NOT NULL first
        ALTER TABLE public.subscriptions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
        -- Set default value for existing rows
        UPDATE public.subscriptions SET start_date = NOW() WHERE start_date IS NULL;
        -- Now add NOT NULL constraint
        ALTER TABLE public.subscriptions ALTER COLUMN start_date SET NOT NULL;
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'end_date'
    ) THEN
        -- Add column without NOT NULL first
        ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
        -- Set default value for existing rows
        UPDATE public.subscriptions SET end_date = NOW() + INTERVAL '1 month' WHERE end_date IS NULL;
        -- Now add NOT NULL constraint
        ALTER TABLE public.subscriptions ALTER COLUMN end_date SET NOT NULL;
    END IF;
END $$;

-- Add trial_end_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'trial_end_date'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add auto_renew column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'auto_renew'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN auto_renew BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Add features column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'features'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN features JSONB DEFAULT '{}';
    END IF;
END $$;

-- Update status CHECK constraint to include 'trial'
DO $$
BEGIN
    -- Check if the old constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_status_check'
        AND conrelid = 'public.subscriptions'::regclass
    ) THEN
        ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;
    END IF;
    
    -- Add the updated constraint
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'trial'));
EXCEPTION
    WHEN others THEN
        -- If constraint doesn't exist or other error, just add it
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'trial'));
END $$;
