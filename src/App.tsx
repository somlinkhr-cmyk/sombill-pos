import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'

// Lazy load all pages for code splitting
const ManagerDashboard = lazy(() => import('./pages/manager/Dashboard'))
const CashierPOS = lazy(() => import('./pages/cashier/POS'))
const CashierOrders = lazy(() => import('./pages/cashier/Orders'))
const CashierTables = lazy(() => import('./pages/cashier/Tables'))
const CashierMenu = lazy(() => import('./pages/cashier/Menu'))
const CashierCustomers = lazy(() => import('./pages/cashier/Customers'))
const CashierMessages = lazy(() => import('./pages/cashier/Messages'))
const CashierSettings = lazy(() => import('./pages/cashier/Settings'))
const KitchenDisplay = lazy(() => import('./pages/kitchen/Display'))
const WaiterPanel = lazy(() => import('./pages/waiter/Panel'))
const NFCMenu = lazy(() => import('./pages/customer/NFCMenu'))
const WaiterDashboard = lazy(() => import('./pages/waiter/WaiterDashboard'))
const KitchenDisplaySystem = lazy(() => import('./pages/kitchen/KitchenDisplaySystem'))
const KitchenOperations = lazy(() => import('./pages/kitchen/KitchenOperations'))
const KitchenDashboard = lazy(() => import('./pages/kitchen/KitchenDashboard'))
const KitchenOrders = lazy(() => import('./pages/kitchen/KitchenOrders'))
const KitchenMenu = lazy(() => import('./pages/kitchen/KitchenMenu'))

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'))
const SuperAdminRestaurants = lazy(() => import('./pages/superadmin/Restaurants'))
const SuperAdminRestaurantSetupWizard = lazy(() => import('./pages/superadmin/RestaurantSetupWizard'))
const SuperAdminSubscriptions = lazy(() => import('./pages/superadmin/Subscriptions'))
const SuperAdminUsers = lazy(() => import('./pages/superadmin/Users'))
const SuperAdminPayments = lazy(() => import('./pages/superadmin/Payments'))
const SuperAdminSettings = lazy(() => import('./pages/superadmin/Settings'))
const SuperAdminReports = lazy(() => import('./pages/superadmin/Reports'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3d0f91] mx-auto mb-4"></div>
        <p className="text-[#1c1530] text-sm">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Super Admin bypass - check is_super_admin column
  if (user.is_super_admin) {
    return <>{children}</>
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRoutes: Record<string, string> = {
      manager: '/manager',
      cashier: '/cashier',
      waiter: '/waiter/dashboard',
      kitchen: '/kitchen/system',
      customer: '/menu',
      super_admin: '/superadmin',
    }
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />
  }

  return <>{children}</>
}

function RoleRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Super Admin redirect
  if (user.is_super_admin) {
    return <Navigate to="/superadmin" replace />
  }

  const roleRoutes: Record<string, string> = {
    manager: '/manager',
    cashier: '/cashier',
    waiter: '/waiter/dashboard',
    kitchen: '/kitchen/system',
    customer: '/menu',
  }

  return <Navigate to={roleRoutes[user.role] || '/login'} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RoleRedirect />} />
            
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/cashier"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierPOS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/orders"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/tables"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierTables />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/menu"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/customers"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/messages"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier/settings"
              element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <CashierSettings />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/waiter"
              element={
                <ProtectedRoute allowedRoles={['waiter', 'manager']}>
                  <WaiterPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/waiter/dashboard"
              element={
                <ProtectedRoute allowedRoles={['waiter', 'manager']}>
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                  <KitchenDisplay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/system"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                  <KitchenDisplaySystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/operations"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                  <KitchenOperations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/dashboard"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                  <KitchenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/orders"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                  <KitchenOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/menu"
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                  <KitchenMenu />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/customer"
              element={<NFCMenu />}
            />
            
            <Route
              path="/menu/:tableId"
              element={<NFCMenu />}
            />
            <Route
              path="/menu"
              element={<NFCMenu />}
            />
            
            {/* Super Admin Routes */}
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/restaurants"
              element={
                <ProtectedRoute>
                  <SuperAdminRestaurants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/restaurants/new"
              element={
                <ProtectedRoute>
                  <SuperAdminRestaurantSetupWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/subscriptions"
              element={
                <ProtectedRoute>
                  <SuperAdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/subscriptions/basic"
              element={
                <ProtectedRoute>
                  <SuperAdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/subscriptions/standard"
              element={
                <ProtectedRoute>
                  <SuperAdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/subscriptions/advanced"
              element={
                <ProtectedRoute>
                  <SuperAdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/plans/new"
              element={
                <ProtectedRoute>
                  <SuperAdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/plans/:id"
              element={
                <ProtectedRoute>
                  <SuperAdminSubscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/users"
              element={
                <ProtectedRoute>
                  <SuperAdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/payments"
              element={
                <ProtectedRoute>
                  <SuperAdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/settings"
              element={
                <ProtectedRoute>
                  <SuperAdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/reports"
              element={
                <ProtectedRoute>
                  <SuperAdminReports />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
