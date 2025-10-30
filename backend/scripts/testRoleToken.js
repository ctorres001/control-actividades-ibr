import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/utils/prisma.js';
import { generateToken, decodeToken } from '../src/utils/jwt.js';

(async ()=>{
  const nombreUsuario = 'admin';
  try{
    console.log('Fetching user:', nombreUsuario);
    const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario }, include: { rol: true } });
    if(!usuario){
      console.error('User not found');
      process.exit(2);
    }

    const normalizeRole = (r) => {
      if (!r) return null;
      const s = String(r).toLowerCase();
      if (s.includes('admin')) return 'admin';
      if (s.includes('super')) return 'supervisor';
      if (s.includes('ases') || s.includes('aser') || s.includes('agent')) return 'asesor';
      try {
        return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '_');
      } catch (_) {
        return s.replace(/\s+/g, '_');
      }
    };

    const roleNormalized = normalizeRole(usuario.rol?.nombre || null);
    const token = generateToken({ id: usuario.id, nombreUsuario: usuario.nombreUsuario, rol: usuario.rol?.nombre || null, role: roleNormalized, campañaId: usuario.campañaId || null });

    console.log('role (original):', usuario.rol?.nombre || null);
    console.log('role (normalized):', roleNormalized);
    console.log('token:', token);
    console.log('decoded:', decodeToken(token));

    await prisma.$disconnect();
    process.exit(0);
  }catch(e){
    console.error('ERROR testRoleToken:', e);
    if(e.stack) console.error(e.stack);
    try{ await prisma.$disconnect(); }catch(_){ }
    process.exit(1);
  }
})();
