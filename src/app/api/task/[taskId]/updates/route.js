import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

// FUNGSI GET: Mengambil semua update untuk sebuah task
export async function GET(request, { params }) {
  const { taskId } = params

  try {
    const updates = await prisma.trTaskUpdate.findMany({
      where: { taskId: parseInt(taskId) },
      include: {
        user: true // Sertakan info user yang memposting
      },
      orderBy: {
        dtmInserted: 'desc' // Tampilkan yang terbaru di atas
      }
    })

    return NextResponse.json(updates)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch updates' }, { status: 500 })
  }
}

// FUNGSI POST: Mengirim update baru
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { taskId } = params

  try {
    const body = await request.json()
    const { updateText } = body

    if (!updateText) {
      return NextResponse.json({ message: 'Update text is required' }, { status: 400 })
    }

    const newUpdate = await prisma.trTaskUpdate.create({
      data: {
        taskId: parseInt(taskId),
        userId: parseInt(session.user.id), // Ambil ID user dari sesi
        updateText: updateText,
        txtInsertedBy: session.user.name
      },
      include: {
        user: true // Langsung sertakan info user di response
      }
    })

    return NextResponse.json(newUpdate, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to post update' }, { status: 500 })
  }
}
