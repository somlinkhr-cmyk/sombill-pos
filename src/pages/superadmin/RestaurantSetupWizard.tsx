import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2,
  User,
  CreditCard,
  Settings,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Clock,
  Users,
} from 'lucide-react'

interface RestaurantFormData {
  // Step 1: Basic Info
  name: string
  slug: string
  business_type: string
  logo_url?: string
  brand_color: string
  
  // Step 2: Contact Info
  phone: string
  email: string
  country: string
  city: string
  address: string
  
  // Step 3: Settings
  currency: string
  timezone: string
  language: string
  tax_rate: number
  service_charge: number
  
  // Step 4: Subscription
  plan_id: string
  billing_cycle: 'monthly' | 'yearly'
  
  // Step 5: Owner Account
  owner_first_name: string
  owner_last_name: string
  owner_email: string
  owner_phone: string
  owner_password: string
}

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string
  monthly_price: number
  yearly_price: number
  currency: string
  limits: Record<string, any>
  features: Record<string, boolean>
  is_active: boolean
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Building2 },
  { id: 2, title: 'Contact Info', icon: MapPin },
  { id: 3, title: 'Settings', icon: Settings },
  { id: 4, title: 'Subscription', icon: CreditCard },
  { id: 5, title: 'Owner Account', icon: User },
]

const BUSINESS_TYPES = [
  'Restaurant',
  'Cafe',
  'Fast Food',
  'Fine Dining',
  'Bar',
  'Nightclub',
  'Food Truck',
  'Catering',
  'Bakery',
  'Other',
]

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SOS', symbol: 'S', name: 'Somali Shilling' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
]

const TIMEZONES = [
  'UTC',
  'Africa/Mogadishu',
  'Africa/Nairobi',
  'Africa/Addis_Ababa',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
]

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'so', name: 'Somali' },
  { code: 'ar', name: 'Arabic' },
]

export default function RestaurantSetupWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: '',
    slug: '',
    business_type: 'Restaurant',
    logo_url: '',
    brand_color: '#3b82f6',
    phone: '',
    email: '',
    country: '',
    city: '',
    address: '',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    tax_rate: 0,
    service_charge: 0,
    plan_id: '',
    billing_cycle: 'monthly',
    owner_first_name: '',
    owner_last_name: '',
    owner_email: '',
    owner_phone: '',
    owner_password: '',
  })

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sa_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true })

      if (error) throw error
      
      console.log('Loaded plans:', data)
      setPlans(data || [])
      
      // Select first plan by default
      if (data && data.length > 0) {
        console.log('Setting default plan:', data[0].id)
        setFormData(prev => ({ ...prev, plan_id: data[0].id }))
      } else {
        console.warn('No active subscription plans found')
        toast.error('No subscription plans available. Please create plans first.')
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Failed to load subscription plans')
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Restaurant name is required')
          return false
        }
        if (!formData.slug.trim()) {
          toast.error('Restaurant slug is required')
          return false
        }
        if (!formData.business_type) {
          toast.error('Business type is required')
          return false
        }
        return true
      case 2:
        if (!formData.email.trim()) {
          toast.error('Email is required')
          return false
        }
        if (!formData.phone.trim()) {
          toast.error('Phone is required')
          return false
        }
        if (!formData.country.trim()) {
          toast.error('Country is required')
          return false
        }
        if (!formData.city.trim()) {
          toast.error('City is required')
          return false
        }
        return true
      case 3:
        return true
      case 4:
        if (!formData.plan_id) {
          toast.error('Please select a subscription plan')
          return false
        }
        return true
      case 5:
        if (!formData.owner_first_name.trim()) {
          toast.error('Owner first name is required')
          return false
        }
        if (!formData.owner_last_name.trim()) {
          toast.error('Owner last name is required')
          return false
        }
        if (!formData.owner_email.trim()) {
          toast.error('Owner email is required')
          return false
        }
        if (!formData.owner_password.trim()) {
          toast.error('Owner password is required')
          return false
        }
        if (formData.owner_password.length < 8) {
          toast.error('Password must be at least 8 characters')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setCreating(true)
    try {
      console.log('Starting restaurant creation process...')
      
      // Step 1: Create tenant
      console.log('Step 1: Creating tenant...')
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: formData.name,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          status: 'active',
        })
        .select()
        .single()

      if (tenantError) {
        console.error('Tenant creation error:', tenantError)
        throw tenantError
      }
      console.log('Tenant created successfully:', tenantData.id)

      // Step 2: Create restaurant
      console.log('Step 2: Creating restaurant...')
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          tenant_id: tenantData.id,
          name: formData.name,
          slug: formData.slug,
          business_type: formData.business_type,
          logo_url: formData.logo_url,
          brand_color: formData.brand_color,
          phone: formData.phone,
          email: formData.email,
          country: formData.country,
          city: formData.city,
          address: formData.address,
          currency: formData.currency,
          timezone: formData.timezone,
          language: formData.language,
          status: 'active',
        })
        .select()
        .single()

      if (restaurantError) {
        console.error('Restaurant creation error:', restaurantError)
        throw restaurantError
      }
      console.log('Restaurant created successfully:', restaurantData.id)

      // Step 3: Create main branch
      console.log('Step 3: Creating main branch...')
      const { error: branchError } = await supabase
        .from('branches')
        .insert({
          restaurant_id: restaurantData.id,
          tenant_id: tenantData.id,
          name: 'Main Branch',
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          is_main: true,
          status: 'active',
        })

      if (branchError) {
        console.error('Branch creation error:', branchError)
        throw branchError
      }
      console.log('Branch created successfully')

      // Step 4: Create subscription
      console.log('Step 4: Creating subscription...')
      const selectedPlan = plans.find(p => p.id === formData.plan_id)
      console.log('Selected plan:', selectedPlan)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + (formData.billing_cycle === 'yearly' ? 12 : 1))
      
      const freeTrialDays = selectedPlan?.limits?.free_trial_days || 0
      const trialEndDate = freeTrialDays > 0
        ? new Date(Date.now() + freeTrialDays * 24 * 60 * 60 * 1000)
        : null

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenantData.id,
          restaurant_id: restaurantData.id,
          plan_id: formData.plan_id,
          status: trialEndDate ? 'trial' : 'active',
          billing_cycle: formData.billing_cycle,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          trial_end_date: trialEndDate?.toISOString(),
          auto_renew: true,
          features: selectedPlan?.features || {},
        })

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError)
        throw subscriptionError
      }
      console.log('Subscription created successfully')

      // Step 5: Create restaurant settings
      console.log('Step 5: Creating restaurant settings...')
      const { error: settingsError } = await supabase
        .from('restaurant_settings')
        .insert({
          restaurant_id: restaurantData.id,
          tenant_id: tenantData.id,
          tax_rate: formData.tax_rate,
          service_charge: formData.service_charge,
          timezone: formData.timezone,
          currency_symbol: CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$',
          currency_position: 'before',
          decimal_places: 2,
          thousands_separator: ',',
        })

      if (settingsError) {
        console.error('Settings creation error:', settingsError)
        throw settingsError
      }
      console.log('Settings created successfully')

      // Step 6: Create default roles
      console.log('Step 6: Creating default roles...')
      try {
        await supabase.rpc('create_default_roles', {
          p_tenant_id: tenantData.id,
          p_restaurant_id: restaurantData.id,
        })
        console.log('Default roles created successfully')
      } catch (roleError) {
        console.warn('Default roles creation failed (non-critical):', roleError)
        // Continue even if this fails
      }

      // Step 7: Create owner account
      console.log('Step 7: Creating owner account...')
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: formData.owner_email,
        password: formData.owner_password,
      })

      if (userError) {
        console.error('Owner account creation error:', userError)
        throw userError
      }
      console.log('Owner account created successfully:', userData.user?.id)

      // Step 8: Create user profile
      console.log('Step 8: Creating user profile...')
      const ownerRole = await supabase
        .from('roles')
        .select('id')
        .eq('tenant_id', tenantData.id)
        .eq('restaurant_id', restaurantData.id)
        .eq('slug', 'owner')
        .single()

      console.log('Owner role:', ownerRole.data)

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userData.user?.id,
          tenant_id: tenantData.id,
          restaurant_id: restaurantData.id,
          branch_id: null, // Will be set after branch creation
          role_id: ownerRole.data?.id,
          email: formData.owner_email,
          password_hash: '', // Handled by Supabase Auth
          first_name: formData.owner_first_name,
          last_name: formData.owner_last_name,
          phone: formData.owner_phone,
          is_restaurant_owner: true,
          is_active: true,
          is_verified: true,
        })

      if (profileError) {
        console.error('User profile creation error:', profileError)
        throw profileError
      }
      console.log('User profile created successfully')

      // Step 9: Create default menu categories
      console.log('Step 9: Creating default menu categories...')
      const defaultCategories = ['Appetizers', 'Main Course', 'Desserts', 'Beverages']
      for (const category of defaultCategories) {
        await supabase.from('menu_categories').insert({
          restaurant_id: restaurantData.id,
          tenant_id: tenantData.id,
          name: category,
          description: `${category} items`,
          is_active: true,
        })
      }
      console.log('Default menu categories created successfully')

      // Step 10: Create default tables
      console.log('Step 10: Creating default tables...')
      for (let i = 1; i <= 10; i++) {
        await supabase.from('tables').insert({
          restaurant_id: restaurantData.id,
          tenant_id: tenantData.id,
          number: i,
          capacity: 4,
          status: 'available',
        })
      }
      console.log('Default tables created successfully')

      // Step 11: Log activity
      console.log('Step 11: Logging activity...')
      try {
        await supabase.from('sa_activity_logs').insert({
          user_id: user?.id,
          action: 'restaurant_created',
          entity_type: 'restaurant',
          entity_id: restaurantData.id,
          details: {
            restaurant_name: formData.name,
            restaurant_slug: formData.slug,
          },
          ip_address: null,
          user_agent: navigator.userAgent,
        })
        console.log('Activity logged successfully')
      } catch (logError) {
        console.warn('Activity logging failed (non-critical):', logError)
        // Continue even if this fails
      }

      toast.success('Restaurant created successfully!')
      navigate(`/superadmin/restaurants/${restaurantData.id}`)
    } catch (error: any) {
      console.error('Error creating restaurant:', error)
      toast.error(`Failed to create restaurant: ${error.message || 'Please try again.'}`)
    } finally {
      setCreating(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData({ 
                    ...formData, 
                    name,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter restaurant name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL-friendly identifier) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="my-restaurant"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from name, but you can customize it</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {BUSINESS_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="w-12 h-12 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="restaurant@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+252 61 234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Somalia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mogadishu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Full street address"
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Charge (%)
              </label>
              <input
                type="number"
                value={formData.service_charge}
                onChange={(e) => setFormData({ ...formData, service_charge: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Subscription Plan *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.plan_id === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, plan_id: plan.id })}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      {formData.plan_id === plan.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-semibold text-gray-900">
                        ${plan.monthly_price}/mo
                      </span>
                      {plan.yearly_price && (
                        <span className="text-gray-600">
                          ${plan.yearly_price}/yr
                        </span>
                      )}
                    </div>
                    {(plan.limits?.free_trial_days || 0) > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        {plan.limits.free_trial_days} days free trial
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(plan.features).map(([key, value]) => (
                        value && (
                          <span
                            key={key}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                          >
                            {key}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Cycle
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={formData.billing_cycle === 'monthly'}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                    className="mr-2"
                  />
                  <span>Monthly</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="yearly"
                    checked={formData.billing_cycle === 'yearly'}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                    className="mr-2"
                  />
                  <span>Yearly (Save 17%)</span>
                </label>
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.owner_first_name}
                  onChange={(e) => setFormData({ ...formData, owner_first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.owner_last_name}
                  onChange={(e) => setFormData({ ...formData, owner_last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="owner@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+252 61 234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.owner_password}
                onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/superadmin/restaurants" className="text-gray-600 hover:text-gray-900">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Setup Wizard</h1>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">{STEPS[currentStep - 1].title}</h2>
            <p className="text-sm text-gray-600">
              Step {currentStep} of {STEPS.length}
            </p>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentStep === STEPS.length ? (
            <Button onClick={handleSubmit} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Restaurant...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Restaurant
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
