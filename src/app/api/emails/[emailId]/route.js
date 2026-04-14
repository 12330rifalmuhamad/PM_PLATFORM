import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export const dynamic = 'force-dynamic'

// PATCH: Update satu email (tandai baca, bintang, pindah folder, tambah label)
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const messageId = BigInt(params.emailId)
    const userId = BigInt(session.user.id)
    const body = await request.json()
    const { isRead, isStarred, folder, addLabel, removeLabel } = body

    // Ambil pesan dan pastikan pemiliknya
    const msg = await prisma.internalMessage.findFirst({
      where: {
        messageId,
        OR: [{ senderId: userId }, { recipientId: userId }],
        bitActive: 1
      }
    })

    if (!msg) return NextResponse.json({ message: 'Message not found' }, { status: 404 })

    // Bangun update data
    const updateData = {}
    if (isRead !== undefined) updateData.isRead = isRead
    if (isStarred !== undefined) updateData.isStarred = isStarred
    if (folder !== undefined) updateData.folder = folder

    // Update labels (tambah / hapus)
    if (addLabel || removeLabel) {
      const currentLabels = msg.labels ? msg.labels.split(',').filter(Boolean) : []
      let newLabels = [...currentLabels]

      if (addLabel && !newLabels.includes(addLabel)) newLabels.push(addLabel)
      if (removeLabel) newLabels = newLabels.filter(l => l !== removeLabel)

      updateData.labels = newLabels.join(',')
    }

    updateData.txtUpdatedBy = session.user.email

    const updated = await prisma.internalMessage.update({
      where: { messageId },
      data: updateData
    })

    return NextResponse.json({ id: updated.messageId.toString(), success: true })
  } catch (error) {
    console.error('Failed to update email:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: Hapus permanen dari trash
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const messageId = BigInt(params.emailId)
    const userId = BigInt(session.user.id)

    const msg = await prisma.internalMessage.findFirst({
      where: {
        messageId,
        OR: [{ senderId: userId }, { recipientId: userId }],
        folder: 'trash',
        bitActive: 1
      }
    })

    if (!msg) return NextResponse.json({ message: 'Message not found in trash' }, { status: 404 })

    await prisma.internalMessage.update({
      where: { messageId },
      data: { bitActive: 0 }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
