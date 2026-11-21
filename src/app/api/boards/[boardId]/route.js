import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'
import { getBoardData } from '@/libs/boardData'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params
  const userId = parseInt(session.user.id)

  try {
    const result = await getBoardData(boardId, userId)

    if (result.error) {
      return NextResponse.json({ message: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
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

      // Include struktur yang sama persis dengan GET agar UI sync
      include: {
        boardMember: {
          include: {
            mUser: {
              select: {
                userId: true,
                userName: true,
                email: true,
                txtImage: true
              }
            }
          }
        },
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
              where: { parentId: null }, // Filter parent only
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
