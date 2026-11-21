import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = params

  try {
    const members = await prisma.trBoardMember.findMany({
        where: { boardId: parseInt(boardId) },
        include: {
            mUser: {
                select: {
                    userId: true,
                    userName: true,
                    email: true,
                    // Add avatar url if exists in schema, assuming not for now
                }
            }
        },
        orderBy: { dtmInserted: 'asc' }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Fetch Members Error:', error)
    return NextResponse.json({ message: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = params
  const body = await request.json()
  const { email, role = 'Member' } = body

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 })
  }

  try {
    const parsedBoardId = parseInt(boardId)

    // 1. Find User by Email
    const userToAdd = await prisma.user.findUnique({
        where: { email: email }
    })

    if (!userToAdd) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // 2. Check if already a member
    const existingMember = await prisma.trBoardMember.findFirst({
        where: {
            boardId: parsedBoardId,
            userId: userToAdd.userId
        }
    })

    if (existingMember) {
        return NextResponse.json({ message: 'User is already a member of this board' }, { status: 409 })
    }

    // 3. Add to Board
    const newMember = await prisma.trBoardMember.create({
        data: {
            boardId: parsedBoardId,
            userId: userToAdd.userId,
            role: role,
            txtInsertedBy: session.user.name
        },
        include: {
            mUser: {
                select: {
                    userId: true,
                    userName: true,
                    email: true
                }
            }
        }
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Add Member Error:', error)

    return NextResponse.json({ message: 'Failed to add member', error: error.message }, { status: 500 })
  }
}
