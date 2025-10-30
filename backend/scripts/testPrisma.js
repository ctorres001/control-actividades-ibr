import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/utils/prisma.js';

(async () => {
  try {
    console.log('Iniciando test Prisma...');
    const count = await prisma.usuario.count();
    console.log('usuario count =', count);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('ERROR testPrisma:', e);
    if (e.stack) console.error(e.stack);
    try { await prisma.$disconnect(); } catch(_){}
    process.exit(1);
  }
})();