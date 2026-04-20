import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/libs/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Helper to serialize BigInt in objects/arrays
const serialize = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
  )
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)

    // 1. Dapatkan semua board di mana user adalah member
    const userBoards = await prisma.board.findMany({
      where: {
        bitActive: 1,
        boardMember: { some: { userId: userId } }
      },
      select: { boardId: true, boardName: true }
    })

    const boardIds = userBoards.map(b => b.boardId)

    // 2. Fetch semua tasks dari board-board tersebut
    // Kita ambil mendalam: Task -> Group -> Board, dan Task -> Values -> Column
    const tasks = await prisma.task.findMany({
      where: {
        bitActive: 1,
        group: { boardId: { in: boardIds } }
      },
      include: {
        group: {
          select: { groupName: true, board: { select: { boardName: true, boardId: true } } }
        },
        values: {
          where: { bitActive: 1 },
          include: { column: true }
        }
      },
      orderBy: { dtmInserted: 'desc' }
    })

    // 3. Flatten data untuk Table
    const tableData = tasks.map(task => {
      const row = {
        taskId: task.taskId,
        taskTitle: task.taskTitle,
        boardName: task.group.board.boardName,
        boardId: task.group.board.boardId,
        groupName: task.group.groupName,
        dtmInserted: task.dtmInserted,
        // Kolom custom di-flatten
      }

      // Map values ke keys berdasarkan columnType atau columnName
      task.values.forEach(val => {
        const colKey = val.column.columnName.toLowerCase()
        row[colKey] = val.value
      })

      return row
    })

    return NextResponse.json(serialize(tableData))
  } catch (error) {
    console.error('🔴 [Tables Overview API] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
