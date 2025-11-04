# 🚀 GUÍA DE EJECUCIÓN - Agregar Actividades "Revisión" y "Gestión"

**Fecha:** 4 de noviembre de 2025  
**Archivos:** `Revisión` 🔍 y `Gestión` 📁

---

## ⚠️ IMPORTANTE

Las credenciales de la base de datos están configuradas en **variables de entorno del sistema** 
o en un archivo `.env.local` (no en el repositorio por seguridad).

---

## 📋 OPCIONES PARA EJECUTAR

### **OPCIÓN 1: SQL Directo en PostgreSQL** ⭐ (Más Rápido)

Si tienes acceso a un cliente PostgreSQL (pgAdmin, DBeaver, psql, etc.):

```sql
-- Copiar y ejecutar estas líneas:

INSERT INTO actividades (nombre_actividad, descripcion, orden, activo)
VALUES 
  ('Revisión', 'Revisión de casos o documentos', 7, true),
  ('Gestión', 'Tareas de gestión administrativa', 8, true)
ON CONFLICT (nombre_actividad) 
DO UPDATE SET 
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  activo = EXCLUDED.activo;

-- Verificar inserción:
SELECT id, nombre_actividad, descripcion, orden, activo 
FROM actividades 
WHERE nombre_actividad IN ('Revisión', 'Gestión')
ORDER BY orden;
```

**Resultado esperado:**
```
 id | nombre_actividad |          descripcion           | orden | activo 
----+------------------+-------------------------------+-------+--------
 XX | Revisión         | Revisión de casos o documentos|   7   |  true
 XX | Gestión          | Tareas de gestión administrativa|  8   |  true
```

---

### **OPCIÓN 2: Desde la Aplicación (API de Admin)** 🔐

Si el backend está corriendo y tienes credenciales de admin:

#### **Paso 1:** Login como admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nombreUsuario": "admin", "contraseña": "TU_CONTRASEÑA"}'
```

**Guardar el token que devuelve:** `"token": "eyJhbGc..."`

#### **Paso 2:** Crear actividad "Revisión"
```bash
curl -X POST http://localhost:3001/api/admin/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "nombreActividad": "Revisión",
    "descripcion": "Revisión de casos o documentos",
    "orden": 7,
    "activo": true
  }'
```

#### **Paso 3:** Crear actividad "Gestión"
```bash
curl -X POST http://localhost:3001/api/admin/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "nombreActividad": "Gestión",
    "descripcion": "Tareas de gestión administrativa",
    "orden": 8,
    "activo": true
  }'
```

---

### **OPCIÓN 3: Con Prisma Studio** 🎨 (Visual)

Si prefieres una interfaz visual:

```bash
cd d:\FNB\Proyectos\control-actividades\backend
npm run prisma:studio
```

Luego en el navegador:
1. Abrir `http://localhost:5555`
2. Ir a tabla `actividades`
3. Click en "Add record"
4. Llenar los campos:
   - **nombre_actividad:** `Revisión`
   - **descripcion:** `Revisión de casos o documentos`
   - **orden:** `7`
   - **activo:** `true`
5. Guardar
6. Repetir para "Gestión" (orden 8)

---

### **OPCIÓN 4: Con Script Node.js** 💻

Si tienes las credenciales correctas en `.env` o variables de entorno:

```bash
cd d:\FNB\Proyectos\control-actividades\backend

# Asegurarte que DATABASE_URL esté configurado
echo $env:DATABASE_URL

# Ejecutar script
node scripts/insertNewActivitiesPrisma.js
```

**Script disponible en:**
- `scripts/insertNewActivitiesPrisma.js` (usa Prisma)
- `scripts/addNewActivities.js` (usa Prisma upsert)

---

## ✅ VERIFICACIÓN

Después de ejecutar cualquiera de las opciones, verifica en el frontend:

1. **Iniciar sesión como asesor**
2. **Ver el panel de actividades**
3. **Buscar los nuevos botones:**
   - 🔍 **Revisión** (debería aparecer en "Botones de Jornada")
   - 📁 **Gestión** (debería aparecer en "Botones de Jornada")

**Layout esperado:**
```
┌─────────────────────────────────────────┐
│     Botones de Jornada                  │
├─────────────────────────────────────────┤
│  📞 Seguimiento   📧 Bandeja de Correo  │
│  📊 Reportes      🔧 Auxiliares         │
│  👥 Reunión       ⚠️ Incidencia          │
│  ⏸️ Pausa         📋 Caso Nuevo         │
│  🔍 Revisión      📁 Gestión            │ ← NUEVOS
└─────────────────────────────────────────┘
```

---

## 🔧 TROUBLESHOOTING

### **Error: "Database connection failed"**
- Verificar que `DATABASE_URL` esté configurado correctamente
- Verificar que la base de datos esté accesible

### **Error: "Ya existe una actividad con ese nombre"**
✅ **Normal** - Significa que ya están creadas. Verificar en el frontend.

### **Los botones no aparecen en el frontend**
1. Refrescar la página (Ctrl+F5)
2. Verificar en consola del navegador si hay errores
3. Verificar que backend devuelve las actividades:
   ```bash
   curl http://localhost:3001/api/activities/active \
     -H "Authorization: Bearer TU_TOKEN"
   ```

---

## 📝 RESUMEN

**¿Cuál opción elegir?**

| Situación | Opción Recomendada |
|-----------|-------------------|
| Tienes acceso a PostgreSQL | ✅ **Opción 1** (SQL directo) |
| Backend corriendo + token admin | ✅ **Opción 2** (API) |
| Prefieres interfaz visual | ✅ **Opción 3** (Prisma Studio) |
| Tienes credenciales en .env | ✅ **Opción 4** (Script Node) |

---

## 🎯 PRÓXIMO PASO

Una vez insertadas las actividades:
1. ✅ Reiniciar backend (si está corriendo)
2. ✅ Probar en el frontend como asesor
3. ✅ Registrar una actividad de "Revisión" o "Gestión"
4. ✅ Verificar que aparece en el historial

---

**¿Necesitas ayuda adicional?**
- Revisar logs del backend: `backend/logs/`
- Verificar configuración: `backend/.env`
- Documentación completa: `CORRECCIONES_IMPLEMENTADAS.md`
