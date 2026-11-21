import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

// FUNGSI PUT: Untuk memperbarui/menyimpan pengaturan kolom progress
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { columnId } = await params
    let body

    try {
      body = await request.json()
    } catch (parseError) {
      console.error('🔴 GAGAL PARSE REQUEST BODY:', parseError)
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ message: 'Request body must be an object' }, { status: 400 })
    }

    // 'statusColumns' adalah array [{ statusColumnId, weight }, ...] yang dikirim dari modal
    const { statusColumns } = body

    if (!Array.isArray(statusColumns)) {
      return NextResponse.json({ message: "Payload harus berupa array 'statusColumns'" }, { status: 400 })
    }

    const columnIdInt = parseInt(columnId)

    if (isNaN(columnIdInt)) {
      return NextResponse.json({ message: 'Invalid columnId' }, { status: 400 })
    }

    // Log data yang diterima untuk debugging
    console.log('📥 Data yang diterima:', {
      columnId: columnIdInt,
      statusColumnsCount: statusColumns.length,
      statusColumns: statusColumns
    })

    // Validasi dan prepare data dengan BigInt
    // Prisma memerlukan BigInt untuk field BigInt di PostgreSQL
    const dataToInsert = statusColumns
      .map(({ statusColumnId, weight = 0 }) => {
        const statusId = parseInt(statusColumnId)
        const weightValue = Math.max(0, Math.min(100, parseInt(weight) || 0))

        if (isNaN(statusId) || statusId <= 0) {
          throw new Error(`Invalid statusColumnId: ${statusColumnId}`)
        }

        if (isNaN(columnIdInt) || columnIdInt <= 0) {
          throw new Error(`Invalid columnId: ${columnId}`)
        }

        return {
          progressColumnId: BigInt(columnIdInt),
          statusColumnId: BigInt(statusId),
          weight: weightValue
        }
      })
      .filter(item => item !== null && item !== undefined)

    console.log('📤 Data yang akan disimpan:', {
      count: dataToInsert.length,
      sample: dataToInsert[0] ? {
        progressColumnId: dataToInsert[0].progressColumnId.toString(),
        statusColumnId: dataToInsert[0].statusColumnId.toString(),
        weight: dataToInsert[0].weight
      } : null
    })

    // Kita gunakan $transaction agar semua query berjalan sekaligus
    try {
      await prisma.$transaction(async tx => {
        // 1. Hapus semua pengaturan lama untuk kolom progress ini
        const deleteResult = await tx.mColumnProgressLink.deleteMany({
          where: { progressColumnId: BigInt(columnIdInt) }
        })
        console.log('🗑️ Data lama dihapus:', deleteResult)

        // 2. Buat pengaturan baru dengan weight menggunakan create individual
        if (dataToInsert.length > 0) {
          // Gunakan create individual untuk menghindari masalah dengan createMany
          for (const item of dataToInsert) {
            try {
              await tx.mColumnProgressLink.create({
                data: item
              })
            } catch (createError) {
              // Jika unique constraint violation, skip (sudah ada)
              if (createError?.code === 'P2002') {
                console.warn(`⚠️ Data sudah ada, skip:`, {
                  progressColumnId: item.progressColumnId.toString(),
                  statusColumnId: item.statusColumnId.toString(),
                  weight: item.weight
                })
                continue
              }
              throw createError
            }
          }
          console.log(`✅ ${dataToInsert.length} data berhasil disimpan`)
        } else {
          console.log('ℹ️ Tidak ada data untuk disimpan')
        }
      })
    } catch (dbError) {
      console.error('🔴 ERROR DATABASE:', {
        message: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
        stack: dbError?.stack
      })
      throw dbError
    }

    return NextResponse.json({ message: 'Pengaturan progress berhasil disimpan' })
  } catch (error) {
    console.error('🔴 GAGAL MENYIMPAN PENGATURAN PROGRESS:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name
    })

    return NextResponse.json(
      { message: 'Internal Server Error', error: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

