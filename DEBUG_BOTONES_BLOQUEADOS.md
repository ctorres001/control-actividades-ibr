# 🐛 Debug: Botones Bloqueados en Panel Asesor

## Problema Reportado
Después de marcar "Ingreso", todos los botones quedan bloqueados. El registro aparece en la tabla pero no se puede marcar ninguna otra actividad.

## ✅ Cambios Aplicados

### 1. Mejora en Manejo de Errores
- **Archivo:** `frontend/src/pages/AsesorDashboard.jsx`
- **Cambio:** Agregado `try-catch-finally` global para garantizar que `isStarting` siempre se resetee
- **Resultado:** Los botones no deberían quedar bloqueados permanentemente

### 2. Logging Mejorado
- Agregados console.log en puntos clave:
  - `🔍 Respuesta de startActivity` - muestra la respuesta del servidor
  - `🔍 restoreOpen response` - muestra si se restaura correctamente la actividad
  - `✅ Actividad restaurada` - confirma que el estado se actualizó

### 3. Await en loadSummaryAndLog
- Ahora espera a que termine la recarga de datos antes de continuar
- Evita condiciones de carrera

## 🧪 Pasos para Probar

### Test 1: Iniciar Sesión y Marcar Ingreso

1. Limpia la base de datos (opcional):
   ```bash
   cd backend
   node scripts/cleanActivityLogs.js
   ```

2. Abre la consola del navegador (F12 → Console)

3. Inicia sesión con asesor1:
   - Usuario: `asesor1`
   - Contraseña: `Asesor1@2024`

4. Marca "Ingreso"

5. **Observa en la consola:**
   - Debería aparecer: `🔍 Respuesta de startActivity: { id: X, ... }`
   - Debería aparecer: `✅ Ingreso iniciada`

6. **Verifica que:**
   - ✅ El cronómetro empieza a contar
   - ✅ El botón "Ingreso" se deshabilita (correcto)
   - ✅ Los botones de jornada se habilitan (Seguimiento, Correo, etc.)
   - ✅ Aparece el registro en la tabla de "Registro de Hoy"

### Test 2: Marcar una Actividad de Jornada

1. Después de marcar Ingreso, espera 2-3 segundos

2. Marca "Seguimiento" (o cualquier otra actividad de jornada)

3. **Observa en la consola:**
   - Debería aparecer: `🔍 Respuesta de startActivity: { id: X, ... }`
   - Si requiere subactividad, debería abrirse un modal

4. **Verifica que:**
   - ✅ El cronómetro se reinicia
   - ✅ La actividad anterior se cierra (aparece con hora fin en la tabla)
   - ✅ La nueva actividad se marca como actual (ring azul en el botón)
   - ✅ Puedes seguir marcando otras actividades

### Test 3: Refrescar Página

1. Después de marcar una actividad, **refresca la página** (F5)

2. **Observa en la consola:**
   - Debería aparecer: `🔍 restoreOpen response: { id: X, ... }`
   - Debería aparecer: `✅ Actividad restaurada: [nombre] Offset: [segundos]`

3. **Verifica que:**
   - ✅ La actividad actual se restaura correctamente
   - ✅ El cronómetro muestra el tiempo correcto (no empieza desde 0)
   - ✅ Los botones están en el estado correcto

## 🔍 Qué Buscar en la Consola

### ✅ Logs Normales (Todo Funciona)
```
🔍 restoreOpen response: null  // Al inicio, no hay actividad
ℹ️ No hay actividad activa para restaurar
🔍 Respuesta de startActivity: { id: 23, actividadId: 8, ... }
✅ Ingreso iniciada
✅ Actividad restaurada: Ingreso Offset: 0
```

### ❌ Logs de Error (Algo Falló)
```
❌ Respuesta sin ID: undefined
// O
❌ Error iniciando actividad: [mensaje de error]
// O
❌ Error en restoreOpen: [mensaje de error]
```

## 🐛 Problemas Conocidos y Soluciones

### Problema 1: "Respuesta sin ID"
**Síntoma:** Aparece en consola `❌ Respuesta sin ID`

**Causa:** El backend no devolvió el registro creado

**Solución:**
1. Verifica que el backend esté corriendo
2. Revisa los logs del backend (terminal donde corre `npm run dev`)
3. Busca mensajes como: `❌ Error en startActivity`

### Problema 2: Botones Siguen Bloqueados
**Síntoma:** Después de marcar Ingreso, ningún botón se habilita

**Causa Posible 1:** La respuesta del backend no tiene el formato esperado

**Pasos de Debug:**
1. Abre la consola del navegador
2. Ve a la pestaña "Network"
3. Marca "Ingreso"
4. Busca la petición `POST /api/activities/start`
5. Ve a la pestaña "Response"
6. Copia y comparte la respuesta completa

**Causa Posible 2:** `dayStarted` no se está calculando correctamente

**Verificación:**
```javascript
// Pega esto en la consola del navegador después de marcar Ingreso:
console.log('Log:', window.location.href, 'incluye registros con Ingreso?');
```

### Problema 3: Cronómetro no Arranca
**Síntoma:** El registro se crea pero el cronómetro muestra 00:00:00

**Causa:** `currentStartOffset` no se está actualizando

**Verificación:**
```javascript
// Pega esto en la consola del navegador:
// (React DevTools te dará acceso al estado del componente)
```

## 📝 Información para Soporte

Si el problema persiste, proporciona:

1. **Screenshot de la pantalla completa** (con la consola del navegador visible)

2. **Logs de la consola del navegador** (copia todo el texto desde que iniciaste sesión)

3. **Logs del backend** (terminal donde corre `npm run dev`)

4. **Respuesta del endpoint** `/api/activities/start`:
   - Red → selecciona la petición → Response tab

5. **Estado actual de la base de datos**:
   ```bash
   cd backend
   node scripts/testCurrentActivity.js
   ```

## 🛠️ Comandos Útiles

```bash
# Limpiar registros
cd backend
node scripts/cleanActivityLogs.js

# Ver actividad actual en BD
node scripts/testCurrentActivity.js

# Reiniciar backend
# Ctrl+C para detener
npm run dev

# Reiniciar frontend
# Ctrl+C para detener
cd frontend
npm run dev
```

## 🔄 Reset Completo

Si nada funciona, reset completo:

```bash
# 1. Limpiar registros
cd backend
node scripts/cleanActivityLogs.js

# 2. Detener ambos servidores (Ctrl+C en ambas terminales)

# 3. Limpiar caché del navegador
# Chrome/Edge: Ctrl+Shift+Del → Marcar "Imágenes y archivos en caché" → Borrar

# 4. Reiniciar backend
cd backend
npm run dev

# 5. Reiniciar frontend (en otra terminal)
cd frontend
npm run dev

# 6. Abrir en modo incógnito
# Chrome/Edge: Ctrl+Shift+N

# 7. Ir a http://localhost:3000
```
