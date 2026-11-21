import { getServerSession } from 'next-auth'

// Impor helper server di sini (ini aman karena ini adalah Server Component)
import { getMode } from '@core/utils/serverHelpers'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getBoardData } from '@/libs/boardData'

// Impor komponen KLIEN Anda
import BoardContainer from '@/components/board/BoardContainer'

const BoardPage = async ({ params }) => {
  const { id: boardId } = await params
  const session = await getServerSession(authOptions)
  const mode = await getMode()

  let initialBoard = null

  if (session?.user?.id && boardId) {
    const res = await getBoardData(boardId, parseInt(session.user.id)).catch(() => null)

    if (res?.data) {
      initialBoard = res.data
    }
  }

  return <BoardContainer boardId={boardId} initialBoard={initialBoard} mode={mode} />
}

export default BoardPage
