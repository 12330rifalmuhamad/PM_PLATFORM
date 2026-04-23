const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('User model fields:', Object.keys(prisma.user.fields || {}))
  try {
    const user = await prisma.user.findFirst()
    console.log('Sample user keys:', user ? Object.keys(user) : 'No user found')
  } catch (e) {
    console.error('Test failed:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
