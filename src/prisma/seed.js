const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai proses seeding...')

  // 1. Hapus data lama
  console.log('🗑️ Menghapus data lama...')
  await prisma.trTaskValue.deleteMany({})
  await prisma.trTaskUpdate.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.trBoardMember.deleteMany({})
  await prisma.boardColumn.deleteMany({})
  await prisma.group.deleteMany({})
  await prisma.board.deleteMany({})
  await prisma.trWorkspaceMember.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.workspace.deleteMany({})

  // 2. Buat data master dasar
  console.log('🏢 Membuat workspace...')

  const workspace = await prisma.workspace.create({
    data: { workspaceName: 'PT. Inovasi Digital' }
  })

  const workspace2 = await prisma.workspace.create({
    data: { workspaceName: 'PT. Kreatif Nusantara' }
  })

  console.log('👤 Membuat pengguna...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const rifal = await prisma.user.create({
    data: { userName: 'Rifal', email: 'rifal@gmail.com', passwordHash: hashedPassword }
  })

  const andi = await prisma.user.create({
    data: { userName: 'Andi Wijaya', email: 'andi@email.com', passwordHash: hashedPassword }
  })

  const budi = await prisma.user.create({
    data: { userName: 'Budi Santoso', email: 'budi@email.com', passwordHash: hashedPassword }
  })

  // ====================================================================
  // PERBAIKAN DI SINI: Proses Dibuat Bertahap
  // ====================================================================

  // 3. Buat Board DAN Kolomnya terlebih dahulu
  console.log('📝 Membuat papan proyek & kolom default...')

  const board1 = await prisma.board.create({
    data: {
      workspaceId: workspace.workspaceId,
      boardName: 'Peluncuran Produk Q4',
      txtInsertedBy: 'Rifal',
      columns: {
        create: [
          { columnName: 'Item', columnType: 'TEXT' },
          { columnName: 'Pemilik', columnType: 'PERSON' },
          { columnName: 'Status', columnType: 'STATUS' },
          { columnName: 'Tanggal', columnType: 'DATE' }
        ]
      },
      boardMember: {
        create: [
          { userId: rifal.userId, role: 'Owner' },
          { userId: andi.userId, role: 'Editor' }
        ]
      }
    },

    // Penting: Sertakan kolom yang baru dibuat di dalam hasil query
    include: {
      columns: true
    }
  })

  // git

  // 4. Ambil ID dari kolom yang baru saja dibuat
  const pemilikColumnId = board1.columns.find(c => c.columnName === 'Pemilik').columnId
  const statusColumnId = board1.columns.find(c => c.columnName === 'Status').columnId
  const dateColumnId = board1.columns.find(c => c.columnName === 'Tanggal').columnId

  console.log('🏛️ Membuat grup, tugas, dan nilainya...')

  // 5. SEKARANG, buat Grup, Tugas, dan Nilai Tugas menggunakan ID yang sudah ada
  await prisma.group.create({
    data: {
      boardId: board1.boardId,
      groupName: 'Fase Perencanaan',
      items: {
        create: [
          {
            taskTitle: 'Riset pasar',
            values: {
              create: [
                // Gunakan columnId, bukan connect by name
                { columnId: pemilikColumnId, value: rifal.userId.toString() },
                { columnId: statusColumnId, value: 'Selesai' },
                { columnId: dateColumnId, value: new Date().toISOString().slice(0, 10) }
              ]
            }
          },
          {
            taskTitle: 'Finalisasi fitur MVP',
            values: {
              create: [
                { columnId: pemilikColumnId, value: andi.userId.toString() },
                { columnId: statusColumnId, value: 'Sedang Dikerjakan' },
                { columnId: dateColumnId, value: new Date(Date.now() + 86400000).toISOString().slice(0, 10) }
              ]
            }
          }
        ]
      }
    }
  })

  // Tambah beberapa update agar panel updates hidup
  const firstTask = await prisma.task.findFirst({
    where: { groupId: (await prisma.group.findFirst({ where: { boardId: board1.boardId } })).groupId }
  })

  if (firstTask) {
    await prisma.trTaskUpdate.createMany({
      data: [
        {
          taskId: firstTask.taskId,
          userId: rifal.userId,
          updateText: 'Kick-off meeting done. Semua sepakat scope.',
          txtInsertedBy: 'Rifal'
        },
        {
          taskId: firstTask.taskId,
          userId: andi.userId,
          updateText: 'Dokumen riset disiapkan, menunggu review.',
          txtInsertedBy: 'Andi'
        }
      ]
    })
  }

  // Board kedua di workspace lain, hanya untuk Budi
  const board2 = await prisma.board.create({
    data: {
      workspaceId: workspace2.workspaceId,
      boardName: 'Implementasi Website 2025',
      txtInsertedBy: 'Budi',
      columns: {
        create: [
          { columnName: 'Item', columnType: 'TEXT' },
          { columnName: 'Pemilik', columnType: 'PERSON' },
          { columnName: 'Status', columnType: 'STATUS' }
        ]
      },
      boardMember: {
        create: [{ userId: budi.userId, role: 'Owner' }]
      }
    }
  })

  await prisma.group.create({
    data: {
      boardId: board2.boardId,
      groupName: 'Sprint 1',
      items: {
        create: [{ taskTitle: 'Setup repository' }, { taskTitle: 'CI/CD pipeline' }]
      }
    }
  })

  console.log('✅ Proses seeding selesai.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
