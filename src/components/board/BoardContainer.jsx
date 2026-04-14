'use client'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'

import useSWR, { useSWRConfig } from 'swr'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip' // Untuk tooltip pada ikon "+"
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

// Component Imports
import TableView from './TableView'
import KanbanView from './KanbanView'
import CalendarView from './CalendarView'
import GanttView from './GanttView'
import DashboardView from './DashboardView'

// Impor state management modal
import { useModalStore } from '@/store/useModalStore'

const fetcher = url => fetch(url).then(res => res.json())

export default function BoardContainer({ boardId }) {
  // Mengatur default activeView ke 'table' agar sesuai dengan 'Main table'
  const [activeView, setActiveView] = useState('table')
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: board, error, isLoading } = useSWR(boardId ? `/api/boards/${boardId}` : null, fetcher)
  const { mutate } = useSWRConfig()
  const router = useRouter()

  const openMenu = event => {
    setMenuAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setMenuAnchorEl(null)
  }

  const handleDeleteBoard = async () => {
    if (!board) return
    closeMenu()

    const confirmed = confirm(`Hapus board "${board.boardName}"? Tindakan ini tidak bisa dibatalkan.`)

    if (!confirmed) return

    try {
      const res = await fetch(`/api/boards/${board.boardId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        throw new Error(data.message || 'Gagal menghapus board')
      }

      mutate('/api/workspaces')
      // Redirect to CRM dashboard which is the safe fallback
      router.push('/dashboards/crm')
    } catch (err) {
      alert(err.message || 'Gagal menghapus board')
    }
  }

  const openModal = useModalStore(state => state.openModal)

  const darkModeClasses = 'bg-backgroundPaper text-textPrimary'

  // Create a new item similar to '+ Add Item' in TableView
  const handleCreateTopNewItem = async () => {
    if (!board?.groups?.length) return

    const targetGroupId = board.groups[0].groupId

    try {
      await fetch(`/api/groups/${targetGroupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: 'New Item' })
      })

      mutate(`/api/boards/${board.boardId}`)
    } catch (e) {
      // noop
    }
  }

  if (isLoading)
    return (
      <div className={`flex justify-center items-center h-48 text-lg ${darkModeClasses}`}>
        <CircularProgress />
      </div>
    )
  if (error)
    return (
      <div className={`flex justify-center items-center h-48 text-lg text-red-500`}> Error: Gagal memuat papan.</div>
    )
  if (!board)
    return (
      <div className={`flex justify-center items-center h-48 text-lg ${darkModeClasses}`}>Papan tidak ditemukan.</div>
    )

  // Daftar view yang sesuai dengan gambar, termasuk "Table" dan "+"
  const views = [
    { key: 'table', label: 'Main table', icon: null }, // 'Main table' tanpa ikon
    { key: 'dashboard', label: 'Dashboard', icon: null }, // Dashboard View
    { key: 'gantt', label: 'Gantt', icon: null },
    { key: 'calendar', label: 'Calendar', icon: null },
    { key: 'kanban', label: 'Kanban', icon: null },
    { key: 'raw_table', label: 'Table', icon: null } // 'Table' kedua, mungkin tampilan mentah
  ]

  return (
    <div className={`flex-1 ${darkModeClasses}`}>
      {/* --- Header Papan & Tab Navigasi View --- */}
      <Box className='px-6 pt-4 border-b border-divider'>
        {/* Baris Pertama: Nama Papan dan Aksi Global */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4'>
          {/* Nama Papan dengan Dropdown */}
          <div className='flex items-center gap-2'>
            <Typography variant='h5' className='!font-semibold'>
              {board.boardName}
            </Typography>
            <IconButton size='small' color='secondary' className='-ml-1'>
              <i className='tabler-chevron-down' />
            </IconButton>
          </div>

          {/* Aksi Kanan: Enhance, Integrate, Automate, Invite, dll. */}
          <div className='flex items-center gap-2 md:gap-4 text-textSecondary overflow-x-auto w-full md:w-auto overflow-y-hidden md:overflow-visible pb-1 md:pb-0'>
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-sparkles' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
            >
              Enhance
            </Button>
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-puzzle' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
            >
              Integrate
            </Button>
            <Button
              variant='text'
              size='small'
              startIcon={<i className='tabler-robot' />}
              className='!normal-case !text-textSecondary hover:!text-primary-main'
            >
              Automate
            </Button>
            <Divider orientation='vertical' flexItem className='!mx-2' />

            <IconButton size='small' color='secondary'>
              <i className='tabler-dots' />
            </IconButton>
            <IconButton size='small' color='secondary'>
              <i className='tabler-arrows-maximize' />
            </IconButton>
            {/* Menu aksi board */}
            <IconButton
              size='small'
              color='secondary'
              onClick={openMenu}
              aria-controls='board-menu'
              aria-haspopup='true'
            >
              <i className='tabler-dots-vertical' />
            </IconButton>
            <Menu id='board-menu' anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu} keepMounted>
              <MenuItem onClick={handleDeleteBoard} sx={{ color: 'error.main' }}>
                <i className='tabler-trash mr-2' /> Hapus Board
              </MenuItem>
            </Menu>
          </div>
        </div>

        {/* Baris Kedua: Tab View Navigasi */}
        <div className='flex justify-between items-center mb-4 overflow-x-auto w-full'>
          <nav className='flex -mb-px whitespace-nowrap'>
            {' '}
            {/* -mb-px untuk menggeser sedikit ke atas */}
            {views.map(view => (
              <Button
                key={view.key}
                className={`!normal-case !rounded-none !py-2 !px-4 !min-w-0 ${
                  activeView === view.key
                    ? '!text-primary-main !border-b-2 !border-primary-main'
                    : '!text-textSecondary hover:!text-primary-main !border-b-2 !border-transparent'
                }`}
                onClick={() => setActiveView(view.key)}
                variant='text' // Gunakan variant text untuk tab
                disableRipple // Hapus efek ripple
              >
                {view.label}
              </Button>
            ))}
            {/* Tombol "+" untuk menambah view baru */}
            <Tooltip title='Add View'>
              <IconButton
                size='small'
                className='!text-textSecondary hover:!text-primary-main !ml-2'
                onClick={() => openModal('ADD_VIEW')}
              >
                <i className='tabler-plus text-lg' />
              </IconButton>
            </Tooltip>
          </nav>
        </div>

        {/* Baris Ketiga: Aksi Cepat (New item, Add widget, Search, Person, Filter) */}
        <div className='flex flex-wrap items-center gap-3 py-3 w-full'>
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='tabler-plus' />}
            onClick={handleCreateTopNewItem}
            className='!normal-case'
          >
            New item
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={<i className='tabler-layout-grid-add' />}
            onClick={() => openModal('ADD_WIDGET')} // Misalnya, modal untuk widget
            className='!normal-case'
          >
            Add widget
          </Button>
          <div className='relative w-full md:w-64 order-last md:order-none'>
             <TextField
               size='small'
               placeholder='Search'
               fullWidth
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               InputProps={{
                 startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search' />
                    </InputAdornment>
                 )
               }}
             />
          </div>

          {/* Tombol panah ke atas */}
          <div className='flex-grow flex justify-end'>
            <IconButton size='small' color='secondary'>
              <i className='tabler-chevron-up' />
            </IconButton>
          </div>
        </div>
      </Box>

      {/* --- Konten View Aktif --- */}
      <div className='p-4 md:p-6'>
        {activeView === 'table' && <TableView board={board} searchQuery={searchQuery} />}
        {activeView === 'dashboard' && <DashboardView board={board} searchQuery={searchQuery} />}
        {activeView === 'gantt' && <GanttView board={board} searchQuery={searchQuery} />}
        {activeView === 'calendar' && <CalendarView board={board} searchQuery={searchQuery} />}
        {activeView === 'kanban' && <KanbanView board={board} searchQuery={searchQuery} />}
        {activeView === 'raw_table' && <TableView board={board} searchQuery={searchQuery} />} {/* Menggunakan TableView untuk 'Table' kedua */}
      </div>
    </div>
  )
}
