import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET all notes for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)

    const notes = await prisma.quickNote.findMany({
      where: {
        userId: userId,
        bitActive: 1
      },
      orderBy: [
        { isPinned: 'desc' },
        { dtmInserted: 'desc' }
      ]
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('🔴 [Notes API] Failed to fetch notes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST create or update note
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId, title, content, color, isPinned } = await req.json()
    const userId = BigInt(session.user.id)

    if (noteId) {
      // Update
      const updatedNote = await prisma.quickNote.update({
        where: { noteId: BigInt(noteId) },
        data: {
          title,
          content,
          color,
          isPinned,
          dtmUpdated: new Date()
        }
      })
      return NextResponse.json(updatedNote)
    } else {
      // Create
      const newNote = await prisma.quickNote.create({
        data: {
          userId,
          title,
          content,
          color,
          isPinned: isPinned || false
        }
      })
      return NextResponse.json(newNote)
    }
  } catch (error) {
    console.error('🔴 [Notes API] Failed to save note:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE (soft delete)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await req.json()
    if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })

    await prisma.quickNote.update({
      where: { noteId: BigInt(noteId) },
      data: { bitActive: 0 }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('🔴 [Notes API] Failed to delete note:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
