import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { boardId } = await params

  try {
    const body = await request.json()
    const { txtColumnName, txtColumnType } = body

    if (!txtColumnName || !txtColumnType) {
      return NextResponse.json({ message: 'Column name and type are required' }, { status: 400 })
    }

    // =======================================================
    // PERBAIKAN: Hitung sortOrder berikutnya
    // =======================================================
    // 1. Cari sortOrder maksimum yang sudah ada di board ini
    const maxSortOrderColumn = await prisma.boardColumn.findFirst({
      where: { boardId: parseInt(boardId) },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    // 2. Tentukan sortOrder baru (jika belum ada kolom, mulai dari 1)
    const nextSortOrder = (maxSortOrderColumn?.sortOrder || 0) + 1

    // =======================================================

    const newColumn = await prisma.boardColumn.create({
      data: {
        boardId: parseInt(boardId),
        columnName: txtColumnName,
        columnType: txtColumnType,
        sortOrder: nextSortOrder, // Gunakan sortOrder yang sudah dihitung
        txtInsertedBy: session.user.name
      }
    })

    return NextResponse.json(newColumn, { status: 201 })
  } catch (error) {
    console.error('🔴 GAGAL MEMBUAT KOLOM:', error)

    return NextResponse.json({ message: 'Failed to create column', error: error.message }, { status: 500 })
  }
}

// Update column name/type/sortOrder
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = await params

  try {
    const body = await request.json()
    const { txtColumnName, txtColumnType, sortOrder } = body || {}

    const updated = await prisma.boardColumn.update({
      where: { columnId: parseInt(columnId) },
      data: {
        columnName: txtColumnName ?? undefined,
        columnType: txtColumnType ?? undefined,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
        width: body.width ?? undefined,
        txtUpdatedBy: session.user.name
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update column:', error)

    return NextResponse.json({ message: 'Failed to update column', error: error.message }, { status: 500 })
  }
}

// Delete a column and its values
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = await params

  try {
    const id = parseInt(columnId)

    // Remove related values first to avoid FK issues
    await prisma.trTaskValue.deleteMany({ where: { columnId: id } })

    await prisma.boardColumn.delete({ where: { columnId: id } })

    return NextResponse.json({ message: 'Column deleted successfully' })
  } catch (error) {
    console.error('Failed to delete column:', error)

    return NextResponse.json({ message: 'Failed to delete column', error: error.message }, { status: 500 })
  }
}
