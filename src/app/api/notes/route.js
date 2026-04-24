import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { logActivity } from '@/libs/activityLogger'

// Helper to serialize BigInt in objects/arrays
const serialize = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  )
}

// GET all notes for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)

    if (!prisma.quickNote) {
      throw new Error('Prisma Client is out of sync. Please run "npx prisma generate".')
    }

    const notes = await prisma.quickNote.findMany({
      where: {
        userId,
        bitActive: 1
      },
      orderBy: [
        { isPinned: 'desc' },
        { dtmInserted: 'desc' }
      ]
    })

    return NextResponse.json(serialize(notes))
  } catch (error) {
    console.error('🔴 [Notes API] Failed to fetch notes:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

// POST create or update note
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId, title, content, color, isPinned } = await req.json()
    const userId = BigInt(session.user.id)

    if (!prisma.quickNote) {
      throw new Error('Prisma Client is out of sync. Please run "npx prisma generate".')
    }

    if (noteId) {
      // Update
      const updatedNote = await prisma.quickNote.update({
        where: { noteId: BigInt(noteId) },
        data: {
          title: title || undefined,
          content,
          color,
          isPinned: isPinned !== undefined ? isPinned : undefined,
          dtmUpdated: new Date()
        }
      })

      await logActivity({
        userId,
        actionType: 'UPDATE_NOTE',
        description: `Updated note: ${content.replace(/<[^>]*>/g, '').substring(0, 30)}...`
      })

      return NextResponse.json(serialize(updatedNote))
    } else {
      // Create
      const newNote = await prisma.quickNote.create({
        data: {
          userId,
          title: title || null,
          content,
          color: color || '#ffffd1',
          isPinned: isPinned || false
        }
      })

      await logActivity({
        userId,
        actionType: 'CREATE_NOTE',
        description: `Created a new note: ${content.replace(/<[^>]*>/g, '').substring(0, 30)}...`
      })

      return NextResponse.json(serialize(newNote))
    }
  } catch (error) {
    console.error('🔴 [Notes API] Failed to save note:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

// DELETE (soft delete)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await req.json()
    if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })

    if (!prisma.quickNote) {
      throw new Error('Prisma Client is out of sync. Please run "npx prisma generate".')
    }

    await prisma.quickNote.update({
      where: { noteId: BigInt(noteId) },
      data: { bitActive: 0 }
    })

    // Log the activity
    await logActivity({
      userId: BigInt(session.user.id),
      actionType: 'DELETE_NOTE',
      description: `Deleted note ID: ${noteId}`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('🔴 [Notes API] Failed to delete note:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
