'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

import { useSWRConfig } from 'swr'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

export default function BoardList({ boards }) {
  const { mutate } = useSWRConfig()
  const router = useRouter()
  const pathname = usePathname()
  const workspaceId = 1 // Sesuaikan jika perlu

  // State untuk menu aksi (termasuk delete)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [selectedBoard, setSelectedBoard] = useState(null) // Board yang menunya dibuka

  const handleOpenMenu = (event, board) => {
    event.preventDefault() // Mencegah navigasi Link
    event.stopPropagation()
    setMenuAnchorEl(event.currentTarget)
    setSelectedBoard(board)
  }

  const handleCloseMenu = () => {
    setMenuAnchorEl(null)
    setSelectedBoard(null)
  }

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return

    const boardIdToDelete = selectedBoard.boardId
    const boardNameToDelete = selectedBoard.boardName

    handleCloseMenu() // Tutup menu dulu

    if (confirm(`Are you sure you want to delete the board "${boardNameToDelete}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/boards/${boardIdToDelete}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()

          throw new Error(errorData.message || 'Failed to delete board')
        }

        mutate(`/api/workspaces/${workspaceId}/boards`) // Refresh daftar board
        alert('Board deleted successfully!')

        // Check if we are currently viewing the deleted board
        // Using strict check or path segment check might be safer than startsWith if IDs can overlap, 
        // but typically board IDs are distinct enough. 
        // We check if the current URL contains the board ID.
        if (pathname.includes(boardIdToDelete.toString())) {
             router.push('/dashboards/crm')
        }
      } catch (error) {
        console.error('Deletion failed:', error)
        alert(`Error deleting board: ${error.message}`)
      }
    }
  }

  return (
    <>
      <Grid container spacing={4}>
        {Array.isArray(boards) && boards.length > 0 ? (
          boards.slice(0, 3).map(board => (
            <Grid item xs={12} sm={6} md={4} key={board.boardId}>
              <Link href={`/board/${board.boardId}`} passHref>
                <Box
                  component='a'
                  className='relative group border border-divider rounded-lg hover:border-primary-main transition-colors cursor-pointer block bg-backgroundPaper'
                >
                  {/* Tombol menu aksi (...) */}
                  <IconButton
                    size='small'
                    onClick={e => handleOpenMenu(e, board)}
                    className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity !bg-actionHover hover:!bg-actionSelected'
                    aria-controls={menuAnchorEl ? 'board-actions-menu' : undefined}
                    aria-haspopup='true'
                    aria-expanded={menuAnchorEl ? 'true' : undefined}
                  >
                    <i className='tabler-dots text-textPrimary' />
                  </IconButton>

                  <Box className='h-24 bg-actionHover rounded-t-lg flex items-center justify-center'>
                    <i className='tabler-layout-kanban text-4xl text-textDisabled' />
                  </Box>
                  <div className='p-3 flex justify-between items-center'>
                    <Typography className='font-medium text-textPrimary'>{board.boardName}</Typography>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.preventDefault() /* Logika favorit */
                      }}
                    >
                      <i className='tabler-star text-textDisabled hover:text-warning-main' />
                    </IconButton>
                  </div>
                </Box>
              </Link>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography className='text-textSecondary text-center py-8'>No recent boards found.</Typography>
          </Grid>
        )}
      </Grid>

      {/* Menu Aksi untuk Board */}
      <Menu id='board-actions-menu' anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleDeleteBoard} sx={{ color: 'error.main' }}>
          <i className='tabler-trash mr-2' /> Delete Board
        </MenuItem>
        {/* Tambahkan aksi lain di sini jika perlu */}
      </Menu>
    </>
  )
}
