import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params

  try {
    const body = await request.json()

    const groupName = body?.groupName || body?.txtGroupName || 'New Group'
    const groupColor = body?.groupColor || body?.txtGroupColor || '#579BFC'

    if (!groupName || typeof groupName !== 'string') {
      return NextResponse.json({ message: 'groupName is required' }, { status: 400 })
    }

    // Determine next sort order for this board's groups
    const existingCount = await prisma.group.count({ where: { boardId: parseInt(boardId) } })

    const newGroup = await prisma.group.create({
      data: {
        boardId: parseInt(boardId),
        groupName,
        groupColor,
        sortOrder: existingCount,
        txtInsertedBy: session.user.name
      }
    })

    return NextResponse.json(newGroup, { status: 201 })
  } catch (error) {
    console.error('Failed to create group:', error)

    return NextResponse.json({ message: 'Failed to create group', error: error?.message }, { status: 500 })
  }
}
