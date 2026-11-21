import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params

  try {
    const body = await request.json()

    const newTask = await prisma.task.create({
      data: {
        groupId: parseInt(groupId),
        taskTitle: body.txtTaskTitle,
        txtInsertedBy: session.user.name
      }
    })

    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 })
  }
}
