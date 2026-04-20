import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// PUT: Update Widget
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { widgetId } = await params
  const userId = parseInt(session.user.id)

  try {
    const body = await request.json()
    const { title, chartType, groupByColumn, metricColumn, aggregation, width, height, x, y, filterGroupId, settings } = body

    // Verify ownership via board membership (indirectly)
    // First get the widget to find the boardId
    const existingWidget = await prisma.dashboardWidget.findUnique({
        where: { widgetId: parseInt(widgetId) }
    })

    if (!existingWidget) return NextResponse.json({ message: 'Not Found' }, { status: 404 })

    const isMember = await prisma.trBoardMember.findFirst({
        where: { boardId: existingWidget.boardId, userId }
    })

    if (!isMember) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const updatedWidget = await prisma.dashboardWidget.update({
        where: { widgetId: parseInt(widgetId) },
        data: {
            title,
            chartType,
            groupByColumn,
            metricColumn,
            aggregation,
            width,
            height,
            x: x !== undefined ? x : existingWidget.x,
            y: y !== undefined ? y : existingWidget.y,
            filterGroupId: filterGroupId !== undefined ? (filterGroupId ? BigInt(filterGroupId) : null) : existingWidget.filterGroupId,
            settings: settings !== undefined ? settings : existingWidget.settings,
            txtUpdatedBy: session.user.name
        }
    })

    return NextResponse.json(updatedWidget)

  } catch (error) {
    console.error('Update Widget Error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: Remove Widget
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  
    const { widgetId } = await params
    const userId = parseInt(session.user.id)
  
    try {
      // First get the widget to find the boardId
      const existingWidget = await prisma.dashboardWidget.findUnique({
          where: { widgetId: parseInt(widgetId) }
      })
  
      if (!existingWidget) return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  
      const isMember = await prisma.trBoardMember.findFirst({
          where: { boardId: existingWidget.boardId, userId }
      })
  
      if (!isMember) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  
      await prisma.dashboardWidget.delete({
          where: { widgetId: parseInt(widgetId) }
      })
  
      return NextResponse.json({ message: 'Deleted successfully' })
  
    } catch (error) {
      console.error('Delete Widget Error:', error)
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
  }
