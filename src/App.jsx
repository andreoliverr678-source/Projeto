import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DebtProvider } from './contexts/DebtContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Landing from './pages/Landing'
import Cadastro from './pages/Cadastro'
import Entrar from './pages/Entrar'
import Diagnostico from './pages/Diagnostico'
import Plano from './pages/Plano'
import Dashboard from './pages/Dashboard'
import Gastos from './pages/Gastos'
import Renegociacao from './pages/Renegociacao'
import Perfil from './pages/Perfil'
import Consultor from './pages/Consultor'

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🌊</div>
      <div className="font-bold text-lg text-primary">Carregando Desafoga...</div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/entrar" replace />

  return children
}

// Redirects logged-in user: first-timers → /diagnostico, returning → /dashboard
function SmartHomeRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/entrar" replace />

  if (profile && profile.onboarding_completed === false) {
    return <Navigate to="/diagnostico" replace />
  }

  return <Navigate to="/dashboard" replace />
}

// Redirects logged-in user to /home if they try to access public routes (/, /entrar, /cadastro)
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/home" replace />

  return children
}

function AppWrapper({ children }) {
  return (
    <div className="device-frame">
      <div className="device-screen">
        <div className="device-header-bar">
          <div className="device-notch" />
        </div>
        <div className="app-container">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DebtProvider>
          <BrowserRouter>
            <AppWrapper>
              <Routes>
                {/* Public Routes - Auto-redirect to app if already logged in */}
                <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
                <Route path="/cadastro" element={<PublicOnlyRoute><Cadastro /></PublicOnlyRoute>} />
                <Route path="/entrar" element={<PublicOnlyRoute><Entrar /></PublicOnlyRoute>} />

                {/* Smart home redirect: first-timers → /diagnostico, returning → /dashboard */}
                <Route path="/home" element={<SmartHomeRoute />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/plano" element={<PrivateRoute><Plano /></PrivateRoute>} />
                <Route path="/consultor" element={<PrivateRoute><Consultor /></PrivateRoute>} />
                <Route path="/gastos" element={<PrivateRoute><Gastos /></PrivateRoute>} />
                <Route path="/diagnostico" element={<PrivateRoute><Diagnostico /></PrivateRoute>} />
                <Route path="/renegociacao" element={<PrivateRoute><Renegociacao /></PrivateRoute>} />
                <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />

                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </AppWrapper>
          </BrowserRouter>
        </DebtProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
