import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Helper to serialize BigInt in objects/arrays
const serialize = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  )
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Parallel fetch for monitoring metrics
    const [
      activeTasksCount,
      totalRooms,
      recentUpdates,
      personalNotesCount,
      urgentTasks,
      activityLast7Days,
      statusValues,
      teamMembers
    ] = await Promise.all([
      // 1. Count active tasks
      prisma.task.count({
        where: {
          bitActive: 1,
          group: { board: { boardMember: { some: { userId: userId } } } }
        }
      }),
      // 2. Chat rooms
      prisma.chatRoom.count({
        where: {
          bitActive: 1,
          participants: { some: { userId: userId } }
        }
      }),
      // 3. Recent activity logs (Unified for Tasks and Notes)
      prisma.logTaskActivity.findMany({
        where: {
          bitActive: 1,
          OR: [
            { userId: userId }, // Personal activities (includes notes)
            { 
              task: { 
                group: { board: { boardMember: { some: { userId: userId } } } } 
              } 
            } // Activities on boards I belong to
          ]
        },
        take: 12,
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
      // 5. Urgent tasks (e.g. pinned or specific logic)
      prisma.task.findMany({
        where: {
          bitActive: 1,
          group: { board: { boardMember: { some: { userId: userId } } } }
        },
        take: 5,
        orderBy: { dtmInserted: 'desc' },
        include: {
          group: { select: { groupName: true } }
        }
      }),
      // 6. Activity Timeline (last 7 days grouped by date)
      prisma.logTaskActivity.groupBy({
        by: ['dtmInserted'],
        where: {
          bitActive: 1,
          dtmInserted: { gte: sevenDaysAgo },
          task: { group: { board: { boardMember: { some: { userId: userId } } } } }
        },
        _count: { logId: true }
      }).catch(() => []),
      // 7. Status Distribution
      prisma.trTaskValue.findMany({
        where: {
          bitActive: 1,
          column: { 
            columnType: 'STATUS',
            board: { boardMember: { some: { userId: userId } } }
          }
        },
        select: { value: true }
      }).catch(() => []),
      // 8. Member Workload (Tasks per user)
      prisma.user.findMany({
        where: {
            boardMember: {
                some: {
                    board: { boardMember: { some: { userId: userId } } }
                }
            }
        },
        select: {
            userName: true,
            _count: {
                select: {
                    activityLogs: {
                        where: { dtmInserted: { gte: sevenDaysAgo } }
                    }
                }
            }
        },
        take: 5
      }).catch(() => [])
    ])

    // Process Activity Timeline
    const dateLabels = []
    const activitySeries = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dateLabels.push(d.toLocaleDateString([], { weekday: 'short' }))
      
      const count = activityLast7Days.reduce((acc, curr) => {
        if (curr.dtmInserted.toISOString().split('T')[0] === dateStr) {
          return acc + Number(curr._count.logId)
        }
        return acc
      }, 0)
      activitySeries.push(count)
    }

    // Process Status Distribution
    const statusMap = statusValues.reduce((acc, curr) => {
      if (!curr.value) return acc
      acc[curr.value] = (acc[curr.value] || 0) + 1
      return acc
    }, {})

    return NextResponse.json(serialize({
      stats: {
        activeTasks: { value: activeTasksCount, trend: [10, 20, 15, 30, 25, 40, activeTasksCount] },
        chatRooms: { value: totalRooms, trend: [5, 10, 8, 15, 12, 18, totalRooms] },
        notes: { value: personalNotesCount, trend: [2, 4, 3, 6, 5, 8, personalNotesCount] },
        urgentCount: { value: urgentTasks.length, trend: [1, 3, 2, 5, 4, 7, urgentTasks.length] }
      },
      charts: {
        activityTimeline: {
          labels: dateLabels,
          series: [{ name: 'Activity', data: activitySeries }]
        },
        statusDistribution: {
          labels: Object.keys(statusMap),
          series: Object.values(statusMap)
        },
        workload: teamMembers.map(m => ({
          name: m.userName,
          activity: m._count.activityLogs
        }))
      },
      recentActivity: recentUpdates,
      urgentTasks: urgentTasks
    }))
  } catch (error) {
    console.error('🔴 [Monitoring API] Failed to fetch metrics:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
