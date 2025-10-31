import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getBaseRouteForUser } from '../utils/roles';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // const [showForgotPassword, setShowForgotPassword] = useState(false);
  // const [showConfirmModal, setShowConfirmModal] = useState(false);
  // const [email, setEmail] = useState('');
  // const [forgotUsername, setForgotUsername] = useState('');
  // const [isResetting, setIsResetting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Por favor completa todos los campos', { id: 'login-validation' });
      return;
    }

    setIsLoading(true);

    try {
      const credentials = { username, password };
      const response = await login(credentials);
      
      if (response.success) {
        // Usar getBaseRouteForUser que ya maneja role/rol y normalización
        const route = getBaseRouteForUser(response.usuario);
        toast.success(`¡Bienvenido, ${response.usuario.nombreCompleto}!`, { id: 'login-success' });
        navigate(route);
      }
    } catch (error) {
      // El error ya se maneja en el AuthContext con toast
      console.error('Error en LoginPage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /* FUNCIONALIDAD DE "OLVIDASTE TU CONTRASEÑA" COMENTADA TEMPORALMENTE
  const handleForgotPasswordClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmReset = () => {
    setShowConfirmModal(false);
    setShowForgotPassword(true);
  };

  const handleCancelReset = () => {
    setShowConfirmModal(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor ingresa tu correo electrónico', { id: 'forgot-validation' });
      return;
    }

    if (!forgotUsername.trim()) {
      toast.error('Por favor ingresa tu nombre de usuario', { id: 'forgot-validation' });
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch('http://localhost:3001/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          username: forgotUsername.trim() 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Revisa tu correo electrónico. Se ha enviado una contraseña temporal.', { 
          id: 'forgot-success', 
          duration: 6000 
        });
        
        setShowForgotPassword(false);
        setEmail('');
        setForgotUsername('');
      } else {
        toast.error(data.error || 'Error al solicitar reset', { id: 'forgot-error' });
      }
    } catch (error) {
      console.error('Error en forgot password:', error);
      toast.error('Error al conectar con el servidor', { id: 'forgot-error' });
    } finally {
      setIsResetting(false);
    }
  };
  */

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <img
            src="/ibr-logo.png"
            alt="IBR Logo"
            className="h-24 w-auto mb-8"
          />
          <h1 className="text-center text-3xl font-bold text-primary-700">Control de Actividades</h1>
          <h2 className="mt-6 text-center text-xl text-neutral-600">
            Inicia sesión para continuar
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field"
                placeholder="asesor1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          {/* BOTÓN "OLVIDASTE TU CONTRASEÑA" COMENTADO TEMPORALMENTE
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          */}
        </form>

        {/* FORMULARIO Y MODAL DE RESET COMENTADOS TEMPORALMENTE
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <label htmlFor="forgot-username" className="block text-sm font-medium text-neutral-700 mb-2">
                Nombre de Usuario
              </label>
              <input
                id="forgot-username"
                name="forgot-username"
                type="text"
                required
                className="input-field"
                placeholder="asesor1"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                disabled={isResetting}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isResetting}
              />
              <p className="mt-2 text-xs text-neutral-500">
                Te enviaremos una contraseña temporal a tu correo registrado
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isResetting}
                className="btn-primary w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? 'Enviando...' : 'Restablecer Contraseña'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setEmail('');
                  setForgotUsername('');
                }}
                className="w-full py-3 px-4 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
              >
                Volver al Login
              </button>
            </div>
          </form>
        )}
        */}

        {/* MODAL DE CONFIRMACIÓN COMENTADO TEMPORALMENTE
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                ¿Deseas restablecer tu contraseña?
              </h3>
              <p className="text-sm text-neutral-600">
                Se generará una contraseña temporal y se enviará a tu correo electrónico registrado. 
                Después de iniciar sesión, podrás personalizarla.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelReset}
                  className="px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                >
                  No, volver
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sí, restablecer
                </button>
              </div>
            </div>
          </div>
        )}
        */}

        {/* Footer space if needed */}
        <div className="mt-6">
          {/* You can add a footer message or additional content here if needed */}
        </div>
      </div>
    </div>
  );
}