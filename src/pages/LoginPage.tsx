import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, loading, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Redirect to appropriate dashboard when user is logged in
  React.useEffect(() => {
    console.log('=== LOGIN PAGE DEBUG: Redirect Check ===')
    console.log('User:', user)
    console.log('User is_super_admin:', user?.is_super_admin)
    console.log('User role:', user?.role)
    console.log('User tenant_id:', user?.tenant_id)
    
    if (user) {
      console.log('User exists, determining redirect destination...')
      
      // Super Admin redirect
      if (user.is_super_admin) {
        console.log('Redirecting to Super Admin Dashboard: /superadmin')
        navigate('/superadmin', { replace: true })
        return
      }
      
      const roleRoutes: Record<string, string> = {
        owner: '/manager', // Redirect to manager dashboard (owner not implemented yet)
        manager: '/manager',
        cashier: '/cashier',
        waiter: '/waiter',
        kitchen: '/kitchen/system', // Use Kitchen Display System
        inventory: '/manager', // Redirect to manager dashboard (inventory not implemented yet)
        accountant: '/manager', // Redirect to manager dashboard (accountant not implemented yet)
      }
      
      const redirectPath = roleRoutes[user.role] || '/manager'
      console.log('Redirecting to:', redirectPath, '(based on role:', user.role + ')')
      navigate(redirectPath, { replace: true })
    } else {
      console.log('No user, staying on login page')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await signIn(email, password)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SomBill POS</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View Customer Menu (No login required)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo credentials:</p>
          <p className="mt-1">Email: role@demo.sombill.com</p>
          <p>Password: Demo123!</p>
        </div>
      </div>
    </div>
  )
}
