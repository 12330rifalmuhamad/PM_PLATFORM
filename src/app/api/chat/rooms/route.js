import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'
import { decrypt } from '@/libs/encryption'

export const dynamic = 'force-dynamic'

// GET: Ambil semua chat rooms milik user yang sedang login
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = BigInt(session.user.id)

    const rooms = await prisma.chatRoom.findMany({
      where: {
        bitActive: 1,
        participants: {
          some: { userId, bitActive: 1 }
        }
      },
      include: {
        participants: {
          where: { bitActive: 1 },
          include: {
            mUser: {
              select: { userId: true, userName: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { dtmInserted: 'desc' },
          take: 1,
          include: {
            sender: { select: { userId: true, userName: true } }
          }
        }
      },
      orderBy: { dtmUpdated: 'desc' }
    })

    // Format menjadi struktur yang diharapkan frontend chat Vuexy
    const formatted = rooms.map(room => {
      // Cari lawan bicara (bukan current user) untuk DM
      const otherParticipant = room.participants.find(p => p.userId !== userId)
      const lastMsg = room.messages[0]
      const myParticipant = room.participants.find(p => p.userId === userId)

      return {
        id: room.chatRoomId.toString(),
        isGroup: room.isGroup,
        name: room.isGroup ? room.groupName : otherParticipant?.mUser?.userName || 'Unknown',
        avatar: null, // Bisa ditambahkan avatar URL dari DB di masa mendatang
        lastMessage: decrypt(lastMsg?.messageText) || null,
        lastMessageTime: lastMsg?.dtmInserted || null,
        unseenMsgs: myParticipant?.unseenMsgs || 0,
        userId: otherParticipant?.mUser?.userId?.toString() || null
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Failed to fetch chat rooms:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: Buat chat room baru atau mulai obrolan baru dengan user tertentu
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { targetUserId, isGroup, groupName } = body
    const currentUserId = BigInt(session.user.id)

    if (!isGroup && targetUserId) {
      const targetId = BigInt(targetUserId)

      // Cek apakah sudah ada room DM antara dua user ini
      const existing = await prisma.chatRoom.findFirst({
        where: {
          isGroup: false,
          bitActive: 1,
          AND: [
            { participants: { some: { userId: currentUserId, bitActive: 1 } } },
            { participants: { some: { userId: targetId, bitActive: 1 } } }
          ]
        }
      })

      if (existing) {
        return NextResponse.json({ id: existing.chatRoomId.toString(), alreadyExists: true })
      }

      // Buat room baru
      const newRoom = await prisma.chatRoom.create({
        data: {
          isGroup: false,
          txtInsertedBy: session.user.email,
          participants: {
            create: [
              { userId: currentUserId },
              { userId: targetId }
            ]
          }
        }
      })

      return NextResponse.json({ id: newRoom.chatRoomId.toString() }, { status: 201 })
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Failed to create chat room:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
