// =====================================================
// src/utils/prisma.js - Cliente singleton de Prisma
// =====================================================

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn', 'info'] 
      : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    }
  });
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
// Simple lifecycle handling:
// - Keep a singleton Prisma client during the process lifetime
// - Disconnect cleanly on SIGINT/SIGTERM
prisma.$on('error', (e) => {
  // Log Prisma events but avoid aggressive reconnect loops here; the app
  // startup path will try to connect and the engine manages its pool.
  console.error('❌ Prisma event:', e);
});

const gracefulShutdown = async (signal) => {
  try {
    console.log(`🛑 ${signal} received - disconnecting Prisma...`);
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected');
  } catch (err) {
    console.error('❌ Error during Prisma disconnect:', err);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));