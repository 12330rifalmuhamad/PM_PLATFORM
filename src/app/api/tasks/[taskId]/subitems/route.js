import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions).catch(() => null)
  const { taskId } = await params // Ini adalah Parent ID

  try {
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    // 1. Cari Parent Task untuk mendapatkan groupId
    const parentTask = await prisma.task.findUnique({
      where: { taskId: parseInt(taskId) }
    })

    if (!parentTask) {
      return NextResponse.json({ message: 'Parent task not found' }, { status: 404 })
    }

    // 2. Buat Subitem
    const newSubitem = await prisma.task.create({
      data: {
        taskTitle: title,
        groupId: parentTask.groupId, // Subitem ikut grup parent
        parentId: parseInt(taskId), // Link ke Parent
        txtInsertedBy: session?.user?.name || 'system'
      }
    })

    return NextResponse.json(newSubitem, { status: 201 })
  } catch (error) {
    console.error('Failed to create subitem:', error)

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
