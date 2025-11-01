# 🐛 Solución de Problemas - Error al Iniciar Actividad

## Problema Reportado
"Error iniciando actividad" al intentar iniciar una actividad en el panel de Asesor.

## ✅ Diagnóstico Realizado

### 1. Verificación de la API
- ✅ El endpoint `/api/activities/start` funciona correctamente
- ✅ La lógica de inicio de actividad está implementada correctamente
- ✅ Las validaciones de actividad y subactividad funcionan
- ✅ El cierre automático de actividades anteriores funciona

### 2. Pruebas Realizadas
Se ejecutaron scripts de prueba que confirmaron:
- El login funciona correctamente con las credenciales correctas
- Las actividades se obtienen correctamente
- El inicio de actividad funciona y crea registros en la BD

### 3. Causa Probable
El error ocurre cuando **el servidor backend NO está corriendo** o cuando hay un problema de red/CORS.

## 🔧 Soluciones

### Solución 1: Asegúrate de que el Backend esté Corriendo

1. Abre una terminal en la carpeta `backend`
2. Ejecuta:
   ```bash
   npm run dev
   ```
3. Verifica que veas el mensaje:
   ```
   🚀 Servidor iniciado exitosamente
   📍 URL: http://localhost:3001
   ✅ Conectado a la base de datos Neon
   ```

### Solución 2: Verifica tus Credenciales

Las contraseñas actuales son:
- **asesor1:** `Asesor1@2024` (NO "Asesor123")
- **asesor2:** `Asesor2@2024`
- **asesor3:** `Asesor3@2024`
- **asesor4:** `Asesor4@2024`
- **asesor5:** `Asesor5@2024`

Si has estado usando credenciales antiguas, cierra sesión y vuelve a iniciar con las credenciales correctas.

### Solución 3: Limpia el Almacenamiento Local del Navegador

1. Abre las herramientas de desarrollador del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. En "Local Storage", elimina los items `token` y `user`
4. Recarga la página y vuelve a iniciar sesión

### Solución 4: Verifica que el Frontend esté Configurado Correctamente

1. El frontend debe estar corriendo en `http://localhost:3000`
2. El backend debe estar corriendo en `http://localhost:3001`
3. Verifica que no haya errores de CORS en la consola del navegador

### Solución 5: Reinicia Ambos Servidores

1. Detén el backend (Ctrl+C en la terminal donde está corriendo)
2. Detén el frontend (Ctrl+C en la terminal donde está corriendo)
3. Limpia las instalaciones si es necesario:
   ```bash
   # En backend
   cd backend
   rm -rf node_modules
   npm install
   
   # En frontend
   cd frontend
   rm -rf node_modules
   npm install
   ```
4. Inicia primero el backend:
   ```bash
   cd backend
   npm run dev
   ```
5. Luego inicia el frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## 🧪 Cómo Probar que Todo Funciona

### Test 1: Verifica el Backend

Abre tu navegador y ve a:
```
http://localhost:3001/api/health
```

Deberías ver algo como:
```json
{
  "success": true,
  "status": "OK",
  "uptime": 123.45,
  "timestamp": "2025-11-01T00:00:00.000Z",
  "database": "connected"
}
```

### Test 2: Prueba el Login desde la Terminal

En la carpeta `backend`, ejecuta:
```bash
node scripts/testApiFlow.js
```

Deberías ver:
```
✅ Login exitoso
✅ Actividades obtenidas
✅ Actividad iniciada exitosamente
```

### Test 3: Prueba desde el Navegador

1. Ve a `http://localhost:3000`
2. Inicia sesión con:
   - Usuario: `asesor1`
   - Contraseña: `Asesor1@2024`
3. Abre la consola del navegador (F12 → Console)
4. Intenta iniciar una actividad (por ejemplo, "Ingreso")
5. Si hay un error, verás el mensaje exacto en la consola

## 📋 Checklist Completo

- [ ] El backend está corriendo en http://localhost:3001
- [ ] El frontend está corriendo en http://localhost:3000
- [ ] Puedo acceder a http://localhost:3001/api/health y veo "status": "OK"
- [ ] He limpiado el Local Storage del navegador
- [ ] Estoy usando las credenciales correctas (ver CREDENCIALES.md)
- [ ] No hay errores de red en la consola del navegador (F12)
- [ ] No hay errores de CORS en la consola del navegador

## 📞 ¿Aún tienes problemas?

Si después de seguir estos pasos el error persiste:

1. Copia el error exacto que aparece en:
   - La consola del navegador (F12 → Console)
   - La terminal del backend
   - El mensaje de error en la pantalla

2. Verifica los logs del backend (la terminal donde corre `npm run dev`)

3. Comparte esa información para un diagnóstico más específico

## 🔍 Información Técnica Adicional

### Endpoint de Inicio de Actividad
- **URL:** `POST /api/activities/start`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "actividadId": 8,
    "subactividadId": 1, // opcional
    "observaciones": "..." // opcional
  }
  ```

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Actividad iniciada correctamente",
  "data": {
    "id": 18,
    "usuarioId": 1,
    "actividadId": 8,
    "fecha": "2025-11-01T00:00:00.000Z",
    "horaInicio": "2025-11-01T00:00:00.000Z",
    "estado": "Iniciado"
  }
}
```

### Respuesta de Error Típica
```json
{
  "success": false,
  "error": "Error al iniciar actividad",
  "details": "..."
}
```
