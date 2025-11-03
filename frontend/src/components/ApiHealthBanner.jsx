import { useEffect, useState } from 'react';
import api from '../services/api';

// Pequeño banner superior que verifica la salud del backend periódicamente
// y muestra un aviso si hay problemas de conectividad o configuración.
export default function ApiHealthBanner() {
  const [status, setStatus] = useState({ ok: true, checking: true, message: '' });

  async function checkHealth() {
    setStatus((s) => ({ ...s, checking: true }));
    try {
      const res = await api.get('/health');
      if (res?.data?.success) {
        setStatus({ ok: true, checking: false, message: '' });
      } else {
        setStatus({ ok: false, checking: false, message: 'El backend respondió pero no indicó OK.' });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'No se pudo contactar al backend';
      setStatus({ ok: false, checking: false, message: msg });
    }
  }

  useEffect(() => {
    // Chequeo al montar
    checkHealth();
    // Re-chequear cada 60s para recuperar automáticamente
    const id = setInterval(checkHealth, 60000);
    return () => clearInterval(id);
  }, []);

  // Determinar baseURL actual (útil para diagnosticar en producción)
  const baseURL = (api?.defaults?.baseURL) || '';

  if (status.ok) return null;

  return (
    <div className="w-full bg-red-700 text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div>
          <strong>Backend no disponible</strong>
          <span className="ml-2 opacity-90">{status.message}</span>
          {baseURL && (
            <span className="ml-2 opacity-75">(API: {baseURL})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkHealth}
            disabled={status.checking}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-60 rounded px-3 py-1"
          >
            {status.checking ? 'Verificando…' : 'Reintentar'}
          </button>
        </div>
      </div>
    </div>
  );
}
