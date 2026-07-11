import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'waiter'
  | 'kitchen'
  | 'inventory'
  | 'accountant';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  tenant_id: string | null;
}

export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  profile_id: string;
  role_id: string;
  role_slug: string;
  is_owner: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  restaurantUser: RestaurantUser | null;
  loading: boolean;
}

/**
 * Get user profile from auth session
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

/**
 * Get restaurant user assignment for current user
 */
export async function getRestaurantUser(profileId: string): Promise<RestaurantUser | null> {
  const { data } = await supabase
    .from('restaurant_users')
    .select(`
      id,
      restaurant_id,
      profile_id,
      role_id,
      is_owner,
      roles!inner (
        slug
      )
    `)
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .single();

  if (!data) return null;

  return {
    id: data.id,
    restaurant_id: data.restaurant_id,
    profile_id: data.profile_id,
    role_id: data.role_id,
    role_slug: (data as any).roles.slug,
    is_owner: data.is_owner,
  };
}

/**
 * Get redirect path based on user role
 */
export function getRedirectPath(role: UserRole | null, isSuperAdmin: boolean): string {
  if (isSuperAdmin) {
    return '/superadmin';
  }

  switch (role) {
    case 'owner':
      return '/restaurant/owner';
    case 'manager':
      return '/restaurant/manager';
    case 'cashier':
      return '/restaurant/pos';
    case 'waiter':
      return '/restaurant/waiter';
    case 'kitchen':
      return '/restaurant/kitchen';
    case 'inventory':
      return '/restaurant/inventory';
    case 'accountant':
      return '/restaurant/accounting';
    default:
      return '/login';
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permissionSlug: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data } = await supabase.rpc('has_permission', {
    permission_slug: permissionSlug
  });

  return data || false;
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data } = await supabase.rpc('is_super_admin');

  return data || false;
}

/**
 * Get current user's tenant ID
 */
export async function getUserTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data } = await supabase.rpc('get_user_tenant_id');

  return data || null;
}

/**
 * Get current user's restaurant ID
 */
export async function getUserRestaurantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data } = await supabase.rpc('get_user_restaurant_id');

  return data || null;
}

/**
 * Sign out user
 */
export async function signOut() {
  await supabase.auth.signOut();
}
