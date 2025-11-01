// =====================================================
// src/App.jsx - Configuración principal de rutas
// =====================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AsesorDashboard from './pages/AsesorDashboard'; // ← Agregar import
import SupervisorDashboard from './pages/SupervisorDashboard';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminDashboard from './pages/AdminDashboard';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-neutral-50">
            <Routes>
              {/* Ruta de login */}
              <Route path="/login" element={<LoginPage />} />

              {/* Ruta de cambio de contraseña */}
              <Route path="/change-password" element={<ChangePasswordPage />} />

              {/* Redirección por defecto */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Rutas protegidas - las crearemos después */}
              <Route path="/asesor" element={<AsesorDashboard />} />
              
              <Route path="/supervisor" element={<SupervisorDashboard />} />
              
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Ruta 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-4">404</h1>
                    <p className="text-neutral-600 mb-4">Página no encontrada</p>
                    <Navigate to="/login" replace />
                  </div>
                </div>
              } />
            </Routes>
          </div>

          {/* Notificaciones Toast */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{
              top: 20,
              right: 20,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                padding: '12px 16px',
                maxWidth: '400px',
              },
              success: {
                duration: 2500,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  background: '#065f46',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: '#7f1d1d',
                },
              },
              loading: {
                duration: Infinity,
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;