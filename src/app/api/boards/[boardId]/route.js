import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    const parsedBoardId = parseInt(boardId)

    if (isNaN(parsedBoardId)) {
      return NextResponse.json({ message: 'Invalid board ID' }, { status: 400 })
    }

    // 1. Verify access (check direct board membership or workspace membership)
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parsedBoardId, userId }
    })

    if (!boardAccess) {
      const boardRecord = await prisma.board.findUnique({
        where: { boardId: parsedBoardId },
        select: { workspaceId: true }
      })

      if (!boardRecord) {
        return NextResponse.json({ message: 'Board not found' }, { status: 404 })
      }

      const wsAccess = await prisma.trWorkspaceMember.findFirst({
        where: { workspaceId: boardRecord.workspaceId, userId }
      })

      if (!wsAccess) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
    }

    // 2. Fetch Board Data with Subitems & full user details
    const board = await prisma.board.findUnique({
      where: { boardId: parsedBoardId },
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            watchedStatusColumns: { include: { statusColumn: true } }
          }
        },
        groups: {
          orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
          include: {
            items: {
              where: { parentId: null },
              orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
              include: {
                values: true,
                subItems: {
                  orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
                  include: {
                    values: true
                  }
                }
              }
            }
          }
        },
        widgets: true
      }
    })

    if (!board) return NextResponse.json({ message: 'Board not found' }, { status: 404 })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to fetch board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { boardName, description } = await request.json()

    const board = await prisma.board.update({
      where: { boardId: parseInt(boardId) },
      data: {
        boardName: boardName || undefined,
        description: description || undefined,
        txtUpdatedBy: session.user.name
      },
      include: {
        boardMember: { include: { mUser: true } },
        columns: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
            watchedStatusColumns: { include: { statusColumn: true } }
          }
        },
        groups: {
          orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
          include: {
            items: {
              where: { parentId: null },
              orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
              include: {
                values: true,
                subItems: {
                  orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
                  include: { values: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to update board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    const boardAccess = await prisma.trBoardMember.findFirst({
      where: { boardId: parseInt(boardId), userId, role: 'Owner' }
    })

    if (!boardAccess) {
      return NextResponse.json({ message: 'Only board owner can delete' }, { status: 403 })
    }

    await prisma.board.delete({ where: { boardId: parseInt(boardId) } })

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Failed to delete board:', error)

    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 })
  }
}
