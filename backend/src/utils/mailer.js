import nodemailer from 'nodemailer';

// Configurar el transportador de correo
const createTransporter = () => {
  // En desarrollo, usar Ethereal (correo de prueba)
  // En producción, usar SMTP real (Gmail, SendGrid, etc.)
  
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // En desarrollo, usar configuración de prueba o Ethereal
    // Para usar Gmail en desarrollo, necesitas habilitar "Aplicaciones menos seguras"
    // o crear una "Contraseña de aplicación"
    
    // Si tienes credenciales SMTP de desarrollo, úsalas aquí
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    
    // Por defecto, retornar null (se manejará en la función de envío)
    return null;
  }
};

/**
 * Envía un correo electrónico con la contraseña temporal
 * @param {Object} params - Parámetros del correo
 * @param {string} params.to - Dirección de correo del destinatario
 * @param {string} params.username - Nombre de usuario
 * @param {string} params.fullName - Nombre completo del usuario
 * @param {string} params.tempPassword - Contraseña temporal generada
 * @returns {Promise<Object>} Resultado del envío
 */
async function sendPasswordResetEmail({ to, username, fullName, tempPassword }) {
  const transporter = createTransporter();
  
  // Si no hay transportador configurado, solo registrar en consola (SIN mostrar la contraseña)
  if (!transporter) {
    console.log('\n📧 ============================================');
    console.log('📧 CORREO NO ENVIADO (Configuración pendiente)');
    console.log('📧 ============================================');
    console.log(`📧 Para: ${to}`);
    console.log(`📧 Usuario: ${username}`);
    console.log(`📧 Nombre: ${fullName}`);
    console.log(`📧 Contraseña Temporal: ******** (oculta por seguridad)`);
    console.log('📧 ============================================\n');
    
    return {
      success: true,
      message: 'Email logging only (no transporter configured)',
      preview: null
    };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Control de Actividades" <noreply@control-actividades.com>',
    to: to,
    subject: 'Restablecimiento de Contraseña - Control de Actividades',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .password-box { background-color: #fff; border: 2px solid #1e40af; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px; }
          .info-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Control de Actividades</h1>
          </div>
          <div class="content">
            <h2>Hola, ${fullName}</h2>
            <p>Has solicitado restablecer tu contraseña para tu cuenta <strong>${username}</strong>.</p>
            
            <p>Tu contraseña temporal es:</p>
            <div class="password-box">
              ${tempPassword}
            </div>
            
            <div class="info-box">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Esta es una contraseña temporal generada automáticamente</li>
                <li>Por seguridad, debes cambiarla inmediatamente después de iniciar sesión</li>
                <li>Usa el botón "Cambiar Contraseña" en tu panel para crear una nueva contraseña personalizada</li>
                <li>Esta contraseña expirará en 24 horas</li>
              </ul>
            </div>
            
            <p><strong>Requisitos para tu nueva contraseña:</strong></p>
            <ul>
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos una letra minúscula</li>
              <li>Al menos un número</li>
              <li>Al menos un carácter especial (!@#$%^&*)</li>
            </ul>
            
            <p>Si no solicitaste este cambio, por favor contacta al administrador inmediatamente.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2025 Control de Actividades - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola, ${fullName}

Has solicitado restablecer tu contraseña para tu cuenta ${username}.

Tu contraseña temporal es: ${tempPassword}

IMPORTANTE:
- Esta es una contraseña temporal generada automáticamente
- Por seguridad, debes cambiarla inmediatamente después de iniciar sesión
- Usa el botón "Cambiar Contraseña" en tu panel para crear una nueva contraseña personalizada
- Esta contraseña expirará en 24 horas

Requisitos para tu nueva contraseña:
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial (!@#$%^&*)

Si no solicitaste este cambio, por favor contacta al administrador inmediatamente.

---
Este es un correo automático, por favor no respondas a este mensaje.
© 2025 Control de Actividades - Todos los derechos reservados
    `.trim()
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado exitosamente:', info.messageId);
    
    // Si estamos usando Ethereal, obtener URL de vista previa
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('🔗 Vista previa del correo:', previewUrl);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      preview: previewUrl
    };
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}

export { sendPasswordResetEmail };
