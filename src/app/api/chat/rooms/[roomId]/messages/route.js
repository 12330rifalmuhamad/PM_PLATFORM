import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'
import { encrypt, decrypt } from '@/libs/encryption'

export const dynamic = 'force-dynamic'

// GET: Ambil pesan dari satu chat room
// Query param: ?since=2024-01-01T00:00:00Z → hanya ambil pesan setelah timestamp itu (untuk polling)
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { roomId: roomIdRaw } = await params
    const roomId = BigInt(roomIdRaw)
    
    if (!session.user?.id) {
      console.warn('[Chat Messages API] User ID missing from session')
      return NextResponse.json({ message: 'User ID missing in session' }, { status: 400 })
    }
    
    const userIdStr = session.user.id.toString()
    const userIdBigInt = BigInt(userIdStr)
    const url = new URL(request.url)
    const since = url.searchParams.get('since') // ISO string, opsional

    // Pastikan user adalah peserta room ini
    const participant = await prisma.chatParticipant.findFirst({
      where: { chatRoomId: roomId, userId: userIdBigInt, bitActive: 1 }
    })

    if (!participant) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Bangun filter — jika ada `since`, hanya ambil pesan yang lebih baru
    const where = {
      chatRoomId: roomId,
      bitActive: 1,
      ...(since && { dtmInserted: { gt: new Date(since) } })
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { dtmInserted: 'asc' },
      include: {
        sender: { select: { userId: true, userName: true } }
      }
    })

    // Reset unseen messages hanya saat initial load (tidak saat polling)
    if (!since) {
      await prisma.chatParticipant.updateMany({
        where: { chatRoomId: roomId, userId: userIdBigInt, bitActive: 1 },
        data: { unseenMsgs: 0 }
      })
    }

    const formatted = messages.map(msg => ({
      id: msg.messageId.toString(),
      message: decrypt(msg.messageText),
      time: msg.dtmInserted,
      senderId: msg.senderId.toString(),
      senderName: msg.sender.userName,
      isMine: msg.senderId.toString() === userIdStr
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('🔴 [Chat Messages API] Failed to fetch messages:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Kirim pesan baru ke sebuah chat room
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { roomId: roomIdRaw } = await params
    const roomId = BigInt(roomIdRaw)
    
    if (!session.user?.id) {
      console.warn('[Chat Messages API] User ID missing from session for POST')
      return NextResponse.json({ message: 'User ID missing in session' }, { status: 400 })
    }
    
    const userIdBigInt = BigInt(session.user.id)
    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return NextResponse.json({ message: 'Message cannot be empty' }, { status: 400 })
    }

    // Pastikan user adalah peserta room ini
    const participant = await prisma.chatParticipant.findFirst({
      where: { chatRoomId: roomId, userId: userIdBigInt, bitActive: 1 }
    })

    if (!participant) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Simpan pesan
    const newMessage = await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderId: userIdBigInt,
        messageText: encrypt(message),
        bitActive: 1
      },
      include: {
        sender: { select: { userId: true, userName: true } }
      }
    })

    // Tambah unseen count untuk semua peserta KECUALI pengirim
    await prisma.chatParticipant.updateMany({
      where: {
        chatRoomId: roomId,
        userId: { not: userIdBigInt },
        bitActive: 1
      },
      data: { unseenMsgs: { increment: 1 } }
    })

    return NextResponse.json({
      id: newMessage.messageId.toString(),
      message: message,
      time: newMessage.dtmInserted,
      senderId: newMessage.senderId.toString(),
      senderName: newMessage.sender.userName
    }, { status: 201 })
  } catch (error) {
    console.error('🔴 [Chat Messages API] Failed to send message:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
