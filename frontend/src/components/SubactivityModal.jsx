import React, { useEffect, useState } from 'react';

export default function SubactivityModal({ activity, onCancel, onConfirm, loadSubactivities }) {
  const [subactivities, setSubactivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [clientRef, setClientRef] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState(''); // Nuevo estado para manejar errores

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const res = await loadSubactivities(activity.id);
        if (mounted) {
          setSubactivities(res || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('SubactivityModal: loadSubactivities error', err);
        if (mounted) {
          setSubactivities([]);
          setLoading(false);
          if (onCancel) {
            setTimeout(() => {
              onCancel();
            }, 100);
          }
        }
      }
    })();
    return () => { mounted = false; };
  }, [activity, loadSubactivities, onCancel]);

  const handleConfirm = () => {
    if (!clientRef.trim()) {
      setError('El campo ID Cliente / Referencia es obligatorio.');
      return;
    }

    setError(''); // Limpiar errores si todo está bien
    onConfirm({ 
      subactivityId: selected, 
      subactivityName: subactivities.find(s => s.id === selected)?.nombreSubactividad || subactivities.find(s => s.id === selected)?.nombre_subactividad, 
      idClienteReferencia: clientRef.trim(),
      resumenBreve: comment.trim() || null
    });
  };

  const handleClientRefChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Validar solo números
      setClientRef(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-3">Detalles de {activity.nombreActividad}</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-neutral-500 mt-2">Cargando opciones...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <div className="text-sm font-medium mb-1">Tipo de gestión</div>
              <select 
                value={selected || ''} 
                onChange={(e) => setSelected(Number(e.target.value))} 
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- seleccionar --</option>
                {subactivities.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombreSubactividad || s.nombre_subactividad}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div className="text-sm font-medium mb-1">ID Cliente / Referencia</div>
              <input 
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={clientRef} 
                onChange={handleClientRefChange} 
                placeholder="Ej: 12345" 
                maxLength={100}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>} {/* Mostrar error si existe */}
            </label>

            <label>
              <div className="text-sm font-medium mb-1">Resumen breve</div>
              <textarea 
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={4} 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                placeholder="Descripción..." 
                maxLength={500}
              />
            </label>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded border hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading || !selected}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
