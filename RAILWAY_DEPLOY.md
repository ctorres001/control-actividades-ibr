# Guía de Deploy en Railway

## Ventajas de Railway para este proyecto

- ✅ **Plan gratuito inicial**: $5 de crédito mensual sin tarjeta
- ✅ **Escalado progresivo**: De 20 a 2000 usuarios en la misma plataforma
- ✅ **PostgreSQL incluido**: Plugin con backups automáticos
- ✅ **Deploy automático**: Push a GitHub → deploy automático
- ✅ **Sin vendor lock-in**: Puedes migrar cuando quieras

---

## Fase 0: Preparación (5 minutos)

### 1. Subir código a GitHub (si no lo has hecho)

```bash
# Asegúrate de tener .gitignore correcto
git add .
git commit -m "Preparado para Railway deploy"
git push origin main
```

### 2. Verificar que `.env` NO esté en el repo

```bash
# En .gitignore debe estar:
.env
.env.*
!.env.example
```

---

## Fase 1: Deploy inicial en Railway (15 minutos)

### Paso 1: Crear cuenta y proyecto

1. Ve a [railway.app](https://railway.app)
2. **Login with GitHub** (recomendado)
3. Click **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Autoriza Railway a acceder a tu repo
6. Selecciona `control-actividades-ibr`

### Paso 2: Configurar PostgreSQL

1. Railway detectará automáticamente tu proyecto
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway crea la BD y asigna variables automáticamente:
   - `DATABASE_URL` (ya disponible para el backend)
   - `PGHOST`, `PGPORT`, `PGUSER`, etc.

### Paso 3: Configurar el Backend

1. Click en el servicio **backend** (Railway lo detecta automáticamente)
2. Ve a **"Variables"** y agrega:

```env
# Railway ya provee DATABASE_URL automáticamente
# Solo agrega estas:

NODE_ENV=production
PORT=3001

# JWT (genera uno nuevo para producción)
JWT_SECRET=tu-secret-super-seguro-min-32-chars-railway-2024

# CORS (ajusta a tu dominio frontend)
CORS_ORIGIN=https://tu-frontend.railway.app,https://tu-dominio.com

# Rate Limiting (valores de producción)
RATE_LIMIT_GENERAL_MAX=600
RATE_LIMIT_GENERAL_WINDOW_MS=60000
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_ACTIVITY_MAX=60
RATE_LIMIT_ACTIVITY_WINDOW_MS=60000

# Cache (valores optimizados)
SUMMARY_LOG_CACHE_TTL_MS=3000
STATS_ACTIVE_CACHE_TTL_MS=2000

# Prisma
PRISMA_CLIENT_ENGINE_TYPE=library

# Email (opcional, configura después)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Control de Actividades <noreply@tu-dominio.com>
```

3. Click **"Deploy"**

### Paso 4: Verificar migraciones

Railway ejecuta automáticamente:
```bash
npx prisma migrate deploy
```

Si necesitas ejecutar el seed manualmente:
1. Ve a **backend** → **"Settings"** → **"Deploy Triggers"**
2. O conéctate via Railway CLI (ver abajo)

### Paso 5: Configurar el Frontend

1. Click en el servicio **frontend**
2. Ve a **"Settings"** → **"Environment"**
3. Agrega:

```env
VITE_API_URL=https://tu-backend.railway.app/api
```

4. Railway detecta automáticamente el build de Vite
5. Deploy automático

### Paso 6: Obtener las URLs públicas

1. Backend: Click en el servicio → **"Settings"** → **"Networking"** → **"Generate Domain"**
   - Te da algo como: `control-actividades-backend.up.railway.app`
2. Frontend: Mismo proceso
   - Te da algo como: `control-actividades.up.railway.app`
3. Actualiza `CORS_ORIGIN` en backend con la URL del frontend
4. Actualiza `VITE_API_URL` en frontend con la URL del backend
5. Redeploy ambos servicios

---

## Fase 2: Post-deploy (5 minutos)

### 1. Seed de la base de datos

**Opción A: Vía Railway CLI** (recomendado)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conectar al proyecto
railway link

# Ejecutar seed
railway run --service backend node prisma/seed.js

# Aplicar índices de performance
railway run --service backend node scripts/apply_indexes.js
```

**Opción B: Vía conexión directa**

```bash
# En Railway, copia DATABASE_URL del servicio PostgreSQL
# Pega en tu .env local temporalmente
# Ejecuta:
cd backend
npx prisma migrate deploy
node prisma/seed.js
node scripts/apply_indexes.js
# Borra DATABASE_URL de .env local
```

### 2. Verificar health

```bash
curl https://tu-backend.railway.app/api/health
# Debe responder: {"success":true,"status":"OK",...}
```

### 3. Probar login

Abre el frontend en el navegador:
```
https://tu-frontend.railway.app
```

Login con:
- Usuario: `admin`
- Password: `Admin123!@#`

---

## Fase 3: Monitoreo y ajustes

### 1. Ver logs en tiempo real

Railway Dashboard → Servicio → **"Deployments"** → Click en el deploy activo → **"View Logs"**

### 2. Métricas incluidas

- CPU usage
- Memory usage
- Request count
- Response time

### 3. Configurar alertas (opcional)

Railway → Proyecto → **"Settings"** → **"Notifications"** → Webhook/Email

---

## Escalado progresivo

### Fase 1: 20-50 usuarios (Trial → $10-15/mes)

**Sin cambios**, el plan gratuito + $5-10 extras cubre perfectamente.

### Fase 2: 80-100 usuarios ($25-35/mes)

1. Backend → **"Settings"** → **"Resources"**
2. Ajusta:
   - Memory: 1 GB (desde 512 MB)
   - Replicas: 2 (load balancing automático)
3. PostgreSQL se auto-escala

### Fase 3: 200-500 usuarios ($80-150/mes)

1. Backend:
   - Memory: 2 GB
   - Replicas: 3-5
2. PostgreSQL:
   - Upgrade a plan dedicado (Railway lo sugiere automáticamente)
   - Habilita read replicas

### Fase 4: 1000-2000 usuarios ($300-400/mes)

1. Backend:
   - Memory: 4 GB
   - Replicas: 8-10
   - Habilita autoscaling
2. PostgreSQL:
   - Plan Pro con HA
   - Múltiples read replicas
3. Considera agregar Redis para cache distribuido

---

## Comandos útiles Railway CLI

```bash
# Ver servicios
railway status

# Logs en tiempo real
railway logs --service backend

# Conectar a PostgreSQL
railway connect postgresql

# Ejecutar comando en el servicio
railway run --service backend npm run prisma:studio

# Variables de entorno
railway variables

# Rollback a deploy anterior
railway rollback <deployment-id>
```

---

## Troubleshooting común

### Error: "Migrations failed"

```bash
# Ejecuta manualmente:
railway run --service backend npx prisma migrate deploy
```

### Error: "Cannot connect to database"

1. Verifica que `DATABASE_URL` esté en variables del backend
2. Railway lo asigna automáticamente cuando agregas PostgreSQL
3. Si no está, click en PostgreSQL → **"Variables"** → Copia `DATABASE_URL` → Pega en backend

### Error: CORS en frontend

1. Verifica `CORS_ORIGIN` en backend incluya la URL del frontend
2. Formato correcto: `https://tu-frontend.railway.app` (sin barra final)
3. Redeploy backend después de cambiar

### Consumo de créditos más alto de lo esperado

1. Railway cobra por:
   - vCPU time
   - Memory GB-hours
   - Network egress
2. En trial: apaga servicios cuando no los uses
3. Optimiza: reduce replicas a 1 en desarrollo

---

## Backup y recuperación

### Backups automáticos (incluidos)

- Railway hace snapshots diarios de PostgreSQL
- Retención: 7 días en plan gratuito, 30 días en Pro

### Recuperar backup

1. PostgreSQL servicio → **"Data"** → **"Backups"**
2. Selecciona snapshot → **"Restore"**

### Backup manual

```bash
# Vía Railway CLI
railway run --service postgresql pg_dump > backup-$(date +%Y%m%d).sql
```

---

## Dominios personalizados (cuando estés listo)

### 1. Agregar dominio

1. Frontend servicio → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Agrega: `app.tu-dominio.com`
4. Railway te da registros DNS (CNAME)

### 2. Configurar DNS

En tu proveedor DNS (Cloudflare, GoDaddy, etc.):
```
CNAME  app  control-actividades.up.railway.app
```

### 3. SSL automático

Railway provisiona certificados Let's Encrypt automáticamente.

---

## Costos estimados reales

| Usuarios | Backend | PostgreSQL | Total/mes |
|----------|---------|-----------|-----------|
| 0-20 (dev/testing) | Trial $5 | Shared | **$0-5** |
| 20-50 (MVP) | 512 MB × 1 | Shared | **$8-12** |
| 80-100 | 1 GB × 2 | Shared | **$25-35** |
| 200-500 | 2 GB × 3-5 | Dedicated | **$80-150** |
| 1000-2000 | 4 GB × 8-10 | Pro HA | **$300-400** |

**Nota**: Precios actualizados a Nov 2024. Consulta [railway.app/pricing](https://railway.app/pricing) para detalles.

---

## Próximos pasos

1. ✅ Deploy inicial en Railway (sigue Fase 1)
2. ✅ Seed de datos de prueba (Fase 2)
3. ✅ Ejecutar pruebas k6 contra staging (ver abajo)
4. ⏳ Configurar dominio personalizado
5. ⏳ Setup de monitoreo (Sentry, UptimeRobot)
6. ⏳ Preparar docs para el equipo

---

## Pruebas de carga en Railway staging

Una vez desplegado, ejecuta k6 para validar:

```powershell
# Cambia BASE_URL a tu backend en Railway
D:\FNB\Proyectos\k6\k6.exe run tests\load\k6\ibr-load-test.js `
  --env BASE_URL=https://tu-backend.railway.app/api `
  --env K6_USERS=asesor1,asesor2,asesor3,asesor4,asesor5 `
  --env K6_SUPERVISOR=super1 `
  --env WRITE_RATE=0.1

# Objetivo: 
# - fail_rate < 1%
# - p(95) < 600-800ms (debería mejorar vs local+Neon)
```

---

## Soporte

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Status**: [status.railway.app](https://status.railway.app)

---

**Última actualización**: Noviembre 2025  
**Repo**: control-actividades-ibr  
**Stack**: Node.js + Express + Prisma + PostgreSQL + React + Vite
