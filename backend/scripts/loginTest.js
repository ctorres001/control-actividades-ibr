import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import { prisma } from '../src/utils/prisma.js';
import { generateToken } from '../src/utils/jwt.js';

const nombreUsuario = process.env.TEST_USER || 'admin';
const contraseña = process.env.TEST_PASS || 'Admin@2024';

(async ()=>{
  try{
    console.log('Buscando usuario:', nombreUsuario);
    const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario }, include: { rol: true, campaña: true } });
    console.log('Usuario:', usuario ? 'found' : 'not found');
    if(!usuario){ process.exit(2); }
    console.log('Comparando contraseña...');
    const ok = await bcrypt.compare(contraseña, usuario.contraseña);
    console.log('Password match:', ok);
    const payload = { id: usuario.id, nombreUsuario: usuario.nombreUsuario, rol: usuario.rol?.nombre || null, campañaId: usuario.campañaId || null };
    console.log('Payload:', payload);
    const token = generateToken(payload);
    console.log('Token length:', token.length);
    await prisma.$disconnect();
    process.exit(0);
  }catch(e){
    console.error('ERROR in loginTest:', e);
    if(e.stack) console.error(e.stack);
    try{ await prisma.$disconnect(); }catch(_){ }
    process.exit(1);
  }
})();