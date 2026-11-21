import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function PATCH(request, context) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const params = await context.params
  const taskId = BigInt(params.taskId)

  try {
    const body = await request.json()
    const { targetIndex, groupId } = body
    const parsedGroupId = BigInt(groupId)

    // 1. Get all tasks in the group, ordered by sortOrder
    // We only need taskId to minimize data transfer
    const tasks = await prisma.task.findMany({
      where: { groupId: parsedGroupId },
      orderBy: { sortOrder: 'asc' },
      select: { taskId: true }
    })

    // 2. Remove the task being moved from the array
    const currentTaskIndex = tasks.findIndex(t => t.taskId === taskId)
    
    if (currentTaskIndex === -1) {
       // It's possible the task was moved to a different group in the UI but backend thinks it's strictly reorder.
       // However, the frontend code provided sends `groupId: sourceGroup.groupId` and calls this only if `sourceGroup.groupId === destGroup.groupId`.
       return NextResponse.json({ message: 'Task not found in group' }, { status: 404 })
    }

    const [movedTask] = tasks.splice(currentTaskIndex, 1)

    // 3. Insert into new position
    // Ensure targetIndex is within bounds
    const safeTargetIndex = Math.max(0, Math.min(targetIndex, tasks.length))

    tasks.splice(safeTargetIndex, 0, movedTask)

    // 4. Update all tasks with their new sortOrder
    // Using $transaction to ensure atomicity
    const updates = tasks.map((task, index) => 
        prisma.task.update({
            where: { taskId: task.taskId },
            data: { sortOrder: index }
        })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ message: 'Reorder success' })

  } catch (error) {
    console.error('Reorder error:', error)
    
return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
