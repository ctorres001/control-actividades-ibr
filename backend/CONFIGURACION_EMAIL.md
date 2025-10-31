# Configuración del Servicio de Email

## Estado Actual
✅ **Funcionalidad implementada**: El sistema de "Olvidó su contraseña" está completamente funcional.
⚠️ **Pendiente**: Configurar credenciales SMTP para envío real de correos.

Actualmente, cuando un usuario solicita restablecer su contraseña, la contraseña temporal se genera y se guarda en la base de datos, pero **solo se muestra en la consola del servidor** porque no hay credenciales SMTP configuradas.

## ¿Qué necesitas?

Para que los correos se envíen realmente a los usuarios, necesitas configurar un servicio SMTP. Las opciones más comunes son:

### Opción 1: Gmail (Recomendado para desarrollo)

**Pasos:**
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la "Verificación en 2 pasos" (si no la tienes activada)
3. Ve a "Contraseñas de aplicaciones": https://myaccount.google.com/apppasswords
4. Genera una contraseña para "Correo" en "Windows"
5. Copia la contraseña generada (16 caracteres sin espacios)

**Configuración en `.env`:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"  # La contraseña de aplicación (sin espacios)
SMTP_FROM="Control de Actividades <tu-email@gmail.com>"
```

### Opción 2: Outlook / Hotmail

**Configuración en `.env`:**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="tu-email@hotmail.com"
SMTP_PASS="tu-contraseña"
SMTP_FROM="Control de Actividades <tu-email@hotmail.com>"
```

### Opción 3: SendGrid (Recomendado para producción)

**Pasos:**
1. Crea una cuenta en https://sendgrid.com/ (gratis hasta 100 emails/día)
2. Genera una API Key en Settings > API Keys
3. Usa la configuración siguiente

**Configuración en `.env`:**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"  # Literal "apikey"
SMTP_PASS="SG.tu-api-key-aqui"
SMTP_FROM="Control de Actividades <noreply@tudominio.com>"
```

### Opción 4: Servicio SMTP de tu empresa

Si tu empresa tiene un servidor SMTP, pide a TI los siguientes datos:
- Host SMTP
- Puerto (usualmente 587 o 465)
- Usuario
- Contraseña
- Email remitente autorizado

## Pasos para Configurar

1. **Edita el archivo `.env`** en el directorio `backend/`:
   ```bash
   # Abre con tu editor favorito
   notepad backend/.env
   ```

2. **Completa las variables SMTP** según el servicio que elijas (ver opciones arriba)

3. **Reinicia el servidor backend**:
   - Detén el proceso actual (Ctrl+C en la terminal)
   - Vuelve a ejecutar: `node src/index.js`

4. **Prueba el envío**:
   - Ve a la página de login
   - Haz clic en "¿Olvidaste tu contraseña?"
   - Ingresa un usuario y correo válidos
   - Revisa tu bandeja de entrada

## Verificación

### Si está funcionando:
- ✅ Verás en la consola: `✅ Correo enviado exitosamente`
- ✅ Recibirás un email con la contraseña temporal
- ✅ El email tendrá formato HTML profesional

### Si no está configurado:
- ⚠️ Verás en la consola: `📧 CORREO NO ENVIADO (Configuración pendiente)`
- ⚠️ La contraseña aparecerá en la consola del servidor
- ⚠️ El usuario NO recibirá el email

### Si hay error:
- ❌ Verás en la consola: `❌ Error al enviar email: [detalle del error]`
- ❌ Verifica las credenciales en `.env`
- ❌ Asegúrate de que el puerto no esté bloqueado por firewall

## Contenido del Email

El email que se envía contiene:
- ✅ Saludo personalizado con el nombre completo del usuario
- ✅ Nombre de usuario para login
- ✅ Contraseña temporal en formato destacado
- ✅ Instrucciones de seguridad
- ✅ Requisitos para la nueva contraseña personalizada
- ✅ Formato HTML profesional con estilos
- ✅ Versión texto plano (fallback)

## Seguridad

### ✅ Implementado:
- La contraseña temporal tiene 12 caracteres con mayúsculas, minúsculas, números y especiales
- Se guarda hasheada con bcrypt (10 rounds)
- NO se envía en la respuesta HTTP (solo por email)
- El mensaje de éxito es genérico para prevenir enumeración de usuarios

### 🔒 Recomendaciones adicionales:
- [ ] Agregar rate limiting al endpoint `/api/password/forgot` (máx. 3 intentos por hora)
- [ ] Implementar expiración automática de contraseñas temporales (24 horas)
- [ ] Guardar log de solicitudes de reset para auditoría
- [ ] En producción, usar SMTP con TLS/SSL

## Troubleshooting

### "Error: Invalid login"
- Verifica que el usuario y contraseña SMTP sean correctos
- Para Gmail, asegúrate de usar una "Contraseña de aplicación"

### "Error: Connection timeout"
- Verifica que el puerto no esté bloqueado por firewall
- Prueba con puerto 465 (SSL) en lugar de 587 (TLS)

### "Error: self signed certificate"
- Agrega en el código (solo desarrollo): `rejectUnauthorized: false`

### Los emails llegan a SPAM
- Configura SPF, DKIM y DMARC en tu dominio
- Usa un dominio verificado con el proveedor SMTP
- Para producción, usa un servicio dedicado como SendGrid

## Próximos Pasos

Después de configurar el email:
1. Prueba con cada rol de usuario (asesor, supervisor, admin)
2. Verifica que los usuarios puedan cambiar su contraseña temporal
3. Configura el dominio del email remitente para producción
4. Considera implementar rate limiting para seguridad
