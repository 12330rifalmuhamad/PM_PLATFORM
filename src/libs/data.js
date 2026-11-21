import prisma from '@/libs/prisma'

export async function getBoardsForWorkspace(workspaceId, userId) {
  try {
    // Validate workspaceId parameter
    if (!workspaceId || workspaceId === null || workspaceId === undefined) {
      console.error('Invalid workspaceId provided:', workspaceId)

      return []
    }

    // Ensure workspaceId is a valid number
    const parsedWorkspaceId = parseInt(workspaceId)

    if (isNaN(parsedWorkspaceId)) {
      console.error('Invalid workspaceId - not a number:', workspaceId)

      return []
    }

    const filterByMember = userId ? { boardMember: { some: { userId: parseInt(userId) } } } : {}

    const boards = await prisma.board.findMany({
      where: { workspaceId: parsedWorkspaceId, ...filterByMember },
      orderBy: { dtmInserted: 'desc' }
    })

    return boards
  } catch (error) {
    console.error('Database Error: Failed to fetch boards for workspaceId:', workspaceId, error)

    // Kembalikan array kosong jika gagal agar UI tidak crash
    return []
  }
}

// Anda bisa menambahkan fungsi data lain di sini di masa depan
// export async function getBoardById(boardId) { ... }
