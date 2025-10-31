# Flujo de "Olvidaste tu Contraseña" - Guía de Prueba

## 🔄 Flujo Completo Implementado

### 1. **Usuario olvida su contraseña**
   - En el login, hacer clic en "¿Olvidaste tu contraseña?"
   - Aparece un modal de confirmación preguntando si desea restablecer
   - Opciones:
     - **"No, volver"**: regresa al login normal
     - **"Sí, restablecer"**: procede con el reset

### 2. **Solicitar nueva contraseña**
   - Ingresar el correo electrónico registrado
   - Click en "Enviar Enlace de Reset"
   - El sistema:
     - Genera una contraseña temporal segura (12 caracteres)
     - Actualiza la contraseña en la base de datos
     - En desarrollo, muestra la contraseña en un toast y en console

### 3. **Iniciar sesión con contraseña temporal**
   - Usar el usuario y la contraseña temporal para hacer login
   - Nota: La contraseña tiene ícono de ojo para mostrar/ocultar

### 4. **Personalizar contraseña**
   - Una vez dentro del dashboard, click en botón "Cambiar Contraseña" (🔒)
   - Ingresar:
     - Contraseña actual (la temporal)
     - Nueva contraseña
     - Confirmar nueva contraseña
   - El sistema muestra validación en tiempo real:
     - ✓ Al menos 8 caracteres
     - ✓ Una letra mayúscula
     - ✓ Una letra minúscula
     - ✓ Un número
     - ✓ Un carácter especial (!@#$%^&*)
     - ✓ Las contraseñas coinciden

### 5. **Completar cambio**
   - Click en "Guardar Contraseña"
   - La contraseña se actualiza
   - El usuario puede seguir usando el sistema con su nueva contraseña

## 🎨 Características Implementadas

### Frontend:
- ✅ Modal de confirmación antes de solicitar reset
- ✅ Toggle de mostrar/ocultar contraseña en todos los campos (ícono de ojo)
- ✅ Página dedicada para cambiar contraseña
- ✅ Validación visual en tiempo real (checks verdes/grises)
- ✅ Botón "Cambiar Contraseña" en el dashboard
- ✅ Mensajes claros con toast notifications

### Backend:
- ✅ Generación de contraseña temporal segura (12 chars con mix)
- ✅ Endpoint POST /api/password/forgot (genera y actualiza)
- ✅ Endpoint POST /api/password/change (requiere autenticación)
- ✅ Validación robusta de contraseñas (regex en backend)
- ✅ Hasheo seguro con bcrypt (10 rounds)
- ✅ Logs para desarrollo (muestra contraseña temporal)

## 📋 Para Probar Ahora:

### Opción 1: Usuario existente con correo
1. Ir a http://localhost:3000
2. Click "¿Olvidaste tu contraseña?"
3. Confirmar en el modal
4. Ingresar un correo registrado (ejemplo: el que agregaste a asesor1)
5. Ver en el toast la contraseña temporal generada
6. Hacer login con usuario + contraseña temporal
7. Click "Cambiar Contraseña" (🔒)
8. Personalizar tu contraseña

### Opción 2: Prueba rápida con script
Ejecutar en PowerShell:
```powershell
$body = @{ email = "tu-correo@example.com" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/password/forgot -Method Post -Body $body -ContentType 'application/json'
```

## 🔐 Reglas de Contraseña

La nueva contraseña personalizada debe cumplir:
- Mínimo 8 caracteres
- Al menos una mayúscula (A-Z)
- Al menos una minúscula (a-z)
- Al menos un número (0-9)
- Al menos un carácter especial (!@#$%^&*)

Ejemplos válidos:
- `Password1!`
- `MiClave2024@`
- `Secure#Pass99`

## ⚠️ Nota sobre Email

Actualmente el sistema:
- ✅ Genera la contraseña temporal
- ✅ La actualiza en la base de datos
- ⚠️ NO envía email (pendiente integración de servicio)
- 📝 En desarrollo muestra la contraseña en console y toast

Para producción, deberás:
1. Configurar servicio de email (Nodemailer, SendGrid, etc.)
2. Actualizar `forgotPassword` en `password.controller.js`
3. Reemplazar los `console.log` con `await sendEmail(...)`

## 🎯 Estado de Implementación

- [✓] Modal de confirmación
- [✓] Generación de contraseña temporal
- [✓] Actualización en base de datos
- [✓] Toggle mostrar/ocultar contraseña
- [✓] Página de cambio de contraseña
- [✓] Validación de contraseña
- [✓] Botón en dashboard
- [✓] Endpoints del backend
- [ ] Integración con servicio de email (pendiente)
