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

-- Add start_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.subscriptions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
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
        ALTER TABLE public.subscriptions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE NOT NULL;
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
