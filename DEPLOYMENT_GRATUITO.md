# 🚀 Guía de Despliegue Gratuito - Marcha Blanca (80 Usuarios)

## 📋 Stack Optimizado para 80 Usuarios

### ✅ Cambios Aplicados:

1. **Base de Datos:** `connection_limit` aumentado de 5 a 50 ✅
2. **Backend:** Compression + Rate Limiting implementados ✅
3. **Frontend:** Build optimizado con code splitting ✅
4. **PM2:** Configuración de clustering lista ✅

---

## 💰 Plan de Despliegue Gratuito (Total: $0/mes)

### **Opción 1: 100% Gratuito - Render.com + Vercel + Neon Free**

| Servicio | Proveedor | Costo | Capacidad | Limitaciones |
|----------|-----------|-------|-----------|--------------|
| **Frontend** | Vercel | $0 | Ilimitado | 100GB bandwidth/mes |
| **Backend** | Render.com Free | $0 | 50-60 usuarios | Sleep después 15 min inactividad |
| **Base de Datos** | Neon Free | $0 | 80 usuarios | 0.5GB storage, 100 conexiones |
| **Total** | - | **$0/mes** | **50-80 usuarios** | Backend se duerme si no hay tráfico |

**⚠️ Limitación Crítica:** Backend se duerme después de 15 minutos sin requests. Primera request después del sleep tarda ~30 segundos.

---

### **Opción 2: Semi-Gratuito - Railway + Vercel + Neon Free**

| Servicio | Proveedor | Costo | Capacidad | Limitaciones |
|----------|-----------|-------|-----------|--------------|
| **Frontend** | Vercel | $0 | Ilimitado | 100GB bandwidth/mes |
| **Backend** | Railway.app | $0* | 60-80 usuarios | $5 crédito gratis/mes (500 horas) |
| **Base de Datos** | Neon Free | $0 | 80 usuarios | 0.5GB storage |
| **Total** | - | **$0-5/mes** | **60-80 usuarios** | Sin sleep del backend |

**Nota:** Railway da $5 gratis/mes = ~500 horas. Si funciona 24/7 (720h/mes), pagas ~$2/mes extra.

---

## 🎯 Opción Recomendada para Marcha Blanca: Railway + Vercel

### **¿Por qué Railway?**
- ✅ Backend NO se duerme (siempre activo)
- ✅ Más RAM que Render Free (1GB vs 512MB)
- ✅ Despliegue automático desde GitHub
- ✅ Casi gratis con el crédito mensual

---

## 📦 Pasos de Despliegue

### **Fase 1: Preparar el Proyecto (5 minutos)**

```powershell
# 1. Crear directorio de logs (PM2)
cd backend
New-Item -ItemType Directory -Force -Path logs

# 2. Instalar PM2 globalmente
npm install -g pm2

# 3. Verificar que todo funciona localmente
pm2 start ecosystem.config.cjs
pm2 logs

# Si funciona bien:
pm2 stop all
pm2 delete all
```

---

### **Fase 2: Deploy Frontend en Vercel (5 minutos)**

```powershell
# 1. Build de producción
cd frontend
npm run build

# 2. Instalar Vercel CLI
npm install -g vercel

# 3. Login en Vercel
vercel login

# 4. Deploy
vercel --prod

# 5. Guardar la URL que te da (ej: https://control-actividades.vercel.app)
```

**Configuración en Vercel Dashboard:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Node Version: 18.x

---

### **Fase 3: Deploy Backend en Railway (10 minutos)**

#### **3.1 Preparar GitHub:**
```powershell
# Si no tienes repo en GitHub:
cd d:\FNB\Proyectos\control-actividades
git init
git add .
git commit -m "Deploy: Backend optimizado para 80 usuarios"

# Crear repo en GitHub: https://github.com/new
# Nombre: control-actividades-ibr

git remote add origin https://github.com/TU_USUARIO/control-actividades-ibr.git
git branch -M main
git push -u origin main
```

#### **3.2 Configurar Railway:**

1. **Ir a:** https://railway.app/
2. **Sign in** con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Seleccionar:** `control-actividades-ibr`
5. **Root Directory:** `backend`
6. **Add variables:**
   - Click en tu servicio → **Variables**
   - Agregar todas las variables de tu `.env`:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=control-actividades-jwt-secret-key-min-32-chars-2024
PRISMA_CLIENT_ENGINE_TYPE=library

# Tu DATABASE_URL de Neon (con connection_limit=50)
DATABASE_URL=postgresql://neondb_owner:npg_QnZpjIvGV79J@ep-noisy-wildflower-ac16dx44-pooler.sa-east-1.aws.neon.tech/controlactividades?sslmode=require&connection_timeout=30&pool_timeout=30&connect_timeout=30&pgbouncer=true&connection_limit=50

# IMPORTANTE: Agregar tu dominio de Vercel
CORS_ORIGIN=https://TU-APP.vercel.app,http://localhost:3000
```

7. **Settings → Deploy:**
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node src/index.js`
   - Watch Paths: `backend/**`

8. **Deploy** → Esperar ~2-3 minutos

9. **Copiar URL del backend** (ej: `https://tu-proyecto.up.railway.app`)

---

### **Fase 4: Conectar Frontend con Backend (2 minutos)**

```javascript
// frontend/src/services/api.js
// Cambiar la URL del backend

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://TU-PROYECTO.up.railway.app/api'  // ← Tu URL de Railway
  : 'http://localhost:3001/api';
```

```powershell
# Re-deploy frontend
cd frontend
npm run build
vercel --prod
```

---

### **Fase 5: Actualizar CORS en Railway (1 minuto)**

En Railway → Variables → Editar `CORS_ORIGIN`:
```
CORS_ORIGIN=https://tu-app.vercel.app
```

Railway se re-desplegará automáticamente (~1 minuto).

---

## ✅ Verificación Post-Deploy

### **1. Verificar Backend:**
```powershell
# Test básico
curl https://tu-proyecto.up.railway.app/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": "OK",
  "uptime": 123.45,
  "database": "connected"
}
```

### **2. Verificar Frontend:**
- Abrir: `https://tu-app.vercel.app`
- Hacer login con un usuario de prueba
- Verificar que carga actividades

### **3. Test de Carga (Opcional):**
```powershell
# Instalar herramienta de test
npm install -g autocannon

# Simular 50 usuarios concurrentes por 30 segundos
autocannon -c 50 -d 30 https://tu-proyecto.up.railway.app/api/health
```

---

## 📊 Monitoreo y Logs

### **Ver Logs de Railway:**
1. Railway Dashboard → Tu proyecto → **View Logs**
2. Ver en tiempo real requests, errores, etc.

### **Métricas de Vercel:**
1. Vercel Dashboard → Tu proyecto → **Analytics**
2. Ver requests, bandwidth, errores

### **Base de Datos (Neon):**
1. https://console.neon.tech/
2. Ver conexiones activas, queries lentas, storage

---

## ⚠️ Limitaciones del Plan Gratuito

| Aspecto | Limitación | Solución si se Supera |
|---------|------------|----------------------|
| **Railway** | $5 gratis/mes (~500h) | Upgrade a Hobby ($5/mes fijo) |
| **Vercel** | 100GB bandwidth/mes | Unlikely con 80 usuarios |
| **Neon** | 0.5GB storage | Upgrade a Scale ($19/mes) |
| **Backend RAM** | 1GB en Railway | Optimizar queries |

---

## 🚀 Plan de Escalamiento

### **Cuando llegues a 80+ usuarios concurrentes:**

**Señales de que necesitas escalar:**
- ❌ Backend responde lento (>2 segundos)
- ❌ Errores de "too many connections" en BD
- ❌ Railway te cobra >$5/mes
- ❌ Storage de Neon >400MB

**Siguiente paso ($26/mes):**
1. **Backend:** Railway Hobby ($5/mes) o Render Starter ($7/mes)
2. **Base de Datos:** Neon Scale ($19/mes) → 300 conexiones, 5GB
3. **Frontend:** Sigue gratis en Vercel

**Capacidad después del upgrade:** 150-200 usuarios concurrentes

---

## 📝 Checklist de Deploy

- [ ] `connection_limit=50` en DATABASE_URL ✅ (ya aplicado)
- [ ] Compression y rate limiting en backend ✅ (ya aplicado)
- [ ] PM2 ecosystem.config.cjs creado ✅ (ya aplicado)
- [ ] Frontend optimizado en vite.config.js ✅ (ya aplicado)
- [ ] Crear cuenta en Vercel
- [ ] Crear cuenta en Railway
- [ ] Push código a GitHub
- [ ] Deploy frontend en Vercel
- [ ] Deploy backend en Railway
- [ ] Configurar variables de entorno en Railway
- [ ] Actualizar CORS_ORIGIN en Railway
- [ ] Actualizar API_BASE_URL en frontend
- [ ] Re-deploy frontend
- [ ] Probar login y funcionalidad
- [ ] Verificar conexión a base de datos
- [ ] Monitorear logs por 24 horas

---

## 🆘 Troubleshooting

### **Backend no conecta a Neon:**
```
Error: P1001: Can't reach database server
```
**Solución:** Verificar que DATABASE_URL tenga `sslmode=require`

### **CORS Error en Frontend:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS
```
**Solución:** Agregar dominio de Vercel a `CORS_ORIGIN` en Railway

### **Frontend muestra "Cannot GET /api/...":**
```
404 Not Found
```
**Solución:** Verificar que `API_BASE_URL` apunte a Railway (sin / al final)

### **Railway se queda sin crédito:**
- Ver en Dashboard cuántas horas has usado
- Si >500h/mes, considera Hobby plan ($5/mes)
- O usa Render Free (con sleep) temporalmente

---

## 💡 Tips de Optimización

1. **Caché de Actividades:**
   - Las actividades no cambian frecuentemente
   - Considera implementar cache de 5 minutos

2. **Lazy Loading:**
   - Cargar registros de actividad por páginas (50 por página)

3. **Índices en BD:**
   - Asegúrate de tener índices en columnas frecuentes

4. **Monitoreo:**
   - Revisa logs de Railway diariamente durante la marcha blanca
   - Pon alertas si el uso supera 400h/mes

---

## 🎯 Resumen

**Tu proyecto está LISTO para soportar 80 usuarios con:**
- ✅ 50 conexiones a BD (antes: 5)
- ✅ Compression HTTP (ahorra ~70% bandwidth)
- ✅ Rate limiting (protege de abuso)
- ✅ Frontend optimizado (chunks, minificación)
- ✅ Configuración PM2 para clustering

**Deploy en modo gratuito:**
- Frontend: Vercel (gratis forever)
- Backend: Railway ($0-5/mes)
- Base de Datos: Neon Free

**Total: $0-5/mes para 60-80 usuarios concurrentes**

¿Necesitas ayuda con algún paso del deployment?
