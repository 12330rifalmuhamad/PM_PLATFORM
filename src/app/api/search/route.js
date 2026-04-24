import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Helper to serialize BigInt
const serialize = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  )
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        notes: [], 
        tasks: [],
        boards: [] 
      })
    }

    // Perform concurrent search across different models
    const [notes, tasks, boards] = await Promise.all([
      // Search in Quick Notes
      prisma.quickNote.findMany({
        where: {
          userId: userId,
          bitActive: 1,
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        orderBy: { dtmUpdated: 'desc' }
      }),

      // Search in Tasks (where user is a member of the board)
      prisma.task.findMany({
        where: {
          bitActive: 1,
          taskTitle: { contains: query, mode: 'insensitive' },
          group: {
            board: {
              boardMember: {
                some: { userId: userId }
              }
            }
          }
        },
        include: {
            group: {
                select: {
                    groupName: true,
                    board: {
                        select: {
                            boardName: true
                        }
                    }
                }
            }
        },
        take: 5,
        orderBy: { dtmUpdated: 'desc' }
      }),

      // Search in Boards (where user is a member)
      prisma.board.findMany({
        where: {
          bitActive: 1,
          boardName: { contains: query, mode: 'insensitive' },
          boardMember: {
            some: { userId: userId }
          }
        },
        take: 3
      })
    ])

    return NextResponse.json(serialize({
      notes,
      tasks,
      boards
    }))

  } catch (error) {
    console.error('[SEARCH_API_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
