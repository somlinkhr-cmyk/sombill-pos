import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/auth';
import { getUserProfile, getRestaurantUser, getRedirectPath } from '../lib/auth';

export function RoleBasedRedirect() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function redirectBasedOnRole() {
      try {
        // Get user profile
        const profile = await getUserProfile();
        
        if (!profile) {
          navigate('/login');
          return;
        }

        // If super admin, redirect to super admin dashboard
        if (profile.is_super_admin) {
          navigate('/superadmin');
          return;
        }

        // Get restaurant user assignment
        const restaurantUser = await getRestaurantUser(profile.id);
        
        if (!restaurantUser) {
          // User has no restaurant assignment, redirect to setup or error page
          navigate('/no-restaurant');
          return;
        }

        // Redirect based on role
        const redirectPath = getRedirectPath(
          restaurantUser.role_slug as any,
          profile.is_super_admin
        );
        
        navigate(redirectPath);
      } catch (error) {
        console.error('Error redirecting based on role:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }

    redirectBasedOnRole();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default RoleBasedRedirect;
