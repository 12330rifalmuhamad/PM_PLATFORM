import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function PATCH(request, { params }) {
  // Temporarily disable authentication check
  // const session = await getServerSession(authOptions)
  // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { taskId } = params

  try {
    const body = await request.json()

    // =======================================================
    // TAMBAHKAN LOG INI UNTUK DEBUGGING
    // =======================================================
    console.log(`[API LOG] Menerima request PATCH untuk Task ID: ${taskId}`)
    console.log('[API LOG] Payload yang diterima:', body)

    // =======================================================

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: parseInt(taskId),
          columnId: body.intColumn_ID
        }
      },
      update: { value: body.txtValue, txtUpdatedBy: 'system' },
      create: {
        taskId: parseInt(taskId),
        columnId: body.intColumn_ID,
        value: body.txtValue,
        txtInsertedBy: 'system'
      }
    })

    console.log('[API LOG] Berhasil menyimpan ke DB:', updatedValue)

    return NextResponse.json(updatedValue)
  } catch (error) {
    // Jika ada error di sini, ini akan tercetak
    console.error('🔴 [API LOG] GAGAL menyimpan ke DB:', error)

    return NextResponse.json({ message: 'Failed to update task value' }, { status: 500 })
  }
}
