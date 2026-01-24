// scripts/createGeneralCampaign.js
// Crea la campaña "General" si no existe. Uso puntual.

import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/utils/prisma.js';

(async () => {
  try {
    const existing = await prisma.campaña.findFirst({ where: { nombre: 'General' } });
    if (existing) {
      console.log('Campaña "General" ya existe:', existing);
    } else {
      const nueva = await prisma.campaña.create({ data: { nombre: 'General' } });
      console.log('Campaña "General" creada:', nueva);
    }
  } catch (error) {
    console.error('Error creando campaña General:', error);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch (_) {}
  }
})();
