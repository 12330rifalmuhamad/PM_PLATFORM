import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

// FUNGSI PUT: Untuk memperbarui semua opsi untuk sebuah kolom
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { columnId } = params
  const body = await request.json()

  // 'options' adalah daftar label baru dari frontend
  // 'renameMap' adalah peta { oldLabel: newLabel }
  const { options, renameMap } = body

  if (!options) {
    return NextResponse.json({ message: "Missing 'options' in request body" }, { status: 400 })
  }

  try {
    const columnIdInt = parseInt(columnId)

    // Kita gunakan $transaction untuk memastikan semua query berhasil atau semua gagal
    await prisma.$transaction(async tx => {
      // 1. Hapus semua opsi lama
      await tx.mColumnOption.deleteMany({
        where: { columnId: columnIdInt }
      })

      // 2. Buat kembali semua opsi dengan data baru
      await tx.mColumnOption.createMany({
        data: options.map((opt, index) => ({
          columnId: columnIdInt,
          label: opt.label,
          color: opt.color,
          sortOrder: index,
          txtInsertedBy: session.user.name
        }))
      })

      // 3. Perbarui semua trTaskValue yang ada jika ada yang di-rename
      if (renameMap && Object.keys(renameMap).length > 0) {
        for (const [oldLabel, newLabel] of Object.entries(renameMap)) {
          if (oldLabel !== newLabel) {
            await tx.trTaskValue.updateMany({
              where: {
                columnId: columnIdInt,
                value: oldLabel
              },
              data: {
                value: newLabel
              }
            })
          }
        }
      }
    })

    return NextResponse.json({ message: 'Labels updated successfully' })
  } catch (error) {
    console.error(`🔴 GAGAL UPDATE LABELS:`, error)

    return NextResponse.json({ message: 'Failed to update labels', error: error.message }, { status: 500 })
  }
}
