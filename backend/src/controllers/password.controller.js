// =====================================================
// src/controllers/password.controller.js
// Controlador para reset de contraseña
// =====================================================

import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/mailer.js';

// Función helper para generar contraseña temporal segura
function generateTempPassword() {
  const length = 12;
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%';
  
  // Asegurar al menos uno de cada tipo
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Completar con caracteres aleatorios
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// =====================================================
// FORGOT PASSWORD - Solicitar reset de contraseña
// =====================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'El correo electrónico es requerido'
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario es requerido'
      });
    }

    // Buscar usuario específico por email Y username
    const usuario = await prisma.usuario.findFirst({
      where: {
        correoElectronico: email,
        nombreUsuario: username
      }
    });

    // Por seguridad, siempre responder con éxito aunque no exista
    if (!usuario) {
      console.log(`⚠️ Intento de reset para email: ${email}, usuario: ${username} - no encontrado`);
      return res.json({
        success: true,
        message: 'Si el correo y usuario son correctos, recibirás tu nueva contraseña temporal'
      });
    }

    // Generar contraseña temporal
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Actualizar contraseña del usuario
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { contraseña: hashedPassword }
    });

    // Enviar email con la contraseña temporal
    try {
      await sendPasswordResetEmail({
        to: email,
        username: usuario.nombreUsuario,
        fullName: usuario.nombreCompleto,
        tempPassword: tempPassword
      });
      console.log(`✅ Email enviado exitosamente a ${email}`);
    } catch (emailError) {
      // Log del error pero no fallar el proceso
      // (por seguridad, no revelar si el envío falló)
      console.error('❌ Error al enviar email:', emailError);
    }

    res.json({
      success: true,
      message: 'Si el correo y usuario son correctos, recibirás tu nueva contraseña temporal'
    });

  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud de reset'
    });
  }
};

// =====================================================
// RESET PASSWORD - Restablecer contraseña con token
// =====================================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token y nueva contraseña son requeridos'
      });
    }

    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        usado: false,
        expiraEn: {
          gte: new Date() // Token no expirado
        }
      },
      include: {
        usuario: true
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await prisma.usuario.update({
      where: {
        id: resetToken.usuarioId
      },
      data: {
        contraseña: hashedPassword
      }
    });

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: {
        id: resetToken.id
      },
      data: {
        usado: true
      }
    });

    console.log(`✅ Contraseña restablecida para usuario: ${resetToken.usuario.nombreCompleto}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restablecer contraseña'
    });
  }
};

// =====================================================
// VALIDATE TOKEN - Validar si un token es válido
// =====================================================
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token es requerido'
      });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        usado: false,
        expiraEn: {
          gte: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }

    res.json({
      success: true,
      valid: true
    });

  } catch (error) {
    console.error('❌ Error en validateResetToken:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar token'
    });
  }
};

// =====================================================
// CHANGE PASSWORD - Cambiar contraseña (usuario autenticado)
// =====================================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Del middleware de autenticación

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual y nueva son requeridas'
      });
    }

    // Validar formato de nueva contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales (!@#$%^&*)'
      });
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, usuario.contraseña);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: userId },
      data: { contraseña: hashedPassword }
    });

    console.log(`✅ Contraseña actualizada para usuario: ${usuario.nombreCompleto}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en changePassword:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña'
    });
  }
};
