import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// POST: Create a new Widget
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params // boardId is passed via folder structure
  const userId = parseInt(session.user.id)

  try {
    // Check permission
    const isMember = await prisma.trBoardMember.findFirst({
        where: { boardId: parseInt(boardId), userId }
    })

    if (!isMember) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { title, chartType, groupByColumn, metricColumn, aggregation, width, height, x, y, filterGroupId, settings } = body

    if (!title || !chartType) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const newWidget = await prisma.dashboardWidget.create({
        data: {
            boardId: parseInt(boardId),
            title,
            chartType,
            groupByColumn,
            metricColumn,
            aggregation,
            width,
            height,
            x: x || 0,
            y: y || 0,
            filterGroupId: filterGroupId ? BigInt(filterGroupId) : null,
            settings: settings || null,
            txtInsertedBy: session.user.name
        }
    })

    return NextResponse.json(newWidget)
  } catch (error) {
    console.error('Create Widget Error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
