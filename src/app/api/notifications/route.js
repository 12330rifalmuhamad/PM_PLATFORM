import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'
import { decrypt } from '@/libs/encryption'

export const dynamic = 'force-dynamic'

// GET: Ambil semua notifikasi untuk user yang login
// Sumber notifikasi:
//   1. Chat rooms dengan unseenMsgs > 0 (pesan belum dibaca)
//   2. trNotification dari database (jika ada)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = BigInt(session.user.id)
    const notifications = []

    // ─── 1. Chat Notifications ─────────────────────────────────────────────
    const chatParticipants = await prisma.chatParticipant.findMany({
      where: {
        userId,
        bitActive: 1,
        unseenMsgs: { gt: 0 }
      },
      include: {
        chatRoom: {
          include: {
            messages: {
              orderBy: { dtmInserted: 'desc' },
              take: 1,
              include: {
                sender: { select: { userId: true, userName: true } }
              }
            },
            participants: {
              where: {
                userId: { not: userId },
                bitActive: 1
              },
              include: {
                mUser: { select: { userId: true, userName: true } }
              },
              take: 1
            }
          }
        }
      }
    })

    chatParticipants.forEach(participant => {
      const room = participant.chatRoom
      const lastMsg = room.messages[0]
      const otherUser = room.participants[0]?.mUser

      if (!lastMsg) return

      const senderName = lastMsg.sender.userName
      const isGroup = room.isGroup
      const roomName = isGroup ? room.groupName : (otherUser?.userName || senderName)

      notifications.push({
        id: `chat-${room.chatRoomId.toString()}`,
        type: 'chat',
        avatarIcon: 'tabler-message',
        avatarColor: 'primary',
        title: `New message from ${senderName}`,
        subtitle: isGroup
          ? `[${roomName}] ${decrypt(lastMsg.messageText).substring(0, 60)}${lastMsg.messageText.length > 60 ? '...' : ''}`
          : decrypt(lastMsg.messageText).substring(0, 80),
        time: formatTimeAgo(lastMsg.dtmInserted),
        read: false,
        count: participant.unseenMsgs,
        link: '/apps/chat',
        roomId: room.chatRoomId.toString()
      })
    })

    // ─── 2. DB Notifications (trNotification jika ada) ────────────────────
    try {
      const dbNotifs = await prisma.trNotification.findMany({
        where: { userId, isRead: false, bitActive: 1 },
        orderBy: { dtmInserted: 'desc' },
        take: 10
      })

      dbNotifs.forEach(n => {
        notifications.push({
          id: `db-${n.notificationId?.toString() || Math.random()}`,
          type: n.type || 'system',
          avatarIcon: 'tabler-bell',
          avatarColor: 'info',
          title: n.title || 'System Notification',
          subtitle: n.message || '',
          time: formatTimeAgo(n.dtmInserted),
          read: n.isRead || false,
          count: null,
          link: n.link || null
        })
      })
    } catch {
      // trNotification mungkin ada kolom berbeda, skip saja
    }

    // Sort: unread dulu, lalu terbaru
    notifications.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      return 0
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH: Tandai satu atau semua notifikasi chat sebagai sudah dibaca
export async function PATCH(request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = BigInt(session.user.id)
    const body = await request.json()
    const { roomId, markAll } = body

    if (markAll) {
      // Reset semua unseen chat
      await prisma.chatParticipant.updateMany({
        where: { userId, bitActive: 1 },
        data: { unseenMsgs: 0 }
      })
    } else if (roomId) {
      // Reset unseen untuk room tertentu
      await prisma.chatParticipant.updateMany({
        where: { userId, chatRoomId: BigInt(roomId), bitActive: 1 },
        data: { unseenMsgs: 0 }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function formatTimeAgo(date) {
  if (!date) return ''
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000) // seconds

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`

  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
