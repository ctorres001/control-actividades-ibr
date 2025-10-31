import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Validaciones de contraseña
  const validations = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*]/.test(newPassword),
    match: newPassword && newPassword === confirmPassword
  };

  const isValidPassword = Object.values(validations).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error('Ingresa tu contraseña actual', { id: 'change-pwd-validation' });
      return;
    }

    if (!isValidPassword) {
      toast.error('La contraseña no cumple con los requisitos', { id: 'change-pwd-validation' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/password/change', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        toast.success('Contraseña actualizada exitosamente', { id: 'change-pwd-success' });
        navigate(-1); // Volver a la página anterior
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      const message = error.response?.data?.error || 'Error al cambiar contraseña';
      toast.error(message, { id: 'change-pwd-error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            Cambiar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Personaliza tu contraseña temporal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Contraseña actual */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-10"
                  placeholder="Tu contraseña temporal"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-10"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="input-field pr-10"
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Requisitos de contraseña */}
          {newPassword && (
            <div className="bg-neutral-100 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-neutral-700 mb-2">
                La contraseña debe cumplir:
              </p>
              <div className="space-y-1">
                <ValidationItem valid={validations.length} text="Al menos 8 caracteres" />
                <ValidationItem valid={validations.uppercase} text="Una letra mayúscula" />
                <ValidationItem valid={validations.lowercase} text="Una letra minúscula" />
                <ValidationItem valid={validations.number} text="Un número" />
                <ValidationItem valid={validations.special} text="Un carácter especial (!@#$%^&*)" />
                {confirmPassword && (
                  <ValidationItem valid={validations.match} text="Las contraseñas coinciden" />
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isLoading}
              className="flex-1 py-3 px-4 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !isValidPassword}
              className="flex-1 btn-primary py-3 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ValidationItem({ valid, text }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {valid ? (
        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
      ) : (
        <XCircle size={16} className="text-neutral-400 flex-shrink-0" />
      )}
      <span className={valid ? 'text-green-700' : 'text-neutral-600'}>
        {text}
      </span>
    </div>
  );
}
