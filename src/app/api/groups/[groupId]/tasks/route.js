import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// Alias plural endpoint to create a task within a group
export async function POST(request, { params }) {
  // Session is optional in this endpoint; default to 'system' when absent
  const session = await getServerSession(authOptions).catch(() => null)

  const { groupId } = await params

  try {
    const body = await request.json()
    const title = body?.txtTaskTitle

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ message: 'txtTaskTitle is required' }, { status: 400 })
    }

    const newTask = await prisma.task.create({
      data: {
        groupId: parseInt(groupId),
        taskTitle: title,
        txtInsertedBy: session?.user?.name || 'system'
      }
    })

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)

    return NextResponse.json({ message: 'Failed to create task', error: error?.message }, { status: 500 })
  }
}
