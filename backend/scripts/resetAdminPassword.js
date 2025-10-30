import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcrypt';
import { prisma } from '../src/utils/prisma.js';

(async ()=>{
  try{
    const newPassword = 'Admin@2024';
    console.log('Hashing new password...');
    const hash = await bcrypt.hash(newPassword, 10);
    console.log('Hash computed:', hash);
    const updated = await prisma.usuario.update({
      where: { nombreUsuario: 'admin' },
      data: { contraseña: hash }
    });
    console.log('Password updated for user:', updated.nombreUsuario);
    await prisma.$disconnect();
    process.exit(0);
  }catch(e){
    console.error('ERROR resetAdminPassword:', e);
    if(e.stack) console.error(e.stack);
    try{ await prisma.$disconnect(); }catch(_){}
    process.exit(1);
  }
})();