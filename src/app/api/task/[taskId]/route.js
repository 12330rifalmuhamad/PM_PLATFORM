import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// FUNGSI PATCH: Untuk meng-update judul tugas
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params
    const body = await request.json()

    const updatedTask = await prisma.task.update({
      where: { taskId: parseInt(taskId) },
      data: { taskTitle: body.taskTitle, txtUpdatedBy: session.user.name }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 })
  }
}

// FUNGSI DELETE: Untuk menghapus tugas
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = await params

    await prisma.task.delete({ where: { taskId: parseInt(taskId) } })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete task' }, { status: 500 })
  }
}
