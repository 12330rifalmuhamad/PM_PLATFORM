import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function POST(request, context) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const params = await context.params
  const { boardId } = params
  const userId = parseInt(session.user.id)

  try {
    // 1. Verify access
    const boardAccess = await prisma.trBoardMember.findFirst({
        where: { boardId: parseInt(boardId), userId }
    })
  
    if (!boardAccess) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { columns } = body

    if (!Array.isArray(columns)) {
      return NextResponse.json({ message: 'Invalid data format' }, { status: 400 })
    }

    // 2. Perform updates in a transaction
    await prisma.$transaction(
      columns.map(col =>
        prisma.boardColumn.update({
          where: { columnId: BigInt(col.columnId) },
          data: { sortOrder: parseInt(col.sortOrder) }
        })
      )
    )

    return NextResponse.json({ message: 'Column order updated successfully' })
  } catch (error) {
    console.error('Failed to update column order:', error)
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
