import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/auth'

interface User {
  id: string
  email: string
  full_name: string | null
  is_super_admin: boolean
  role?: string
  tenant_id?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserProfile(supabaseUser: SupabaseUser) {
    console.log('=== AUTH DEBUG: fetchUserProfile ===')
    console.log('Supabase User ID:', supabaseUser.id)
    console.log('Supabase User Email:', supabaseUser.email)
    
    try {
      // Check if profile exists
      let profile = null
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      profile = profileData
      console.log('Profile query result:', profile ? 'FOUND' : 'NOT FOUND')
      if (profileError) console.error('Profile error:', profileError)
      if (profile) console.log('Profile data:', profile)

      if (!profile) {
        console.log('Profile not found, creating profile manually...')
        // Create profile manually if trigger didn't work
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            is_super_admin: supabaseUser.user_metadata?.is_super_admin || false,
            tenant_id: null,
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          console.log('Profile created successfully:', newProfile)
          profile = newProfile
        }
      }

      if (profile) {
        // Get user's role from restaurant_users
        console.log('Fetching restaurant_users assignment...')
        const { data: restaurantUser, error: restaurantUserError } = await supabase
          .from('restaurant_users')
          .select(`
            roles!inner (
              slug
            )
          `)
          .eq('profile_id', profile.id)
          .eq('status', 'active')
          .single()

        console.log('Restaurant user query result:', restaurantUser ? 'FOUND' : 'NOT FOUND')
        if (restaurantUserError) console.error('Restaurant user error:', restaurantUserError)
        if (restaurantUser) console.log('Restaurant user data:', restaurantUser)

        const userRole = restaurantUser ? (restaurantUser as any).roles.slug : undefined
        console.log('User role:', userRole)

        const userData = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          is_super_admin: profile.is_super_admin,
          role: userRole,
          tenant_id: profile.tenant_id,
        }

        console.log('Setting user state:', userData)
        setUser(userData)
      } else {
        console.error('Failed to get or create profile')
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    console.log('=== AUTH DEBUG: signIn ===')
    console.log('Email:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }

    console.log('Sign in successful')
    console.log('Session:', data.session ? 'EXISTS' : 'NULL')
    console.log('User:', data.user ? 'EXISTS' : 'NULL')
    if (data.user) {
      console.log('User ID:', data.user.id)
      console.log('User email:', data.user.email)
    }

    // Profile will be fetched by the auth state change listener
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
