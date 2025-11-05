# Problema: DNI no aparece en usuarios

## 🔍 Diagnóstico

El campo `documentoIdentidad` (DNI) **no aparecía** en:
- ❌ Lista de usuarios (columna DOCUMENTO vacía)
- ❌ Formulario "Editar Usuario" (campo vacío)

### Causa raíz

**Los usuarios existentes nunca tuvieron el DNI guardado** porque:
1. El backend anterior (`createUser` y `updateUser`) **no extraía ni persistía** el campo `documentoIdentidad` del request body
2. Los usuarios creados antes del fix tienen `documentoIdentidad = NULL` en la base de datos

## ✅ Solución implementada

### 1. Backend corregido (commit `b36041f`)

**Archivo**: `backend/src/controllers/admin.controller.js`

#### `createUser`
```javascript
// ✅ AHORA extrae documentoIdentidad del body
const { nombreUsuario, nombreCompleto, correoElectronico, documentoIdentidad, contraseña, rolId, campañaId, estado } = req.body;

// ✅ AHORA normaliza y persiste el DNI
const docIdent = (documentoIdentidad && String(documentoIdentidad).trim() !== '')
  ? String(documentoIdentidad).trim()
  : null;

const nuevoUsuario = await prisma.usuario.create({
  data: {
    // ... otros campos
    documentoIdentidad: docIdent,  // ✅ Se guarda en DB
  }
});
```

#### `updateUser`
```javascript
// ✅ AHORA extrae documentoIdentidad del body
const { nombreUsuario, nombreCompleto, correoElectronico, documentoIdentidad, contraseña, rolId, campañaId, estado } = req.body;

const updateData = {
  // ... otros campos
  documentoIdentidad: (documentoIdentidad && String(documentoIdentidad).trim() !== '')
    ? String(documentoIdentidad).trim()
    : null,  // ✅ Se actualiza en DB
};
```

### 2. Frontend ya estaba OK

El frontend **ya estaba funcionando correctamente**:
- ✅ `UserManagement.jsx` carga `documentoIdentidad` en `handleOpenEdit`
- ✅ El formulario tiene el campo `<input documentoIdentidad>`
- ✅ Envía el campo al backend en `handleSaveUser`

**El problema era solo backend** (no persistía el valor).

---

## 🔧 Cómo actualizar usuarios existentes

### Opción 1: Actualizar desde la UI (recomendado)

1. **Reinicia el backend** para que tome el código corregido
2. En el panel admin, ve a **Gestión de Usuarios**
3. Click en **Editar** (✏️) del usuario
4. **Escribe el DNI** en el campo "Documento de Identidad"
5. Click en **Guardar**
6. ✅ Ahora el DNI aparecerá en la lista y en futuras ediciones

### Opción 2: Script individual (CLI)

Actualiza el DNI de **un usuario** a la vez:

```powershell
cd backend
node scripts/updateUserDNI.js <nombreUsuario> <DNI>
```

**Ejemplo**:
```powershell
node scripts/updateUserDNI.js ctorres 12345678
```

### Opción 3: Script masivo (CLI)

Actualiza **múltiples usuarios** de una vez:

1. Edita `backend/scripts/bulkUpdateDNI.js`
2. Configura el objeto `USUARIOS_DNI`:
   ```javascript
   const USUARIOS_DNI = {
     'ctorres': '12345678',
     'asesor1': '87654321',
     'asesor2': '11223344',
     // Agrega más...
   };
   ```
3. Ejecuta:
   ```powershell
   cd backend
   node scripts/bulkUpdateDNI.js
   ```

---

## 🧪 Verificación

### Verificar estructura en DB

```powershell
cd backend
node scripts/testUserDNI.js
```

Muestra la estructura completa de un usuario para confirmar que el campo `documentoIdentidad` existe.

### Listar usuarios con DNI

```powershell
cd backend
node scripts/listUsers.js
```

Ahora incluye una línea `DNI: XXXXXX` en cada usuario.

---

## 📋 Checklist de validación

Después de actualizar el backend:

- [ ] **Backend reiniciado** con el código corregido
- [ ] **Crear nuevo usuario** con DNI → verificar que aparece en lista
- [ ] **Editar usuario existente** → agregar DNI → guardar → verificar que persiste
- [ ] **Actualizar usuarios legacy** usando UI o scripts
- [ ] **Columna DOCUMENTO** en lista de usuarios muestra DNI
- [ ] **Formulario Editar** pre-rellena el DNI correctamente

---

## 📝 Notas técnicas

### Por qué falló antes

```javascript
// ❌ ANTES (admin.controller.js línea ~54)
const { nombreUsuario, nombreCompleto, correoElectronico, contraseña, rolId, campañaId, estado } = req.body;
//      ↑ documentoIdentidad NO se extraía del body

const nuevoUsuario = await prisma.usuario.create({
  data: {
    nombreUsuario,
    nombreCompleto,
    correoElectronico,
    // ❌ documentoIdentidad: NO SE INCLUÍA
    contraseña: hashedPassword,
    rolId,
    campañaId,
    estado
  }
});
```

### Por qué funciona ahora

```javascript
// ✅ AHORA (admin.controller.js línea ~54)
const { nombreUsuario, nombreCompleto, correoElectronico, documentoIdentidad, contraseña, rolId, campañaId, estado } = req.body;
//                                                        ↑ AHORA se extrae

const docIdent = (documentoIdentidad && String(documentoIdentidad).trim() !== '')
  ? String(documentoIdentidad).trim()
  : null;

const nuevoUsuario = await prisma.usuario.create({
  data: {
    nombreUsuario,
    nombreCompleto,
    correoElectronico,
    documentoIdentidad: docIdent,  // ✅ AHORA se incluye
    contraseña: hashedPassword,
    rolId,
    campañaId,
    estado
  }
});
```

---

## 🎯 Resultado final

✅ **Nuevos usuarios**: DNI se guarda automáticamente  
✅ **Usuarios existentes**: Se pueden actualizar vía UI o scripts  
✅ **Lista de usuarios**: Columna DOCUMENTO muestra el DNI  
✅ **Editar usuario**: Campo pre-llenado con DNI guardado  

---

**Fecha**: 5 de noviembre, 2025  
**Commits relacionados**:
- `b36041f` - Backend: Persist DNI in user create/update
- `f11bc12` - Scripts: Add DNI management utilities
