import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params

    const task = await prisma.task.findUnique({
      where: { taskId: parseInt(taskId) },
      include: {
        group: {
          include: {
            board: true
          }
        },
        values: {
          include: {
            column: true
          }
        }
      }
    })

    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    
return NextResponse.json({ message: 'Failed to fetch task', error: error?.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params
    const body = await request.json()
    const { taskTitle } = body

    if (!taskTitle) {
      return NextResponse.json({ message: 'taskTitle is required' }, { status: 400 })
    }

    const updatedTask = await prisma.task.update({
      where: { taskId: parseInt(taskId) },
      data: {
        taskTitle: taskTitle,
        dtmUpdated: new Date(),
        txtUpdatedBy: session.user.name
      },
      include: {
        group: {
          include: {
            board: true
          }
        },
        values: {
          include: {
            column: true
          }
        }
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Failed to update task:', error)
    
return NextResponse.json({ message: 'Failed to update task', error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params

    await prisma.task.delete({
      where: { taskId: parseInt(taskId) }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Failed to delete task:', error)
    
return NextResponse.json({ message: 'Failed to delete task', error: error?.message }, { status: 500 })
  }
}
