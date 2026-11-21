// Impor helper server di sini (ini aman karena ini adalah Server Component)
import { getMode } from '@core/utils/serverHelpers'

// Impor komponen KLIEN Anda
import BoardContainer from '@/components/board/BoardContainer'

const BoardPage = async ({ params }) => {
  const { id: boardId } = await params

  // Panggil fungsi server-only di sini
  const mode = await getMode()

  return <BoardContainer boardId={boardId} mode={mode} />
}

export default BoardPage
