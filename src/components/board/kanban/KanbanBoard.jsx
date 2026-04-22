'use client'

import { useEffect, useMemo, useState, useRef } from 'react'

import useSWR, { useSWRConfig } from 'swr'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

// Impor komponen-komponen anak
import KanbanList from './KanbanList' // Anda perlu membuat/menyesuaikan file ini
import NewColumn from './NewColumn'
import KanbanDrawer from './KanbanDrawer'

const fetcher = url => fetch(url).then(res => res.json())

const KanbanBoard = () => {
  // State
  const [drawerItem, setDrawerItem] = useState(null)

  // Hooks
  const { data: board, error, isLoading } = useSWR('/api/boards/1', fetcher) // Asumsi board ID 1
  const { mutate } = useSWRConfig()

  // 1. Transformasi Data dari format Board menjadi format Kanban
  const { kanbanColumns, tasksMap } = useMemo(() => {
    if (!board) return { kanbanColumns: [], tasksMap: new Map() }

    // Cari kolom 'Status' dan 'Pemilik' untuk data yang lebih kaya
    const statusColumn = board.columns.find(c => c.columnName === 'Status')
    const personColumn = board.columns.find(c => c.columnType === 'PERSON')

    if (!statusColumn) return { kanbanColumns: [], tasksMap: new Map() }

    // Buat peta (map) dari semua tugas untuk akses cepat
    const allTasks = new Map()

    board.groups.forEach(group => {
      group.items.forEach(item => {
        const statusValue = item.values.find(v => v.columnId === statusColumn.columnId)?.value || 'Belum Mulai'
        const personValue = item.values.find(v => v.columnId === personColumn?.columnId)?.value
        const dateValue = item.values.find(v => v.column?.columnType === 'DATE' || v.columnType === 'DATE')?.value
        const user = personValue ? board.boardMember.find(m => m.userId === parseInt(personValue))?.mUser : null

        allTasks.set(item.taskId, {
          ...item,
          status: statusValue,
          user: user,
          date: dateValue || null
        })
      })
    })

    // Buat struktur kolom Kanban berdasarkan status unik yang ada (matching table view)
    const statusOrder = ['Belum Mulai', 'Sedang Dikerjakan', 'Buntu', 'Selesai']

    const columns = statusOrder.map(status => ({
      id: status,
      title: status,
      taskIds: []
    }))

    const uncategorizedColumn = { id: 'Uncategorized', title: 'Uncategorized', taskIds: [] }

    // Masukkan setiap tugas ke kolom status yang sesuai
    allTasks.forEach(task => {
      const targetColumn = columns.find(c => c.id === task.status)

      if (targetColumn) {
        targetColumn.taskIds.push(task.taskId)
      } else {
        uncategorizedColumn.taskIds.push(task.taskId)
      }
    })

    if (uncategorizedColumn.taskIds.length > 0) columns.push(uncategorizedColumn)

    return { kanbanColumns: columns, tasksMap: allTasks }
  }, [board])

  // 2. Setup drag-and-drop dengan data Kanban
  const [boardRef, columns, setColumns] = useDragAndDrop(kanbanColumns, {
    plugins: [animations()],
    dragHandle: '.list-handle' // Handle untuk drag kolom (opsional)
  })

  // 3. Simpan perubahan ke backend saat ada aksi drag-and-drop
  const prevColumnsRef = useRef(columns)

  useEffect(() => {
    if (JSON.stringify(prevColumnsRef.current) !== JSON.stringify(columns)) {
      for (const newColumn of columns) {
        const prevColumn = prevColumnsRef.current.find(c => c.id === newColumn.id)
        const movedTaskId = newColumn.taskIds.find(id => !prevColumn?.taskIds.includes(id))

        if (movedTaskId) {
          const newStatus = newColumn.id
          const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

          fetch(`/api/tasks/${movedTaskId}/values`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intColumn_ID: statusColumnId, txtValue: newStatus })
          }).then(() => {
            mutate(`/api/boards/${board.boardId}`)
          })
          break
        }
      }
    }

    prevColumnsRef.current = columns
  }, [columns, board, mutate])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Failed to load board.</div>

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-start gap-6 overflow-x-auto p-4 flex-1'>
        <div ref={boardRef} className='flex gap-6 h-full'>
          {columns.map(column => (
            <KanbanList
              key={column.id}
              column={column}
              tasks={column.taskIds.map(id => tasksMap.get(id))}
              board={board}
              setDrawerOpen={setDrawerItem}
              columns={columns}
              setColumns={setColumns}
              mutate={mutate}
            />
          ))}
        </div>
      </div>
      <KanbanDrawer open={!!drawerItem} onClose={() => setDrawerItem(null)} item={drawerItem} />
    </div>
  )
}

export default KanbanBoard
