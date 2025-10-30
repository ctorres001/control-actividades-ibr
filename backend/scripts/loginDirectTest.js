import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/utils/prisma.js';
import bcrypt from 'bcrypt';

(async ()=>{
  const nombreUsuario = 'admin';
  const contraseña = 'Admin@2024';
  try{
    console.log('Direct login test - buscando usuario:', nombreUsuario);
    const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario }, include: { rol: true, campaña: true } });
    console.log('Usuario encontrado?', !!usuario);
    if(!usuario){
      console.log('Usuario no existe');
      process.exit(2);
    }
    console.log('Comparando contraseña...');
    const ok = await bcrypt.compare(contraseña, usuario.contraseña);
    console.log('Contraseña válida?', ok);
    if(ok){
      console.log('Usuario payload:', {
        id: usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol?.nombre || null,
        campañaId: usuario.campañaId || null
      });
      process.exit(0);
    } else {
      console.log('Contraseña inválida');
      process.exit(3);
    }
  }catch(e){
    console.error('ERROR loginDirectTest:', e);
    if(e.stack) console.error(e.stack);
    try{ await prisma.$disconnect(); }catch(_){}
    process.exit(1);
  }
})();