import prisma from './prisma.js'

/**
 * Fetch complete board data with columns, groups, items, and subitems.
 * Used by both server-side page rendering (RSC) and API routes to avoid duplication.
 */
export async function getBoardData(boardId, userId) {
  const parsedBoardId = parseInt(boardId)

  if (isNaN(parsedBoardId)) {
    return { status: 400, data: null, error: 'Invalid board ID' }
  }

  const board = await prisma.board.findUnique({
    where: { boardId: parsedBoardId },
    include: {
      boardMember: {
        include: {
          mUser: {
            select: {
              userId: true,
              userName: true,
              email: true,
              txtImage: true
            }
          }
        }
      },
      columns: {
        orderBy: { sortOrder: 'asc' },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
          watchedStatusColumns: { include: { statusColumn: true } }
        }
      },
      groups: {
        orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
        include: {
          items: {
            where: { parentId: null },
            orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
            include: {
              values: true,
              subItems: {
                orderBy: [{ sortOrder: 'asc' }, { dtmInserted: 'asc' }],
                include: {
                  values: true
                }
              }
            }
          }
        }
      },
      widgets: true
    }
  })

  if (!board) {
    return { status: 404, data: null, error: 'Board not found' }
  }

  if (userId) {
    const hasAccess = board.boardMember.some(m => Number(m.userId) === Number(userId))

    if (!hasAccess) {
      return { status: 403, data: null, error: 'Access denied' }
    }
  }

  // Convert BigInts safely for JSON and RSC props
  const serialized = JSON.parse(JSON.stringify(board))

  return { status: 200, data: serialized, error: null }
}

