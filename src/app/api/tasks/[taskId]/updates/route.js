import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params
    const parsedTaskId = parseInt(taskId)

    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ message: 'Invalid task ID' }, { status: 400 })
    }

    const updates = await prisma.trTaskUpdate.findMany({
      where: { taskId: parsedTaskId },
      orderBy: { dtmInserted: 'desc' },
      include: {
        user: true
      }
    })

    return NextResponse.json(updates)
  } catch (error) {
    console.error('Failed to fetch task updates:', error)

    return NextResponse.json({ message: 'Failed to fetch task updates', error: error?.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params
    const parsedTaskId = parseInt(taskId)

    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ message: 'Invalid task ID' }, { status: 400 })
    }

    const body = await request.json()
    const { updateText } = body

    if (!updateText || !updateText.trim()) {
      return NextResponse.json({ message: 'updateText is required' }, { status: 400 })
    }

    const created = await prisma.trTaskUpdate.create({
      data: {
        taskId: parsedTaskId,
        userId: parseInt(session.user.id),
        updateText,
        txtInsertedBy: session.user.name
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Failed to create task update:', error)

    return NextResponse.json({ message: 'Failed to create task update', error: error?.message }, { status: 500 })
  }
}



