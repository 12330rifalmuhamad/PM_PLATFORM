import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

// PATCH: change role
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { boardId, userId } = await params
    const body = await request.json()
    const { role } = body

    if (!role) return NextResponse.json({ message: 'role is required' }, { status: 400 })

    const updated = await prisma.trBoardMember.update({
      where: { boardId_userId: { boardId: parseInt(boardId), userId: parseInt(userId) } },
      data: { role, txtUpdatedBy: session.user.name },
      include: { mUser: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update member role:', error)
    return NextResponse.json({ message: 'Failed to update role', error: error?.message }, { status: 500 })
  }
}

// DELETE: remove member
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { boardId, userId } = await params
    const requestingUserId = parseInt(session.user.id)

    // 1. Check if requester is Owner of the board
    const requesterMembership = await prisma.trBoardMember.findFirst({
        where: {
            boardId: BigInt(boardId),
            userId: BigInt(requestingUserId)
        }
    })

    if (!requesterMembership || requesterMembership.role.toLowerCase() !== 'owner') {
        return NextResponse.json({ message: 'Forbidden: Only board owners can remove members' }, { status: 403 })
    }

    // 2. Perform Removal
    await prisma.trBoardMember.delete({
      where: { boardId_userId: { boardId: BigInt(boardId), userId: BigInt(userId) } }
    })

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json({ message: 'Failed to remove member', error: error?.message }, { status: 500 })
  }
}



