# Credenciales de Acceso al Sistema

## 📋 Usuarios de Prueba

### 👤 Administrador
- **Usuario:** `admin`
- **Contraseña:** `Admin123!@#`
- **Permisos:** Acceso completo al sistema, gestión de usuarios, campañas, actividades y estadísticas

### 👥 Supervisores

#### Supervisor 1
- **Usuario:** `super1`
- **Contraseña:** `Super1@2024`
- **Campañas Asignadas:** PQRS, Ventas

#### Supervisor 2
- **Usuario:** `super2`
- **Contraseña:** `Super2@2024`
- **Campañas Asignadas:** BO_Calidda

### 📞 Asesores

#### Asesor 1 (Campaña PQRS)
- **Usuario:** `asesor1`
- **Contraseña:** `Asesor1@2024`
- **Campaña:** PQRS

#### Asesor 2 (Campaña PQRS)
- **Usuario:** `asesor2`
- **Contraseña:** `Asesor2@2024`
- **Campaña:** PQRS

#### Asesor 3 (Campaña Ventas)
- **Usuario:** `asesor3`
- **Contraseña:** `Asesor3@2024`
- **Campaña:** Ventas

#### Asesor 4 (Campaña Ventas)
- **Usuario:** `asesor4`
- **Contraseña:** `Asesor4@2024`
- **Campaña:** Ventas

#### Asesor 5 (Campaña BO_Calidda)
- **Usuario:** `asesor5`
- **Contraseña:** `Asesor5@2024`
- **Campaña:** BO_Calidda

## 🔄 Cómo Restablecer los Datos

Si necesitas restablecer todos los datos a su estado inicial, ejecuta:

```bash
cd backend
npx prisma migrate reset --force
```

Esto eliminará todos los datos y volverá a crear las tablas con los datos de prueba.

## ⚠️ Notas Importantes

1. **Primera vez:** Si es la primera vez que ejecutas el sistema, asegúrate de haber corrido las migraciones:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

2. **Backend debe estar corriendo:** El servidor backend debe estar activo en `http://localhost:3001`
   ```bash
   cd backend
   npm run dev
   ```

3. **Frontend debe estar corriendo:** El servidor frontend debe estar activo en `http://localhost:3000`
   ```bash
   cd frontend
   npm run dev
   ```

## 🐛 Solución de Problemas

### Error al iniciar sesión
- Verifica que el backend esté corriendo
- Verifica que las credenciales sean correctas (distingue mayúsculas/minúsculas)
- Revisa la consola del navegador para ver errores de red

### Error "Cannot read package.json"
- Asegúrate de estar en el directorio correcto (backend o frontend)
- Verifica que hayas instalado las dependencias con `npm install`

### Error de conexión a la base de datos
- Verifica que el archivo `.env` en la carpeta `backend` tenga la variable `DATABASE_URL` configurada
- Asegúrate de que la base de datos esté accesible

## 📝 Información Adicional

Para más detalles sobre cómo usar el sistema, consulta el README.md principal.
