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

const TaskCard = ({ task, onOpenDrawer, board, mutate, column, columns, setColumns, tasksList, setTasksList }) => {
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

  // Handle Move Task
  const handleMoveTask = (e, direction) => {
    e.stopPropagation()

    if (direction === 'up' || direction === 'down') {
      const currentIndex = tasksList.findIndex(t => t.taskId === task.taskId)
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (targetIndex >= 0 && targetIndex < tasksList.length) {
        const newTasksList = [...tasksList]
        const temp = newTasksList[currentIndex]
        newTasksList[currentIndex] = newTasksList[targetIndex]
        newTasksList[targetIndex] = temp

        setTasksList(newTasksList)

        // Update column taskIds to maintain consistency with board state
        const newColumns = columns.map(col => {
          if (col.id === column.id) {
            return { ...col, taskIds: newTasksList.map(t => t.taskId) }
          }
          return col
        })
        setColumns(newColumns)
      }
    } else {
      // Move left/right between columns
      const currentColumnIndex = columns.findIndex(c => c.id === column.id)
      const targetColumnIndex = direction === 'left' ? currentColumnIndex - 1 : currentColumnIndex + 1

      if (targetColumnIndex >= 0 && targetColumnIndex < columns.length) {
        const targetColumn = columns[targetColumnIndex]

        const newColumns = columns.map(col => {
          if (col.id === column.id) {
            return { ...col, taskIds: col.taskIds.filter(id => id !== task.taskId) }
          }
          if (col.id === targetColumn.id) {
            return { ...col, taskIds: [...col.taskIds, task.taskId] }
          }
          return col
        })

        setColumns(newColumns)

        // API update for status change
        const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId
        fetch(`/api/tasks/${task.taskId}/values`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intColumn_ID: statusColumnId, txtValue: targetColumn.id })
        }).then(() => {
          mutate(`/api/boards/${board.boardId}`)
        })
      }
    }
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

  const currentColumnIndex = columns?.findIndex(c => c.id === column.id)
  const currentTaskIndex = tasksList?.findIndex(t => t.taskId === task.taskId)

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
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-backgroundPaper rounded-md p-1 shadow-sm border border-divider z-10'>
            <div className='flex flex-col gap-0.5 border-r border-divider pr-1 mr-1'>
              <IconButton
                size='small'
                disabled={currentTaskIndex === 0}
                onClick={e => handleMoveTask(e, 'up')}
                className='p-0.5'
              >
                <i className='tabler-chevron-up text-xs' />
              </IconButton>
              <IconButton
                size='small'
                disabled={currentTaskIndex === tasksList.length - 1}
                onClick={e => handleMoveTask(e, 'down')}
                className='p-0.5'
              >
                <i className='tabler-chevron-down text-xs' />
              </IconButton>
            </div>
            <div className='flex gap-0.5 border-r border-divider pr-1 mr-1'>
              <IconButton
                size='small'
                disabled={currentColumnIndex === 0}
                onClick={e => handleMoveTask(e, 'left')}
                className='p-0.5'
              >
                <i className='tabler-chevron-left text-xs' />
              </IconButton>
              <IconButton
                size='small'
                disabled={currentColumnIndex === columns.length - 1}
                onClick={e => handleMoveTask(e, 'right')}
                className='p-0.5'
              >
                <i className='tabler-chevron-right text-xs' />
              </IconButton>
            </div>
            <IconButton size='small' onClick={handleMenuClick} className='p-0.5'>
              <i className='tabler-dots-vertical text-xs text-textSecondary' />
            </IconButton>
          </div>

          <Typography color='text.primary' className='break-words pr-8'>
            {task.taskTitle}
          </Typography>

          <div className='flex flex-wrap items-center gap-2 mt-1'>
            {task?.status ? (
              <Chip
                size='small'
                label={task.status}
                variant='outlined'
                color={
                  task.status === 'Selesai'
                    ? 'success'
                    : task.status === 'Sedang Dikerjakan'
                      ? 'warning'
                      : task.status === 'Buntu'
                        ? 'error'
                        : 'secondary'
                }
              />
            ) : null}
            {task?.date ? (
              <Chip
                size='small'
                label={task.date}
                icon={<i className='tabler-calendar text-xs px-1' />}
                variant='outlined'
              />
            ) : null}
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
