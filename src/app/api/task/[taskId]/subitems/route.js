import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'

export async function POST(request, { params }) {
  const { taskId } = params // Ini adalah ID parent
  const { title } = await request.json()

  try {
    // 1. Cari parent untuk tahu groupId-nya
    const parentTask = await prisma.task.findUnique({
      where: { taskId: Number(taskId) }
    })

    if (!parentTask) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }

    // 2. Buat Subitem (Task baru dengan parentId)
    const newSubitem = await prisma.task.create({
      data: {
        taskTitle: title,
        groupId: parentTask.groupId, // Subitem biasanya mewarisi grup parent
        parentId: Number(taskId) // Kunci Relasi Subitem
      }
    })

    return NextResponse.json(newSubitem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subitem' }, { status: 500 })
  }
}
