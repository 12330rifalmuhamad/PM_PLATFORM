import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)

    // Parallel fetch for monitoring metrics
    const [
      activeTasksCount,
      totalRooms,
      recentUpdates,
      personalNotesCount,
      overdueTasks
    ] = await Promise.all([
      // 1. Count tasks assigned to or active in user's boards
      prisma.task.count({
        where: {
          bitActive: 1,
          group: {
            board: {
              boardMember: {
                some: { userId: userId }
              }
            }
          }
        }
      }),
      // 2. Chat rooms
      prisma.chatRoom.count({
        where: {
          bitActive: 1,
          participants: {
            some: { userId: userId }
          }
        }
      }),
      // 3. Recent activity logs (last 5)
      prisma.logTaskActivity.findMany({
        where: {
          bitActive: 1,
          task: {
            group: {
              board: {
                boardMember: { some: { userId: userId } }
              }
            }
          }
        },
        take: 5,
        orderBy: { dtmInserted: 'desc' },
        include: {
          task: { select: { taskTitle: true } },
          mUser: { select: { userName: true } }
        }
      }),
      // 4. Personal notes count
      prisma.quickNote.count({
        where: { userId: userId, bitActive: 1 }
      }),
      // 5. Tasks with a "DATE" value that is past (mocked with specific column logic if needed)
      prisma.task.findMany({
        where: {
          bitActive: 1,
          group: {
            board: {
              boardMember: { some: { userId: userId } }
            }
          }
        },
        take: 3,
        include: {
            group: { select: { groupName: true } }
        }
      })
    ])

    return NextResponse.json({
      stats: {
        activeTasks: activeTasksCount,
        chatRooms: totalRooms,
        notes: personalNotesCount,
      },
      recentActivity: recentUpdates,
      urgentTasks: overdueTasks, // Logic for identifying "urgent" can be expanded
    })
  } catch (error) {
    console.error('🔴 [Monitoring API] Failed to fetch metrics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
