import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params

  try {
    const { groupIds } = await request.json()

    if (!Array.isArray(groupIds)) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    // Transaction to update all groups
    await prisma.$transaction(
      groupIds.map((groupId, index) =>
        prisma.group.update({
          where: { groupId: BigInt(groupId) },
          data: { sortOrder: index }
        })
      )
    )

    return NextResponse.json({ message: 'Order updated' })
  } catch (error) {
    console.error('Failed to reorder groups:', error)
    return NextResponse.json({ message: 'Failed to reorder groups' }, { status: 500 })
  }
}
