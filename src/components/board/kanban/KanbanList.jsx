// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'

// Third-party imports
import classnames from 'classnames'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import TaskCard from './TaskCard'
import NewTask from './NewTask'

// Styles Imports
import styles from './styles.module.css'

const KanbanList = props => {
  // Props
  const { column, tasks, board, setDrawerOpen, columns, setColumns, currentTask, onOpenDrawer, onTaskMove, mutate } =
    props

  // States
  const [editDisplay, setEditDisplay] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [tasksList, setTasksList] = useState(tasks)

  // Update tasksList when tasks prop changes
  useEffect(() => {
    setTasksList(tasks)
  }, [tasks])

  // Add New Task
  const addNewTask = async taskTitle => {
    try {
      // Find the first group to add the task to
      const firstGroup = board.groups[0]

      if (!firstGroup) return

      const response = await fetch(`/api/groups/${firstGroup.groupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: taskTitle })
      })

      if (response.ok) {
        // Update the task's status to match this column
        const newTask = await response.json()
        const statusColumn = board.columns.find(c => c.columnName === 'Status')

        if (statusColumn) {
          await fetch(`/api/tasks/${newTask.taskId}/values`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intColumn_ID: statusColumn.columnId,
              txtValue: column.id
            })
          })
        }

        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // Handle Submit Edit
  const handleSubmitEdit = async e => {
    e.preventDefault()
    setEditDisplay(!editDisplay)

    try {
      // Update column name in database
      const statusColumn = board.columns.find(c => c.columnName === 'Status')

      if (statusColumn) {
        await fetch(`/api/columns/${statusColumn.columnId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txtColumnName: title })
        })
        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('Failed to update column:', error)
    }
  }

  // Cancel Edit
  const cancelEdit = () => {
    setEditDisplay(!editDisplay)
    setTitle(column.title)
  }

  // Delete Column
  const handleDeleteColumn = async () => {
    try {
      const statusColumn = board.columns.find(c => c.columnName === 'Status')

      if (statusColumn) {
        await fetch(`/api/columns/${statusColumn.columnId}`, {
          method: 'DELETE'
        })
        mutate(`/api/boards/${board.boardId}`)
      }
    } catch (error) {
      console.error('Failed to delete column:', error)
    }
  }

  // Get column color based on status
  const getColumnColor = status => {
    switch (status) {
      case 'Selesai':
        return 'bg-[var(--mui-palette-success-main)]'
      case 'Sedang Dikerjakan':
        return 'bg-[var(--mui-palette-warning-main)]'
      case 'Buntu':
        return 'bg-[var(--mui-palette-error-main)]'
      case 'Belum Mulai':
        return 'bg-[var(--mui-palette-secondary-main)]'
      default:
        return 'bg-[var(--mui-palette-secondary-main)]'
    }
  }

  return (
    <div
      className='flex flex-col is-[17.5rem] kanban-column-draggable h-full bg-backgroundPaper rounded-lg p-3 shadow-sm border border-divider'
      data-column-id={column.id}
      onDragOver={e => {
        e.preventDefault()
        e.currentTarget.classList.add('bg-actionHover', 'border-2', 'border-primary')
      }}
      onDragLeave={e => {
        e.currentTarget.classList.remove('bg-actionHover', 'border-2', 'border-primary')
      }}
      onDrop={e => {
        e.preventDefault()
        e.currentTarget.classList.remove('bg-actionHover', 'border-2', 'border-primary')

        const taskId = e.dataTransfer.getData('text/plain')

        if (taskId && onTaskMove) {
          const sourceColumn = e.dataTransfer.getData('source-column')

          if (sourceColumn && sourceColumn !== column.id) {
            onTaskMove(parseInt(taskId), sourceColumn, column.id)
          }
        }
      }}
    >
      {editDisplay ? (
        <form
          className='flex items-center mbe-4 flex-shrink-0 sticky top-0 z-10 bg-backgroundPaper'
          onSubmit={handleSubmitEdit}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              cancelEdit()
            }
          }}
        >
          <InputBase value={title} autoFocus onChange={e => setTitle(e.target.value)} required className='flex-auto' />
          <IconButton color='success' size='small' type='submit'>
            <i className='tabler-check' />
          </IconButton>
          <IconButton color='error' size='small' type='reset' onClick={cancelEdit}>
            <i className='tabler-x' />
          </IconButton>
        </form>
      ) : (
        <div
          id='no-drag'
          className={classnames(
            'flex items-center justify-between is-full p-3 mbe-4 flex-shrink-0 rounded-md text-white sticky top-0 z-10 shadow-sm shadow-primary/10',
            getColumnColor(column.title)
          )}
        >
          <Typography variant='h6' noWrap className='max-is-[80%] font-semibold text-white'>
            {column.title}{' '}
            <span className='opacity-80 text-sm font-normal ml-1'>({columns.find(c => c.id === column.id)?.taskIds?.length || 0})</span>
          </Typography>
          <div className='flex items-center'>
            <i className={classnames('tabler-arrows-move text-white/70 list-handle cursor-grab', styles.drag)} />
            <OptionMenu
              iconClassName='text-xl text-white'
              options={[
                {
                  text: 'Edit',
                  icon: 'tabler-pencil',
                  menuItemProps: {
                    className: 'flex items-center gap-2',
                    onClick: () => setEditDisplay(!editDisplay)
                  }
                },
                {
                  text: 'Delete',
                  icon: 'tabler-trash',
                  menuItemProps: { className: 'flex items-center gap-2', onClick: handleDeleteColumn }
                }
              ]}
            />
          </div>
        </div>
      )}
      <div className='flex-1 overflow-y-auto overflow-x-hidden space-y-2'>
        {tasksList.map(
          task =>
            task && (
              <TaskCard
                key={`${column.id}-${task.taskId}`}
                task={task}
                column={column}
                onOpenDrawer={onOpenDrawer}
                board={board}
                mutate={mutate}
              />
            )
        )}
      </div>
      <div className='flex-shrink-0 mt-2'>
        <NewTask onAddTask={addNewTask} />
      </div>
    </div>
  )
}

export default KanbanList
