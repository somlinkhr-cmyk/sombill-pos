import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import ManagerDashboard from './pages/manager/Dashboard'
import CashierPOS from './pages/cashier/POS'
import CashierOrders from './pages/cashier/Orders'
import CashierTables from './pages/cashier/Tables'
import CashierMenu from './pages/cashier/Menu'
import CashierCustomers from './pages/cashier/Customers'
import CashierMessages from './pages/cashier/Messages'
import CashierSettings from './pages/cashier/Settings'
import KitchenDisplay from './pages/kitchen/Display'
import WaiterPanel from './pages/waiter/Panel'

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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
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

  const roleRoutes: Record<string, string> = {
    manager: '/manager',
    cashier: '/cashier',
    waiter: '/waiter',
    kitchen: '/kitchen',
  }

  return <Navigate to={roleRoutes[user.role] || '/login'} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
                <KitchenDisplay />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
