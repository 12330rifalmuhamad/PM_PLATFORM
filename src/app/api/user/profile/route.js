import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = BigInt(session.user.id)

    const user = await prisma.user.findUnique({
      where: { userId }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.userId.toString(),
        name: user.userName,
        email: user.email,
        image: session.user.image || null
      }
    })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body
    const userId = BigInt(session.user.id)

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        userName: name || undefined,
        txtUpdatedBy: session.user.email,
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.userId.toString(),
        name: updatedUser.userName,
        email: updatedUser.email,
      }
    })
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}




