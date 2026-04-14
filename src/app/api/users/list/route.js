import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export const dynamic = 'force-dynamic'

// GET: Daftar semua user aktif selain diri sendiri (untuk search contact di chat)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const currentUserId = BigInt(session.user.id)

    const users = await prisma.user.findMany({
      where: {
        bitActive: 1,
        userId: { not: currentUserId }
      },
      select: {
        userId: true,
        userName: true,
        email: true
      },
      orderBy: { userName: 'asc' }
    })

    const formatted = users.map(u => ({
      id: u.userId.toString(),
      fullName: u.userName,
      email: u.email,
      avatar: null,
      status: 'online',
      about: '',
      chat: null
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Failed to fetch users list:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
