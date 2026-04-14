'use client'

import { useState } from 'react'

import { Card, CardContent, Typography, Avatar as MuiAvatar, IconButton, Menu, MenuItem, Chip } from '@mui/material'

const PersonAvatar = ({ user }) => {
  if (!user) return null

  return (
    <MuiAvatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }} title={user.userName}>
      {user.userName.charAt(0)}
    </MuiAvatar>
  )
}

const TaskCard = ({ task, onOpenDrawer, board, mutate, column }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const handleMenuClick = e => {
    e.stopPropagation() // Mencegah drawer terbuka saat menu diklik
    setAnchorEl(e.currentTarget)
  }

  const handleMenuClose = e => {
    if (e?.stopPropagation) e.stopPropagation()
    setAnchorEl(null)
  }

  const handleDelete = async e => {
    if (e?.stopPropagation) e.stopPropagation()

    try {
      await fetch(`/api/tasks/${task.taskId}`, {
        method: 'DELETE'
      })
      mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }

    handleMenuClose()
  }

  const handleDragStart = e => {
    e.dataTransfer.setData('text/plain', task.taskId.toString())
    e.dataTransfer.setData('source-column', column.id)
    e.dataTransfer.effectAllowed = 'move'

    // Add visual feedback
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = e => {
    // Remove visual feedback
    e.currentTarget.style.opacity = '1'
  }

  return (
    <>
      <Card
        className='item-draggable w-full cursor-grab active:cursor-grabbing overflow-visible relative group hover:shadow-md transition-shadow'
        onClick={() => onOpenDrawer(task)}
        draggable
        elevation={1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <CardContent className='flex flex-col gap-y-2 items-start p-3'>
          <IconButton
            size='small'
            onClick={handleMenuClick}
            className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-backgroundPaper shadow-sm border border-divider'
          >
            <i className='tabler-dots-vertical text-sm text-textSecondary' />
          </IconButton>

          <Typography color='text.primary' className='break-words'>
            {task.taskTitle}
          </Typography>

          <div className='flex flex-wrap items-center gap-2 mt-1'>
            {task?.status ? (
              <Chip 
                size='small' 
                label={task.status} 
                variant='outlined'
                color={
                  task.status === 'Selesai' ? 'success' : 
                  task.status === 'Sedang Dikerjakan' ? 'warning' : 
                  task.status === 'Buntu' ? 'error' : 'secondary'
                } 
              />
            ) : null}
            {task?.date ? <Chip size='small' label={task.date} icon={<i className='tabler-calendar text-xs px-1' />} variant='outlined' /> : null}
          </div>

          <div className='flex justify-end items-center w-full'>
            <PersonAvatar user={task.user} />
          </div>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <i className='tabler-trash mr-2' /> Delete
        </MenuItem>
      </Menu>
    </>
  )
}

export default TaskCard
