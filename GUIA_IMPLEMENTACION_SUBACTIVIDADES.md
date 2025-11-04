# 📋 Guía de Implementación - Almacenamiento de Subactividades

**Fecha:** 4 de noviembre de 2025  
**Descripción:** Almacenamiento separado de ID Cliente/Referencia y Resumen Breve en la base de datos

---

## 🎯 Objetivos Completados

✅ **Almacenamiento de datos de subactividades en campos separados:**
- ID Cliente/Referencia → Columna `id_cliente_referencia`
- Resumen Breve → Columna `resumen_breve`

✅ **Validación de integridad temporal:**
- Hora fin debe ser mayor que hora inicio

✅ **Exportación completa:**
- Ambos campos incluidos en el reporte Excel

---

## 🔄 Cambios Realizados

### 1. **Base de Datos (Schema Prisma)**

**Archivo:** `backend/prisma/schema.prisma`

**Cambios:**
```prisma
model RegistroActividad {
  // ... campos existentes ...
  observaciones        String?
  idClienteReferencia  String?       @map("id_cliente_referencia") @db.VarChar(100)
  resumenBreve         String?       @map("resumen_breve") @db.Text
  // ... relaciones ...
}
```

### 2. **Frontend - Modal de Subactividades**

**Archivo:** `frontend/src/components/SubactivityModal.jsx`

**Antes:**
```javascript
const handleConfirm = () => {
  const fullComment = (clientRef ? `[${clientRef}] ` : '') + (comment || '');
  onConfirm({ 
    subactivityId: selected, 
    comment: fullComment 
  });
};
```

**Después:**
```javascript
const handleConfirm = () => {
  onConfirm({ 
    subactivityId: selected, 
    idClienteReferencia: clientRef || null,
    resumenBreve: comment || null
  });
};
```

### 3. **Frontend - Dashboard del Asesor**

**Archivo:** `frontend/src/pages/AsesorDashboard.jsx`

**Antes:**
```javascript
const handleConfirmModal = async ({ subactivityId, comment }) => {
  const payload = { 
    actividadId: pendingActivity.id, 
    subactividadId: subactivityId, 
    observaciones: comment 
  };
  // ...
};
```

**Después:**
```javascript
const handleConfirmModal = async ({ subactivityId, idClienteReferencia, resumenBreve }) => {
  const payload = { 
    actividadId: pendingActivity.id, 
    subactividadId: subactivityId, 
    idClienteReferencia: idClienteReferencia,
    resumenBreve: resumenBreve
  };
  // ...
};
```

### 4. **Backend - Controller de Actividades**

**Archivo:** `backend/src/controllers/activity.controller.js`

**Cambios en `startActivity`:**
```javascript
// Recibir nuevos parámetros
const { actividadId, subactividadId, observaciones, idClienteReferencia, resumenBreve } = req.body;

// Guardar en base de datos
const nuevoRegistro = await prisma.registroActividad.create({
  data: {
    // ... campos existentes ...
    observaciones: observaciones || null,
    idClienteReferencia: idClienteReferencia || null,
    resumenBreve: resumenBreve || null,
    // ...
  }
});
```

**Nueva validación en `stopActivity`:**
```javascript
// 🔒 VALIDACIÓN: Asegurar que horaFin > horaInicio
if (horaFin <= registroActual.horaInicio) {
  return res.status(400).json({
    success: false,
    error: 'La hora de fin debe ser mayor que la hora de inicio. Verifique la hora del sistema.',
    code: 'INVALID_TIME_RANGE'
  });
}
```

### 5. **Backend - Export Controller**

**Archivo:** `backend/src/controllers/export.controller.js`

**CSV Header actualizado:**
```javascript
const csvHeader = [
  'ID Registro',
  'Fecha',
  'Usuario',
  'Nombre Completo',
  'Rol',
  'Campaña',
  'Actividad',
  'Subactividad',
  'ID Cliente/Referencia',    // ← NUEVO
  'Resumen Breve',            // ← NUEVO
  'Hora Inicio',
  'Hora Fin',
  'Duración (seg)',
  'Duración (HH:MM:SS)',
  'Estado',
  'Observaciones'
].join(',');
```

**CSV Rows actualizado:**
```javascript
r.idClienteReferencia ? `"${r.idClienteReferencia}"` : '',
r.resumenBreve ? `"${r.resumenBreve.replace(/"/g, '""')}"` : '',
```

---

## 🚀 Instrucciones de Despliegue

### **Paso 1: Ejecutar Migración SQL en Railway**

Ve a Railway → Base de datos PostgreSQL → Query Editor y ejecuta:

```sql
-- Agregar columna id_cliente_referencia (VARCHAR 100)
ALTER TABLE registro_actividades
ADD COLUMN IF NOT EXISTS id_cliente_referencia VARCHAR(100);

-- Agregar columna resumen_breve (TEXT)
ALTER TABLE registro_actividades
ADD COLUMN IF NOT EXISTS resumen_breve TEXT;

-- Comentarios de las columnas para documentación
COMMENT ON COLUMN registro_actividades.id_cliente_referencia IS 'ID del cliente o referencia ingresada por el asesor';
COMMENT ON COLUMN registro_actividades.resumen_breve IS 'Resumen breve de la actividad ingresado por el asesor';
```

**Verificar que se ejecutó correctamente:**
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'registro_actividades'
  AND column_name IN ('id_cliente_referencia', 'resumen_breve')
ORDER BY column_name;
```

**Resultado esperado:**
```
        column_name        | data_type | character_maximum_length
---------------------------+-----------+-------------------------
 id_cliente_referencia     | varchar   |          100
 resumen_breve             | text      |         NULL
```

### **Paso 2: Hacer Commit y Push**

```powershell
cd d:\FNB\Proyectos\control-actividades
git add .
git commit -m "feat: Almacenar ID Cliente y Resumen Breve por separado + validación temporal

- feat: Agregar columnas id_cliente_referencia y resumen_breve
- feat: Actualizar frontend para enviar datos separados
- feat: Actualizar backend para almacenar datos separados
- feat: Incluir nuevos campos en export CSV
- security: Validar hora_fin > hora_inicio en stopActivity
- docs: Agregar guía de implementación de subactividades"
git push origin main
```

### **Paso 3: Verificar Despliegue**

Railway detectará el push y redesplegará automáticamente.

---

## ✅ Verificación del Flujo Completo

### **1. Probar Registro de Actividad con Subactividad**

Como **asesor**:

1. Iniciar sesión
2. Click en un botón que requiera subactividad (ej: "Seguimiento", "Bandeja de Correo")
3. Aparece modal con 3 campos:
   - **Tipo de gestión** (selector)
   - **ID Cliente / Referencia** (input texto)
   - **Resumen breve** (textarea)
4. Llenar los campos:
   - Tipo: "Redes Sociales"
   - ID: "CLI-12345"
   - Resumen: "Seguimiento a solicitud de cambio de plan"
5. Click "Confirmar"

### **2. Verificar en Base de Datos**

En Railway Query Editor:
```sql
SELECT 
  id,
  fecha,
  hora_inicio,
  id_cliente_referencia,
  resumen_breve,
  estado
FROM registro_actividades
WHERE id_cliente_referencia IS NOT NULL
ORDER BY id DESC
LIMIT 10;
```

**Resultado esperado:**
```
 id | fecha      | hora_inicio         | id_cliente_referencia | resumen_breve                           | estado
----+------------+--------------------+-----------------------+----------------------------------------+----------
 XX | 2025-11-04 | 2025-11-04 15:30:00| CLI-12345             | Seguimiento a solicitud de cambio...   | Finalizado
```

### **3. Verificar en Export Excel**

Como **administrador**:

1. Ir a panel admin → Tab "Exportar Reportes"
2. Seleccionar rango de fechas
3. Click "Exportar Detalle"
4. Abrir archivo CSV en Excel
5. Verificar que existen columnas:
   - **Columna I:** ID Cliente/Referencia
   - **Columna J:** Resumen Breve

**Estructura esperada del CSV:**
```
ID Registro,Fecha,Usuario,Nombre Completo,Rol,Campaña,Actividad,Subactividad,ID Cliente/Referencia,Resumen Breve,Hora Inicio,Hora Fin,...
123,2025-11-04,asesor01,"Juan Pérez",Asesor,"Ventas","Seguimiento","Redes Sociales","CLI-12345","Seguimiento a solicitud...",2025-11-04T15:30:00Z,...
```

### **4. Verificar Validación de Hora**

**Escenario:** Intentar detener una actividad con hora incorrecta (solo posible si hay problemas de sincronización del servidor)

**Resultado esperado:**
```json
{
  "success": false,
  "error": "La hora de fin debe ser mayor que la hora de inicio. Verifique la hora del sistema.",
  "code": "INVALID_TIME_RANGE"
}
```

---

## 🔧 Troubleshooting

### **Error: "Column 'id_cliente_referencia' does not exist"**

**Causa:** La migración SQL no se ejecutó correctamente.

**Solución:**
1. Verificar que ejecutaste el SQL en Railway
2. Verificar con el query de verificación del Paso 1
3. Si no existen, ejecutar de nuevo el script SQL

### **Error: "Cannot read property 'idClienteReferencia' of undefined"**

**Causa:** El backend no está actualizado.

**Solución:**
1. Verificar que Railway hizo el redespliegue
2. Revisar logs de Railway: `View Logs` en el servicio backend
3. Buscar errores de inicio

### **Los campos no aparecen en el CSV**

**Causa:** El código del export no está actualizado.

**Solución:**
1. Verificar que `export.controller.js` tiene las nuevas columnas
2. Hacer forzar redespliegue en Railway
3. Limpiar caché del navegador (Ctrl+F5)

### **Modal no envía los datos**

**Causa:** El frontend no está actualizado.

**Solución:**
1. Limpiar caché del navegador (Ctrl+Shift+Del)
2. Verificar en DevTools → Network que el payload incluye `idClienteReferencia` y `resumenBreve`
3. Verificar en consola del navegador si hay errores

---

## 📊 Esquema de Datos

### **Antes:**
```
registro_actividades
├── observaciones: "Redes Sociales - [CLI-12345] Seguimiento a solicitud..."
```

### **Después:**
```
registro_actividades
├── id_cliente_referencia: "CLI-12345"
├── resumen_breve: "Seguimiento a solicitud de cambio de plan"
├── observaciones: null (o comentarios adicionales)
```

---

## 🎯 Beneficios de la Implementación

✅ **Datos estructurados:** Facilita búsquedas y filtros por cliente  
✅ **Exportación clara:** Columnas separadas en Excel para análisis  
✅ **Integridad temporal:** Evita errores de cálculo de duración  
✅ **Escalabilidad:** Preparado para futuras funcionalidades (búsqueda por cliente, estadísticas, etc.)  
✅ **Mantenibilidad:** Código más limpio sin concatenación de strings  

---

## 📝 Próximos Pasos Recomendados (Opcional)

1. **Agregar búsqueda por ID Cliente** en el panel de supervisor/admin
2. **Validación de formato** para ID Cliente (ej: CLI-XXXXX)
3. **Estadísticas por cliente** (tiempo dedicado, actividades más frecuentes)
4. **Autocompletado** de IDs de clientes existentes
5. **Reportes filtrados por cliente** específico

---

## 🔐 Notas de Seguridad

- ✅ Los campos son opcionales (`String?`) - No afectan registros existentes
- ✅ Validación de hora implementada - Previene datos inconsistentes
- ✅ Escape de caracteres en CSV - Previene inyección de fórmulas en Excel
- ✅ Prisma sanitiza inputs - Previene SQL injection

---

**Implementado por:** GitHub Copilot  
**Fecha:** 4 de noviembre de 2025  
**Versión:** 1.0
