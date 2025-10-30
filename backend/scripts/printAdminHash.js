import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/utils/prisma.js';

(async ()=>{
  try{
    const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario: 'admin' } });
    if(!usuario){
      console.log('Usuario admin no encontrado');
      process.exit(2);
    }
    console.log('Stored hash for admin:', usuario.contraseña);
    await prisma.$disconnect();
  }catch(e){
    console.error('ERROR printAdminHash:', e);
    if(e.stack) console.error(e.stack);
    try{ await prisma.$disconnect(); }catch(_){}
    process.exit(1);
  }
})();