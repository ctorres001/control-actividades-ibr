# 🔒 Auditoría de Seguridad - Control de Actividades

**Fecha**: 3 de Noviembre, 2025  
**Estado**: Análisis completado con correcciones aplicadas

---

## 🔴 VULNERABILIDADES CRÍTICAS (Corregidas)

### (Nuevo) Exposición de credenciales en archivo plano ✅ ELIMINADO
**Archivo**: `backend/postgresql-config.json` (eliminado)  
**Riesgo**: CRÍTICO  
**Impacto**: Contraseña de base de datos expuesta en repositorio.

**Acción aplicada (2025-11-21)**:
- ✅ Archivo eliminado del código fuente.
- ✅ Se recomienda ROTAR inmediatamente la contraseña expuesta.
- ✅ Centralizar credenciales únicamente vía variable `DATABASE_URL` en entorno.

**Recomendaciones adicionales**:
- Usar gestor de secretos (Railway / Vercel / Doppler / Vault).
- Agregar `.env.example` sin valores sensibles.
- Implementar escaneo automatizado para evitar commits con patrones de credenciales.

### 1. JWT_SECRET sin validación ✅ CORREGIDO
**Archivo**: `backend/src/utils/jwt.js`  
**Riesgo**: CRÍTICO  
**Impacto**: Si JWT_SECRET es débil o no existe, toda la autenticación es vulnerable

**Problema**:
```javascript
const JWT_SECRET = process.env.JWT_SECRET; // Sin validación
```

**Solución aplicada**:
- ✅ Validación de existencia de JWT_SECRET
- ✅ Validación de longitud mínima (32 caracteres)
- ✅ El servidor se detiene si la configuración es insegura

**Recomendaciones adicionales**:
- Usar un secreto de al menos 64 caracteres aleatorios
- Rotar el secreto periódicamente en producción
- Considerar usar claves asimétricas (RS256) para mayor seguridad

---

### 2. Exposición de contraseñas en logs ✅ CORREGIDO
**Archivo**: `backend/src/utils/mailer.js`  
**Riesgo**: CRÍTICO  
**Impacto**: Contraseñas temporales visibles en logs del servidor

**Problema**:
```javascript
console.log(`📧 Contraseña Temporal: ${tempPassword}`); // ❌ Expuesto en logs
```

**Solución aplicada**:
- ✅ Contraseña oculta en logs de desarrollo
- ✅ Uso de `********` en lugar de la contraseña real

**Recomendaciones adicionales**:
- Implementar sistema de tokens de reset en lugar de contraseñas temporales
- Usar enlaces de un solo uso con expiración corta (15-30 min)

---

### 3. Información sensible en respuestas de error ✅ CORREGIDO
**Archivo**: `backend/src/middleware/auth.js`  
**Riesgo**: MEDIO  
**Impacto**: Exposición de estructura de roles a atacantes

**Problema**:
```javascript
return res.status(403).json({
  error: 'No tienes permisos',
  requiredRoles: allowedRoles,  // ❌ Expone roles requeridos
  userRole: req.user.rol        // ❌ Expone rol del usuario
});
```

**Solución aplicada**:
- ✅ Removida información de roles en respuestas 403
- ✅ Mensaje genérico sin detalles internos

---

### 4. Validación de entrada faltante ✅ CORREGIDO
**Archivo**: `backend/src/controllers/export.controller.js`  
**Riesgo**: MEDIO (SQL Injection potencial)  
**Impacto**: Posible manipulación de queries

**Problema**:
```javascript
if (usuarioId) where.usuarioId = parseInt(usuarioId); // Sin validar si es número válido
```

**Solución aplicada**:
- ✅ Validación de tipos de datos (usuarioId, campañaId)
- ✅ Validación de formato de fechas
- ✅ Validación de valores positivos
- ✅ Respuestas 400 con mensajes claros

---

## 🟡 VULNERABILIDADES MEDIAS (Requieren atención)

### 5. Rate Limiting configuración débil
**Archivo**: `backend/src/index.js`  
**Riesgo**: MEDIO  
**Impacto**: Vulnerable a ataques de fuerza bruta

**Configuración actual**:
```javascript
const LOGIN_RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10);
const LOGIN_RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || `${15 * 60 * 1000}`, 10);
```

**Recomendaciones**:
- ✅ **YA IMPLEMENTADO**: 5 intentos por 15 minutos es adecuado
- ⚠️ Considerar implementar bloqueo progresivo (exponential backoff)
- ⚠️ Implementar CAPTCHA después de 3 intentos fallidos
- ⚠️ Alertas por correo al administrador tras múltiples intentos fallidos

---

### 6. Sin protección CSRF
**Riesgo**: MEDIO  
**Impacto**: Posibles ataques Cross-Site Request Forgery

**Recomendaciones**:
```bash
npm install csurf cookie-parser
```

```javascript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
```

---

### 7. Sin sanitización de HTML en frontend
**Archivos**: Componentes React que renderizan `observaciones`  
**Riesgo**: BAJO-MEDIO  
**Impacto**: XSS si se permite HTML en observaciones

**Recomendaciones**:
```bash
npm install dompurify
```

```javascript
import DOMPurify from 'dompurify';

// Al renderizar observaciones
<div>{DOMPurify.sanitize(observaciones)}</div>
```

---

## 🟢 BUENAS PRÁCTICAS IMPLEMENTADAS

✅ **Helmet configurado**: Headers de seguridad HTTP  
✅ **CORS configurado**: Orígenes permitidos específicos  
✅ **Bcrypt para contraseñas**: 10 rounds de hashing  
✅ **JWT con expiración**: Tokens expiran en 8 horas  
✅ **Middleware de autenticación**: Verifica token en cada request  
✅ **Validación de usuario activo**: No permite login de usuarios inactivos  
✅ **Compression activado**: Reduce ancho de banda  
✅ **Rate limiting general**: 100 req/min por IP  
✅ **Rate limiting login**: 5 intentos/15 min  

---

## 🔵 DEPENDENCIAS - AUDITORÍA

### Backend
```bash
npm audit
```

**Paquetes críticos**:
- ✅ `bcrypt@6.0.0` - Actualizado
- ✅ `jsonwebtoken@9.0.2` - Actualizado
- ✅ `express@5.1.0` - Versión estable
- ✅ `helmet@8.1.0` - Actualizado
- ✅ `@prisma/client@6.18.0` - Actualizado

### Frontend
```bash
npm audit
```

**Paquetes críticos**:
- ✅ `react@18.2.0` - Versión estable
- ✅ `axios@1.13.0` - Versión reciente
- ✅ `xlsx@0.18.5` - Considerar actualizar

**Acción recomendada**:
```bash
cd backend && npm audit fix
cd frontend && npm audit fix
```

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### Prioridad ALTA (Implementar inmediatamente)

1. **Implementar logging seguro**
   - Usar Winston o Pino
   - Configurar rotación de logs
   - No loggear información sensible
   - Implementar log levels apropiados

2. **Implementar monitoreo de seguridad**
   - Alertas por intentos de login fallidos
   - Monitoreo de rate limit excedido
   - Detección de patrones de ataque

3. **Backup y recuperación**
   - Backups automáticos de BD
   - Plan de recuperación ante desastres
   - Pruebas regulares de restauración

4. **Variables de entorno**
   - Crear `.env.example` con todas las variables necesarias
   - Documentar cada variable requerida
   - Validar variables críticas al inicio

### Prioridad MEDIA (Implementar en 1-2 semanas)

1. **CAPTCHA en login**
   - Implementar reCAPTCHA v3
   - Activar después de 3 intentos fallidos

2. **Tokens de refresh**
   - Implementar refresh tokens
   - Access token: 15 min
   - Refresh token: 7 días

3. **Auditoría de actividad**
   - Log de acciones críticas
   - Registro de cambios en usuarios
   - Historial de exportaciones

4. **Content Security Policy**
   - Configurar CSP headers
   - Whitelist de dominios permitidos
   - Prevenir inline scripts

### Prioridad BAJA (Mejoras futuras)

1. **2FA (Two-Factor Authentication)**
   - TOTP (Google Authenticator)
   - Solo para administradores inicialmente

2. **Encriptación de datos sensibles**
   - Encriptar correos electrónicos en BD
   - Encriptar observaciones si contienen info sensible

3. **Penetration testing**
   - Contratar auditoría externa
   - Pruebas automatizadas de seguridad

---

## 🛡️ CHECKLIST DE DESPLIEGUE

Antes de cada deployment a producción, verificar:

- [ ] JWT_SECRET configurado (min 64 chars)
- [ ] DATABASE_URL no expuesta en código
- [ ] CORS_ORIGIN correctamente configurado
- [ ] Rate limiting activado
- [ ] NODE_ENV=production
- [ ] Logs de desarrollo desactivados
- [ ] npm audit sin vulnerabilidades críticas
- [ ] Backups configurados
- [ ] HTTPS activado (Railway/Vercel lo proveen)
- [ ] Variables de entorno sincronizadas

---

## 📋 VARIABLES DE ENTORNO CRÍTICAS

### Backend (Railway)
```env
# CRÍTICO - Seguridad
JWT_SECRET=<min 64 caracteres aleatorios>
JWT_EXPIRES_IN=8h

# CRÍTICO - Base de datos
DATABASE_URL=postgresql://...

# Importante - CORS
CORS_ORIGIN=https://control-actividades-ibr.vercel.app

# Importante - Rate Limiting
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW_MS=60000

# Opcional - Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Producción
NODE_ENV=production
```

### Frontend (Vercel)
```env
# CRÍTICO - Backend URL
VITE_API_URL=https://backend-production-73dc.up.railway.app/api
```

---

## 📞 CONTACTO EN CASO DE INCIDENTE

En caso de detectar una vulnerabilidad:

1. **NO publicar detalles públicamente**
2. Contactar al equipo de desarrollo
3. Documentar el incidente
4. Aplicar parche urgente
5. Notificar a usuarios si aplica (GDPR/LGPD)

---

## 📚 RECURSOS ADICIONALES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Última actualización**: 2025-11-21  
**Responsable**: Equipo de Desarrollo  
**Próxima revisión**: 2025-12-03
