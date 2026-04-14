// src/libs/prisma.js
// Singleton Prisma Client untuk menghindari koneksi berlebih di Development mode (Next.js hot reload)

import { PrismaClient } from '@prisma/client'

// Patch BigInt agar bisa di-serialize ke JSON
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
