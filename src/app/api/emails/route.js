import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export const dynamic = 'force-dynamic'

// GET: Ambil semua pesan sesuai folder
export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = BigInt(session.user.id)
    const url = new URL(request.url)
    const folder = url.searchParams.get('folder') || 'inbox'
    const label = url.searchParams.get('label') || ''

    let where = { bitActive: 1 }

    if (folder === 'sent') {
      where.senderId = userId
      where.folder = 'sent'
    } else if (folder === 'starred') {
      where.recipientId = userId
      where.isStarred = true
      where.folder = { not: 'trash' }
    } else if (folder === 'trash') {
      where.OR = [{ senderId: userId }, { recipientId: userId }]
      where.folder = 'trash'
    } else if (label) {
      where.recipientId = userId
      where.labels = { contains: label }
      where.folder = { not: 'trash' }
    } else {
      // inbox default
      where.recipientId = userId
      where.folder = 'inbox'
    }

    const messages = await prisma.internalMessage.findMany({
      where,
      orderBy: { dtmInserted: 'desc' },
      include: {
        sender: { select: { userId: true, userName: true, email: true } },
        recipient: { select: { userId: true, userName: true, email: true } }
      }
    })

    // Format sesuai struktur yang diharapkan komponen Email Vuexy
    const formatted = messages.map(msg => ({
      id: msg.messageId.toString(),
      from: {
        email: msg.sender.email,
        name: msg.sender.userName,
        avatar: null
      },
      to: [{ email: msg.recipient.email, name: msg.recipient.userName }],
      subject: msg.subject,
      message: msg.body,
      time: msg.dtmInserted,
      isRead: msg.isRead,
      isStarred: msg.isStarred,
      folder: msg.folder,
      labels: msg.labels ? msg.labels.split(',').filter(Boolean) : [],
      replies: []
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Failed to fetch emails:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Kirim pesan baru (compose)
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { recipientEmail, subject, message } = body
    const senderId = BigInt(session.user.id)

    if (!recipientEmail || !subject || !message) {
      return NextResponse.json({ message: 'recipientEmail, subject, and message are required' }, { status: 400 })
    }

    // Cari penerima berdasarkan email
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail }
    })

    if (!recipient) {
      return NextResponse.json({ message: 'Recipient not found' }, { status: 404 })
    }

    // Buat pesan di inbox penerima (folder: inbox)
    const inboxMsg = await prisma.internalMessage.create({
      data: {
        senderId,
        recipientId: recipient.userId,
        subject,
        body: message,
        folder: 'inbox',
        txtInsertedBy: session.user.email
      }
    })

    // Buat salinan di sent milik pengirim
    await prisma.internalMessage.create({
      data: {
        senderId,
        recipientId: recipient.userId,
        subject,
        body: message,
        folder: 'sent',
        isRead: true, // Pesan di sent selalu sudah terbaca
        txtInsertedBy: session.user.email
      }
    })

    return NextResponse.json({ id: inboxMsg.messageId.toString() }, { status: 201 })
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
