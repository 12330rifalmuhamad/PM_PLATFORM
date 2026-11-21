import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

// FUNGSI PATCH: Untuk meng-update nama grup
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { groupId } = await params
    const body = await request.json()

    const updatedGroup = await prisma.group.update({
      where: { groupId: parseInt(groupId) },
      data: { groupName: body.groupName, groupColor: body.groupColor, txtUpdatedBy: session.user.name, bitCollapsed: body.bitCollapsed }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update group' }, { status: 500 })
  }
}

// FUNGSI DELETE: Untuk menghapus grup (beserta semua tugas di dalamnya)
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { groupId } = await params

    await prisma.group.delete({
      where: { groupId: parseInt(groupId) }
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete group' }, { status: 500 })
  }
}
