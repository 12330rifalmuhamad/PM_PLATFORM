'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import classNames from 'classnames'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Third-party Imports

  // DND Kit Imports
  import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
  } from '@dnd-kit/core'
  import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
  } from '@dnd-kit/sortable'
  import { CSS } from '@dnd-kit/utilities'

  // Sortable Row Component
  const SortableRow = ({ item, isSelected, children, ...props }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: item.taskId })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      position: 'relative',
      zIndex: isDragging ? 999 : 'auto'
    }

    // Note: We pass listeners down to the drag handle specifically inside the children
    return (
      <tr
        ref={setNodeRef}
        style={style}
        {...props}
        {...attributes} 
      >
        {children(listeners)} 
      </tr>
    )
  }

  // Sortable Group Component (Wrapper for tbody)
  const SortableGroup = ({ id, children }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.3 : 1,
      position: isDragging ? 'relative' : undefined,
      zIndex: isDragging ? 50 : undefined
    }

    return (
      <tbody ref={setNodeRef} style={style}>
        {children(listeners, attributes)}
      </tbody>
    )
  }

  import { useSWRConfig } from 'swr'
  import * as XLSX from 'xlsx'
  import {
    Box,
    Typography,
    IconButton,
    Checkbox,
    Tooltip,
    TextField,
    Button,
    Avatar as MuiAvatar,
    AvatarGroup,
    Menu,
    MenuItem,
    Popover,
    List,
    ListItemButton,
    ListItemText,
    Modal,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    ListItemIcon,
    ListSubheader,
    Divider,
    InputAdornment,
    CircularProgress,
    FormGroup,
    FormControlLabel,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListItem,
    useTheme
  } from '@mui/material'

  import { useDragAndDrop } from '@formkit/drag-and-drop/react'
  import { animations } from '@formkit/drag-and-drop'

    import ItemDetailPanel from './../ItemDetailPanel'
  import InviteMemberDialog from './InviteMemberDialog'
  import ProgressColumnSettingsModal from './ProgressColumnSettingsModal'

  // =================================================================
  // HELPER FUNCTIONS (Global)
  // =================================================================
  const normalizeId = value => {
    if (value === null || typeof value === 'undefined') return ''

    return String(value)
  }

  const findUserById = (userId, board) =>
    (board?.boardMember || []).find(m => String(m.userId) === String(userId ?? ''))?.mUser

  const formatTimelineDate = dateStr => {
    if (!dateStr) return ''
    const date = new Date(dateStr)

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  }

  const hexToRGBA = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const GROUP_COLORS = ['#579bfc', '#FF5C5C', '#FFD166', '#06D6A0', '#118AB2', '#5A189A', '#CBF078', '#F4A261']

  const getRandomColor = () => {
    const colors = [
      'bg-red-100 text-red-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-gray-100 text-gray-600'
    ]

    return colors[Math.floor(Math.random() * colors.length)]
  }

  // =================================================================
  // CELL COMPONENT DEFINITIONS
  // =================================================================

  const parsePersonValue = (value, board) => {
    if (!value) return [];
    try {
      if (typeof value === 'string' && value.startsWith('[')) {
        const userIds = JSON.parse(value);
        return userIds.map(id => findUserById(id, board)).filter(Boolean);
      }
      if (Array.isArray(value)) {
        return value.map(id => findUserById(id, board)).filter(Boolean);
      }
      const user = findUserById(value, board);
      return user ? [user] : [];
    } catch (e) {
      const user = findUserById(value, board);
      return user ? [user] : [];
    }
  }

  const PersonAvatar = ({ users }) => {
    if (!users || users.length === 0) {
      return (
        <Tooltip title='Assign Owner'>
          <MuiAvatar sx={{ width: { xs: 24, md: 28 }, height: { xs: 24, md: 28 }, bgcolor: 'transparent', color: 'text.disabled', border: '1px dashed var(--mui-palette-divider)', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', color: 'primary.main', borderColor: 'primary.main' } }}>
            <i className='tabler-user-plus text-sm md:text-xl' />
          </MuiAvatar>
        </Tooltip>
      )
    }

    if (users.length === 1) {
      const user = users[0]
      const name = user.userName || user.name || 'User'
      return (
        <Tooltip title={name}>
          <MuiAvatar src={user.txtImage} sx={{ width: { xs: 24, md: 28 }, height: { xs: 24, md: 28 }, fontSize: { xs: '0.875rem', md: '0.875rem' }, bgcolor: 'primary.main', color: 'primary.contrastText', cursor: 'pointer' }}>
            {name.charAt(0).toUpperCase()}
          </MuiAvatar>
        </Tooltip>
      )
    }

    return (
      <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: { xs: 24, md: 28 }, height: { xs: 24, md: 28 }, fontSize: '0.875rem', borderColor: 'var(--mui-palette-background-paper)' } }}>
        {users.map(u => {
          const name = u.userName || u.name || 'User'
          return (
            <Tooltip key={u.userId} title={name}>
              <MuiAvatar src={u.txtImage} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', cursor: 'pointer' }}>
                {name.charAt(0).toUpperCase()}
              </MuiAvatar>
            </Tooltip>
          )
        })}
      </AvatarGroup>
    )
  }

  const TimelineCell = ({ value, column }) => {
    if (!value) return <div className='w-full h-2 bg-gray-200 rounded-full mx-2 opacity-50'></div>
    const [start, end] = value.split(',')

    if (!start || !end) return <span className='text-xs text-red-400'>Set Dates</span>

    const isMilestone = start === end

    const displayRange = isMilestone
      ? formatTimelineDate(start)
      : `${formatTimelineDate(start)} - ${formatTimelineDate(end)}`

    return (
      <div className='w-full px-2 py-1 h-full flex items-center'>
        <div
          className={`flex items-center justify-center text-[10px] md:text-[11px] text-white font-semibold rounded-lg bg-gradient-to-r from-success-main to-success-dark h-5 md:h-6 w-full truncate px-2 shadow-sm relative transition-all hover:scale-[1.02]`}
          style={{ 
              backgroundColor: '#00c875',
              boxShadow: '0 2px 4px rgba(0, 200, 117, 0.2)'
          }}
          title={displayRange}
        >
          {isMilestone && <i className='tabler-diamond-filled mr-1 text-[9px] md:text-[10px]' />}
          {displayRange}
        </div>
      </div>
    )
  }

  const StatusCell = ({ value, column }) => {
    const theme = useTheme()
    const options = useMemo(() => {
      if (column.options?.length > 0) {
        return column.options.map(opt => ({
          label: opt.label,
          color: opt.color,
          text: opt.color.includes('/10') || opt.color.includes('gray') ? 'text-gray-400' : 'text-white'
        }))
      }

      // Default mapping for fallback or specific columns
      return [
        { label: 'Sedang Dikerjakan', color: 'bg-yellow-500', text: 'text-white' },
        { label: 'Buntu', color: 'bg-red-500', text: 'text-white' },
        { label: 'Selesai', color: 'bg-green-500', text: 'text-white' },
        { label: 'Belum Mulai', color: 'bg-gray-500', text: 'text-white' },
        { label: 'Tinggi', color: 'bg-purple-500/10', text: 'text-purple-400' },
        { label: 'Medium', color: 'bg-sky-500/10', text: 'text-sky-400' },
        { label: 'Rendah', color: 'bg-green-500/10', text: 'text-green-400' }
      ]
    }, [column])

    const option = options.find(opt => opt.label === value)
    const isPriority = column.columnName.toLowerCase() === 'prioritas'
    const colorClass = option ? `${option.color} ${option.text}` : 'bg-actionHover text-textDisabled'
    
    if (!value) return (
      <div className='w-full h-full flex items-center justify-center group/cell'>
        <i className='tabler-plus text-textDisabled opacity-0 group-hover/cell:opacity-100 transition-opacity' />
      </div>
    )

    return (
      <div className='flex items-center justify-center w-full h-full p-1 lg:p-1.5'>
        <div
          className={classNames(
            'flex items-center justify-center w-full h-full min-h-[26px] font-bold text-[10px] md:text-[11px] uppercase tracking-wide transition-all hover:brightness-110 shadow-sm px-2',
            colorClass,
            isPriority ? 'rounded-full' : 'rounded-md'
          )}
          style={{
            boxShadow: option?.color?.includes('/10') ? 'none' : 'inset 0 -2px 0 rgba(0,0,0,0.12)',
            border: option?.color?.includes('/10') ? '1px solid rgba(0,0,0,0.05)' : 'none',
            textShadow: option?.text === 'text-white' ? '0 1px 1px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <span className='truncate'>{value}</span>
        </div>
      </div>
    )
  }

  const TagsCell = ({ value, column }) => {
    if (!value) return <span className='text-textDisabled text-xs px-2'>Add tags</span>
    const tags = value.split(',')

    return (
      <div className='flex flex-wrap gap-1 px-2 items-center h-full overflow-hidden'>
        {tags.map((tagLabel, index) => {
          const option = column.options?.find(opt => opt.label === tagLabel.trim())
          const colorClass = option?.color || 'bg-gray-200 text-gray-700'

          if (index > 1) return null

          if (index === 1 && tags.length > 2) {
            return (
              <span
                key='more'
                className='text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-200'
              >
                +{tags.length - 1}
              </span>
            )
          }

          return (
            <span
              key={index}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[80px] ${colorClass}`}
              title={tagLabel}
            >
              {tagLabel}
            </span>
          )
        })}
      </div>
    )
  }

  const DateCell = ({ value }) => {
    if (!value) return <span>—</span>

    return <span>{new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
  }

  const FilesCell = ({ value, onListClick }) => {
    const files = value ? value.split(',').filter(Boolean) : []
    const fileCount = files.length

    return (
      <div className='flex items-center justify-center gap-2 text-textSecondary w-full h-full relative group transition-colors hover:bg-actionHover/5 rounded'>
        <div className='flex items-center gap-1.5 pointer-events-none'>
          <i className='tabler-paperclip text-lg' />
          <span className="text-xs font-medium">{fileCount > 0 ? fileCount : '—'}</span>
        </div>
        
        {/* Actions */}
        <div className='absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
          {fileCount === 1 && (
            <a
              href={files[0]}
              target='_blank'
              rel='noopener noreferrer'
              onClick={e => e.stopPropagation()}
              className='flex items-center justify-center text-primary bg-white shadow-sm hover:bg-gray-50 p-1 rounded-full'
              title='Open file'
            >
              <i className='tabler-external-link text-xs' />
            </a>
          )}
          
          {fileCount > 1 && (
            <button
              onClick={e => {
                e.stopPropagation()
                onListClick(e)
              }}
              className='flex items-center justify-center text-info bg-white shadow-sm hover:bg-gray-50 p-1 rounded-full'
              title='View all files'
            >
              <i className='tabler-list text-xs' />
            </button>
          )}
        </div>
      </div>
    )
  }

  const LinkCell = ({ value }) => {
    if (!value) return <span className='text-gray-500'>—</span>
    let href = value

    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      href = 'https://' + href
    }

    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='text-blue-400 hover:text-blue-300 underline truncate'
        onClick={e => e.stopPropagation()}
      >
        {value}
      </a>
    )
  }

  const ProgressCell = ({ item, column }) => {
    const progress = useMemo(() => {
      const watchedColumns = column.watchedStatusColumns || []

      if (watchedColumns.length === 0) return { percent: 0, text: 'N/A' }

      // DEBUG LOG
      console.log('ProgressCell calculation:', {
        columnId: column.columnId,
        watchedColumns: watchedColumns.map(w => ({ id: w.statusColumnId, weight: w.weight }))
      })

      const DONE_LABELS = ['Selesai', 'Done']
      let totalWeight = 0
      let completedWeight = 0

      watchedColumns.forEach(link => {
        const weight = link.weight || 0

        totalWeight += weight
        const taskValue = item.values.find(val => normalizeId(val.columnId) === normalizeId(link.statusColumnId))

        if (taskValue && DONE_LABELS.includes(taskValue.value)) {
          completedWeight += weight
        }
      })

      if (totalWeight === 0) {
        const doneCount = watchedColumns.filter(link => {
          const taskValue = item.values.find(val => normalizeId(val.columnId) === normalizeId(link.statusColumnId))

          return taskValue && DONE_LABELS.includes(taskValue.value)
        }).length

        const percent = watchedColumns.length === 0 ? 0 : Math.round((doneCount / watchedColumns.length) * 100)

        return { percent, text: `${percent}%` }
      }

      const percent = totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100)

      return { percent, text: `${percent}%` }
    }, [item, column])

    return (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: '70%', height: 20, backgroundColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              width: `${progress.percent}%`,
              height: '100%',
              backgroundColor: progress.percent === 100 ? 'success.main' : 'primary.main',
              transition: 'width 0.3s ease'
            }}
          />
        </Box>
        <Typography variant='body2' sx={{ width: '30%', textAlign: 'right' }}>
          {progress.text}
        </Typography>
      </Box>
    )
  }

  // =================================================================
  // REUSABLE BOARD CELL
  // =================================================================
  const BoardCell = ({ item, column, board, onUpdateValue, onClick }) => {
    const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(column.columnId))

    const handleClick = e => {
      if (onClick) onClick(e)
    }

    if (column.columnName.toLowerCase() === 'item' || column.columnId === 'item_title') {
      return (
        <div className='w-full h-full px-3 flex items-center'>
          <input
            className='bg-transparent w-full outline-none text-[16px] md:text-sm text-textPrimary truncate border-none p-0 focus:ring-0'
            value={item.taskTitle}
            onChange={e => onUpdateValue(item, { columnType: 'TITLE' }, e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )
    }

    switch (column.columnType) {
      case 'PERSON':
        return (
          <div className='flex items-center justify-center w-full h-full cursor-pointer hover:bg-actionHover transition-colors' onClick={handleClick}>
            <PersonAvatar users={parsePersonValue(cellValue?.value, board)} />
          </div>
        )
      case 'STATUS':
        return (
          <div className='w-full h-full' onClick={handleClick}>
            <StatusCell value={cellValue?.value} column={column} />
          </div>
        )
      case 'TAGS':
        return (
          <div className='w-full h-full cursor-pointer' onClick={handleClick}>
            <TagsCell value={cellValue?.value} column={column} />
          </div>
        )
      case 'TIMELINE':
        return (
          <div className='w-full h-full flex items-center' onClick={handleClick}>
            <TimelineCell value={cellValue?.value} column={column} />
          </div>
        )
      case 'DATE':
        return (
          <div className='w-full text-center' onClick={handleClick}>
            <DateCell value={cellValue?.value} />
          </div>
        )
      case 'CHECKBOX':
        return (
          <div className='flex justify-center w-full'>
            <Checkbox
              checked={cellValue?.value === 'true'}
              onChange={e => onUpdateValue(item, column, e.target.checked.toString())}
              onClick={e => e.stopPropagation()}
              size='medium'
              sx={{ p: { xs: 1, md: 0.5 } }}
            />
          </div>
        )
      case 'FILES':
        return (
          <div onClick={handleClick}>
            <FilesCell value={cellValue?.value} />
          </div>
        )
      case 'LINK':
        return (
          <div className='px-2' onClick={handleClick}>
            <LinkCell value={cellValue?.value} />
          </div>
        )
      case 'NUMBER':
        return (
          <input
            className='bg-transparent w-full text-center outline-none text-[16px] md:text-xs text-textPrimary truncate border-none focus:ring-0'
            type='number'
            value={cellValue?.value || ''}
            placeholder='-'
            onChange={e => onUpdateValue(item, column, e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        )
      case 'PROGRESS':
        return (
          <div className='px-2 w-full'>
            <ProgressCell item={item} column={column} />
          </div>
        )
      case 'TEXT':
      default:
        return (
          <div className='w-full h-full max-h-[80px] overflow-y-auto custom-scrollbar px-1'>
            <textarea
              className='bg-transparent w-full h-full text-left outline-none text-[16px] md:text-xs text-textPrimary border-none focus:ring-0 resize-none py-2'
              value={cellValue?.value || ''}
              placeholder='-'
              onChange={e => onUpdateValue(item, column, e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
        )
    }
  }

  // =================================================================
  // SUBITEMS VIEW
  // =================================================================
  const SubItemsView = ({
    parentItem,
    board,
    columns,
    columnWidths,
    onUpdateValue,
    onCreateSubitem,
    onCellClick,
    onDeleteSubitem,
    onColumnResizeStart
  }) => {
    const [newSubTitle, setNewSubTitle] = useState('')
    const subItems = parentItem.subItems || []

    const handleKeyDown = e => {
      if (e.key === 'Enter' && newSubTitle.trim()) {
        onCreateSubitem(parentItem.taskId, newSubTitle)
        setNewSubTitle('')
      }
    }

    return (
      <Box sx={{ width: '100%', pl: 6, pr: 0, py: 1.5, backgroundColor: 'background.default' }}>
        <div className='flex relative'>
          <Box
            sx={{
              position: 'absolute',
              left: -10,
              top: -24,
              bottom: 30,
              width: 14,
              borderLeft: '2px solid',
              borderBottom: '2px solid',
              borderColor: 'divider',
              borderBottomLeftRadius: 10,
              zIndex: 0,
              opacity: 0.6
            }}
          />
          <Box
            className="custom-scrollbar"
            sx={{
              width: '100%',
              backgroundColor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              overflowX: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              zIndex: 10,
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <table className='min-w-full border-collapse'>
              <Box component='thead' sx={{ backgroundColor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                <tr>
                  {columns.map(col => (
                    <Box
                      component='th'
                      key={col.columnId}
                      sx={{
                        px: { xs: 0.5, md: 1 },
                        py: { xs: 0.5, md: 1 },
                        fontSize: { xs: '0.6rem', md: '0.65rem' },
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        borderRight: 1,
                        borderColor: 'divider',
                        textAlign: 'left',
                        width: columnWidths[col.columnId] || col.width || 200,
                        minWidth: columnWidths[col.columnId] || col.width || 200,
                        maxWidth: columnWidths[col.columnId] || col.width || 200,
                        position: 'relative'
                      }}
                    >
                      {col.columnName}
                      {/* Resize Handle */}
                      <div
                        className='absolute right-0 top-0 h-full w-3 cursor-col-resize hover:bg-primary/30 transition-colors z-50 touch-none after:content-[""] after:absolute after:right-0 after:top-0 after:w-[1px] after:h-full after:bg-divider group-hover:after:bg-primary'
                        onMouseDown={e => {
                          const currentWidth = columnWidths[col.columnId] || col.width || 200
                          onColumnResizeStart(e, col.columnId, currentWidth)
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    </Box>
                  ))}
                  <th className='w-8'></th>
                </tr>
              </Box>
              <tbody>
                {subItems.map(sub => (
                  <Box
                    component='tr'
                    key={sub.taskId}
                    className='group'
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                      '&:hover': { backgroundColor: 'action.hover' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {columns.map(col => (
                      <Box
                        component='td'
                        key={`${sub.taskId}-${col.columnId}`}
                        sx={{
                          p: 0,
                          borderRight: 1,
                          borderColor: 'divider',
                          height: { xs: 28, md: 32 },
                          width: columnWidths[col.columnId] || col.width || 200,
                          minWidth: columnWidths[col.columnId] || col.width || 200,
                          maxWidth: columnWidths[col.columnId] || col.width || 200,
                          overflow: 'hidden',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        <BoardCell
                          item={sub}
                          column={col}
                          board={board}
                          onUpdateValue={onUpdateValue}
                          onClick={e => onCellClick(e, sub, col)}
                        />
                      </Box>
                    ))}
                    <td className='w-8 text-center'>
                      <button
                        className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity'
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm('Delete subitem?')) onDeleteSubitem(parentItem.taskId, sub.taskId)
                        }}
                      >
                        <i className='tabler-trash text-xs'></i>
                      </button>
                    </td>
                  </Box>
                ))}
                <tr>
                  <Box component='td' colSpan={1} sx={{ borderRight: 1, borderColor: 'divider', p: 0, height: 32 }}>
                    <input
                      type='text'
                      className='w-full h-full px-3 text-sm bg-transparent outline-none placeholder:text-gray-400 transition-colors'
                      placeholder='+ Add subitem'
                      value={newSubTitle}
                      onChange={e => setNewSubTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ color: 'var(--mui-palette-text-primary)' }}
                    />
                  </Box>
                  <td colSpan={columns.length} className='bg-transparent'></td>
                </tr>
              </tbody>
            </table>
          </Box>
        </div>
      </Box>
    )
  }

  // =================================================================
  // POPOVERS & MODALS
  // =================================================================

  const TimelinePopover = ({ anchorEl, onClose, item, column, onSave }) => {
    const open = Boolean(anchorEl)
    const cellValue = (item?.values || []).find(v => v.columnId === column?.columnId)?.value
    const [initialStart, initialEnd] = cellValue ? cellValue.split(',') : ['', '']
    const today = new Date().toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(initialStart || today)
    const [endDate, setEndDate] = useState(initialEnd || today)
    const [isMilestone, setIsMilestone] = useState(initialStart && initialEnd && initialStart === initialEnd)

    const duration = useMemo(() => {
      if (!startDate || !endDate) return 0

      return Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
    }, [startDate, endDate])

    const handleSave = () => {
      let finalStart = startDate,
        finalEnd = endDate

      if (isMilestone) finalEnd = finalStart
      else if (new Date(startDate) > new Date(endDate)) {
        finalStart = endDate
        finalEnd = startDate
      }

      onSave(`${finalStart},${finalEnd}`)
      onClose()
    }

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { width: 340, borderRadius: 2, p: 0 } }}
      >
        <Box sx={{ p: 2 }}>
          <div className='flex justify-between items-center mb-4'>
            <Typography variant='subtitle2' fontWeight='bold'>
              Set dates
            </Typography>
            <Typography variant='caption' className='bg-gray-100 px-2 py-0.5 rounded'>
              {duration} days
            </Typography>
          </div>
          <div className='flex gap-3 mb-4 items-center'>
            <TextField
              type='date'
              size='small'
              fullWidth
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value)
                if (isMilestone) setEndDate(e.target.value)
              }}
              InputLabelProps={{ shrink: true }}
            />
            {!isMilestone && (
              <>
                <div className='text-gray-400 font-bold'>-</div>
                <TextField
                  type='date'
                  size='small'
                  fullWidth
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
          </div>
          <Divider className='my-3' />
          <div className='flex items-center justify-between'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isMilestone}
                  onChange={e => {
                    setIsMilestone(e.target.checked)
                    if (e.target.checked) setEndDate(startDate)
                  }}
                  size='small'
                />
              }
              label={<Typography variant='body2'>Milestone</Typography>}
            />
            <Button variant='contained' size='small' onClick={handleSave} className='!bg-[#00c875] hover:!bg-[#00b569]'>
              Save
            </Button>
          </div>
        </Box>
      </Popover>
    )
  }

  // --- FIXED TAGS POPOVER ---
  const TagsPopover = ({ anchorEl, onClose, item, column, onSave, onAddOption, onManage }) => {
    const open = Boolean(anchorEl)
    const [searchTerm, setSearchTerm] = useState('')

    // 1. Initialize State from Props
    const [selectedTags, setSelectedTags] = useState(() => {
      const val = (item?.values || []).find(v => v.columnId === column?.columnId)?.value

      return val
        ? val
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : []
    })

    // 2. Sync with props if external changes happen
    useEffect(() => {
      const val = (item?.values || []).find(v => v.columnId === column?.columnId)?.value

      setSelectedTags(
        val
          ? val
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : []
      )
    }, [item, column])

    const availableTags = column.options || []
    const filteredTags = availableTags.filter(tag => tag.label.toLowerCase().includes(searchTerm.toLowerCase()))
    const isNewTag = searchTerm && !availableTags.some(t => t.label.toLowerCase() === searchTerm.toLowerCase())

    // 3. Handle Toggle (Update Local State + Parent)
    const handleToggleTag = label => {
      const trimmedLabel = label.trim()
      let newTags

      if (selectedTags.includes(trimmedLabel)) {
        newTags = selectedTags.filter(t => t !== trimmedLabel)
      } else {
        newTags = [...selectedTags, trimmedLabel]
      }

      // Update Local UI instantly
      setSelectedTags(newTags)

      // Update Server/Parent
      onSave(newTags.join(','))
    }

    const handleCreateNewTag = () => {
      if (!searchTerm) return
      const newColor = getRandomColor()
      const trimmedSearch = searchTerm.trim()

      onAddOption({ label: trimmedSearch, color: newColor })
      handleToggleTag(trimmedSearch)
      setSearchTerm('')
    }

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { width: 280, p: 0, borderRadius: 2 } }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            autoFocus
            fullWidth
            size='small'
            placeholder='Find or create a tag...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <i className='tabler-search text-gray-400 mr-2 text-sm' />,
              style: { fontSize: '0.875rem' }
            }}
          />
        </Box>
        <List dense sx={{ maxHeight: 200, overflowY: 'auto', py: 0 }}>
          {filteredTags.map(tag => {
            const isSelected = selectedTags.includes(tag.label.trim())

            return (
              <ListItemButton key={tag.label} onClick={() => handleToggleTag(tag.label)} dense>
                {/* FIX: disableRipple and tabIndex prevent checkbox from stealing focus */}
                <Checkbox
                  checked={isSelected}
                  size='small'
                  style={{ padding: 4, marginRight: 8 }}
                  edge='start'
                  tabIndex={-1}
                  disableRipple
                />
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${tag.color}`}>{tag.label}</div>
              </ListItemButton>
            )
          })}
          {isNewTag && (
            <ListItemButton onClick={handleCreateNewTag}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <i className='tabler-plus text-primary' />
              </ListItemIcon>
              <ListItemText
                primary={`Create new tag: "${searchTerm}"`}
                primaryTypographyProps={{ variant: 'body2', color: 'primary', fontWeight: 600 }}
              />
            </ListItemButton>
          )}
          {filteredTags.length === 0 && !isNewTag && (
            <Typography variant='caption' className='block text-center py-4 text-gray-400'>
              No tags found
            </Typography>
          )}
        </List>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button
            size='small'
            onClick={onManage}
            sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
          >
            Manage tags
          </Button>
        </Box>
      </Popover>
    )
  }

  const ManageTagsDialog = ({ open, onClose, column, onUpdateOption, onDeleteOption }) => {
    const [editingId, setEditingId] = useState(null)
    const [tempName, setTempName] = useState('')
    const [colorAnchor, setColorAnchor] = useState(null)
    const [activeColorId, setActiveColorId] = useState(null)

    const tags = column?.options || []

    const handleStartEdit = tag => {
      setEditingId(tag.id || tag.label)
      setTempName(tag.label)
    }

    const handleSaveEdit = tag => {
      if (tempName && tempName !== tag.label) {
        onUpdateOption({ ...tag, label: tempName }, tag)
      }

      setEditingId(null)
    }

    const handleColorClick = (event, tag) => {
      setColorAnchor(event.currentTarget)
      setActiveColorId(tag.id || tag.label)
    }

    const handleColorChange = color => {
      const tag = tags.find(t => (t.id || t.label) === activeColorId)

      if (tag) {
        onUpdateOption({ ...tag, color }, tag)
      }

      setColorAnchor(null)
      setActiveColorId(null)
    }

    return (
      <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent dividers>
          <List dense>
            {tags.map((tag, idx) => {
              const isEditing = editingId === (tag.id || tag.label)

              return (
                <Box key={idx} className='flex items-center justify-between py-2 border-b border-gray-100 last:border-0'>
                  <div className='flex items-center gap-2 flex-1'>
                    <div
                      className={`w-5 h-5 rounded-full cursor-pointer ${tag.color}`}
                      onClick={e => handleColorClick(e, tag)}
                      title='Change color'
                    />
                    {isEditing ? (
                      <TextField
                        size='small'
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        onBlur={() => handleSaveEdit(tag)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(tag)}
                        autoFocus
                        fullWidth
                      />
                    ) : (
                      <Typography variant='body2' className='cursor-pointer flex-1' onClick={() => handleStartEdit(tag)}>
                        {tag.label}
                      </Typography>
                    )}
                  </div>
                  <div className='flex gap-1'>
                    {!isEditing && (
                      <IconButton size='small' onClick={() => handleStartEdit(tag)}>
                        <i className='tabler-pencil text-gray-400 text-sm' />
                      </IconButton>
                    )}
                    <IconButton size='small' onClick={() => onDeleteOption(tag)}>
                      <i className='tabler-trash text-gray-400 hover:text-red-500 text-sm' />
                    </IconButton>
                  </div>
                </Box>
              )
            })}
            {tags.length === 0 && (
              <Typography variant='caption' className='text-gray-400 text-center block'>
                No tags created yet
              </Typography>
            )}
          </List>
          <ColorPalettePopover
            anchorEl={colorAnchor}
            onClose={() => setColorAnchor(null)}
            onColorSelect={handleColorChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Done</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const colorPalette = [
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-gray-500',
    'bg-purple-500/10',
    'bg-sky-500/10',
    'bg-green-500/10',
    'bg-gray-400',
    'bg-orange-500',
    'bg-teal-500'
  ]

  const ColorPalettePopover = ({ anchorEl, onClose, onColorSelect }) => {
    const open = Boolean(anchorEl)

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, width: 200 }}>
          <Grid container spacing={1}>
            {colorPalette.map(color => (
              <Grid item xs={3} key={color}>
                <Box className={`w-10 h-10 rounded cursor-pointer ${color}`} onClick={() => onColorSelect(color)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    )
  }

  const ValueEditorPopover = ({ anchorEl, onClose, column, board, onValueSelect }) => {
    const { mutate } = useSWRConfig()
    const open = Boolean(anchorEl)
    const [isEditingLabels, setIsEditingLabels] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [colorPickerAnchor, setColorPickerAnchor] = useState(null)
    const [editingLabelId, setEditingLabelId] = useState(null)

    const initialOptions = useMemo(() => {
      const getOptionTextColor = (bgColor) => {
        if (!bgColor) return 'text-white'
        return bgColor.includes('/10') || bgColor.includes('gray') ? 'text-gray-400' : 'text-white'
      }

      const options = column.options?.length
        ? column.options.map(opt => ({ 
            ...opt, 
            id: opt.optionId.toString(), 
            text: getOptionTextColor(opt.color) 
          }))
        : [
            { id: 's1', label: 'Sedang Dikerjakan', color: 'bg-yellow-500', text: 'text-white' },
            { id: 's2', label: 'Buntu', color: 'bg-red-500', text: 'text-white' },
            { id: 's3', label: 'Selesai', color: 'bg-green-500', text: 'text-white' },
            { id: 's4', label: 'Belum Mulai', color: 'bg-gray-500', text: 'text-white' }
          ]
      
      return options
    }, [column])

    const [labels, setLabels] = useState(initialOptions)

    useEffect(() => {
      setLabels(initialOptions)
    }, [initialOptions])

    const [quickAddLabel, setQuickAddLabel] = useState('')

    // State untuk PERSON assignment
    const [personSearch, setPersonSearch] = useState('')
    const [selectedPersons, setSelectedPersons] = useState([])

    useEffect(() => {
      if (open && column?.columnType === 'PERSON') {
        try {
          if (!column.currentValue) {
            setSelectedPersons([])
          } else if (typeof column.currentValue === 'string' && column.currentValue.startsWith('[')) {
            setSelectedPersons(JSON.parse(column.currentValue))
          } else {
            setSelectedPersons([column.currentValue])
          }
        } catch (e) {
          setSelectedPersons([column.currentValue])
        }
        setPersonSearch('')
      }
    }, [open, column])

    const filteredMembers = useMemo(() => {
      if (!board?.boardMember) return []
      return board.boardMember.filter(m => {
        const name = m.mUser?.userName || m.mUser?.name || ''
        return name.toLowerCase().includes(personSearch.toLowerCase())
      })
    }, [board?.boardMember, personSearch])

    const handleLabelChange = (id, newText) =>
      setLabels(prev => prev.map(opt => (opt.id === id ? { ...opt, label: newText } : opt)))

    const handleDeleteLabel = id => setLabels(prev => prev.filter(opt => opt.id !== id))

    const handleAddNewLabel = (labelText = 'New Label') =>
      setLabels(prev => [
        ...prev,
        { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), label: labelText, color: 'bg-gray-400', text: 'text-white' }
      ])

    const handleOpenColorPicker = (event, id) => {
      setColorPickerAnchor(event.currentTarget)
      setEditingLabelId(id)
    }

    const handleColorSelect = newColor => {
      const newTextColor = newColor.includes('/10') || newColor.includes('gray') ? 'text-gray-400' : 'text-white'

      setLabels(prev =>
        prev.map(opt => (opt.id === editingLabelId ? { ...opt, color: newColor, text: newTextColor } : opt))
      )
      setColorPickerAnchor(null)
      setEditingLabelId(null)
    }

    const handleSaveLabels = async (customLabels = null) => {
      setIsLoading(true)
      // Ensure we only use plain data and not event objects
      const rawLabels = (customLabels && Array.isArray(customLabels)) ? customLabels : labels
      
      const labelsToProcess = rawLabels.map(l => ({
        id: String(l.id),
        label: typeof l.label === 'string' ? l.label : 'New Label',
        color: typeof l.color === 'string' ? l.color : 'bg-gray-400'
      }))

      const renameMap = {}

      initialOptions.forEach(originalOpt => {
        const newOpt = labelsToProcess.find(l => l.id === originalOpt.id)

        if (newOpt && newOpt.label !== originalOpt.label) renameMap[originalOpt.label] = newOpt.label
      })
      const optionsToSave = labelsToProcess.map(({ label, color }) => ({ 
        label, 
        color: color.split(' ')[0] 
      }))

      try {
        const response = await fetch(`/api/columns/${column.columnId}/options`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ options: optionsToSave, renameMap: renameMap })
        })

        if (!response.ok) throw new Error('Failed to save labels')
        await mutate(`/api/boards/${board.boardId}`)
        setIsEditingLabels(false)
        setQuickAddLabel('')
      } catch (error) {
        console.error('Gagal menyimpan label:', error)
        alert('Gagal menyimpan label.')
      } finally {
        setIsLoading(false)
      }
    }

    const handleQuickAdd = async () => {
        if (!quickAddLabel.trim()) return
        
        const newLabels = [
            ...labels,
            { id: 'temp-' + Date.now(), label: quickAddLabel, color: 'bg-gray-400', text: 'text-white' }
        ]
        
        await handleSaveLabels(newLabels)
    }

    const renderEditor = () => {
      switch (column.columnType) {
        case 'TEXT':
        case 'LINK':
        case 'NUMBER':
          return (
            <div className='p-2'>
              <TextField
                fullWidth
                size='small'
                autoFocus
                multiline={column.columnType === 'TEXT'}
                minRows={column.columnType === 'TEXT' ? 2 : 1}
                type={column.columnType === 'NUMBER' ? 'number' : 'text'}
                defaultValue={column.currentValue || ''}
                placeholder={column.columnType === 'LINK' ? 'https://example.com' : ''}
                onBlur={e => {
                  onValueSelect(e.target.value)
                  onClose()
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && column.columnType !== 'TEXT') {
                    onValueSelect(e.currentTarget.value)
                    onClose()
                  } else if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault()
                    onValueSelect(e.currentTarget.value)
                    onClose()
                  }
                }}
              />
            </div>
          )
        case 'STATUS':
          if (isEditingLabels) {
            return (
              <Box className='p-3 flex flex-col gap-2' sx={{ width: 300 }}>
                <Typography variant='body2' className='font-semibold'>
                  Edit Labels
                </Typography>
                {labels.map(option => (
                  <TextField
                    key={option.id}
                    fullWidth
                    size='small'
                    value={option.label}
                    onChange={e => handleLabelChange(option.id, e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <button
                            type='button'
                            className={`w-5 h-5 rounded cursor-pointer ${option.color} flex-shrink-0`}
                            onClick={e => handleOpenColorPicker(e, option.id)}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteLabel(option.id)}
                            className='hover:text-red-500'
                          >
                            <i className='tabler-trash text-sm' />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                ))}
                <Button
                  fullWidth
                  variant='outlined'
                  size='small'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() => handleAddNewLabel()}
                >
                  New label
                </Button>
                <Divider className='!my-2' />
                <div className='flex justify-between'>
                  <Button
                    variant='text'
                    size='small'
                    onClick={() => {
                      setIsEditingLabels(false)
                      setLabels(initialOptions)
                    }}
                  >
                    Back
                  </Button>
                  <Button variant='contained' size='small' onClick={() => handleSaveLabels()} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Apply'}
                  </Button>
                </div>
              </Box>
            )
          }

          return (
            <Box className='p-2 flex flex-col gap-2' sx={{ width: 220 }}>
              {labels.map(option => {
                const isPriority = column.columnName.toLowerCase() === 'prioritas';
                const colorVal = option.color.split(' ')[0];
                
                return (
                  <Button
                    key={option.id}
                    variant={isPriority ? 'outlined' : 'contained'}
                    className={`!font-semibold !justify-start !shadow-none ${option.color} ${option.text}`}
                    style={
                      isPriority ? { 
                        borderColor: colorVal.includes('/10') ? 'currentColor' : colorVal.replace('bg-', ''),
                        color: option.text === 'text-white' ? undefined : 'currentColor'
                      } : {}
                    }
                    onClick={() => {
                      onValueSelect(option.label)
                      onClose()
                    }}
                  >
                    {option.label}
                  </Button>
                )
              })}
              <Divider className='!my-1' />
              <Box className="px-1">
                <TextField 
                    fullWidth
                    size="small"
                    placeholder="Quick add label..."
                    autoComplete="off"
                    variant='standard'
                    value={quickAddLabel}
                    onChange={e => setQuickAddLabel(e.target.value)}
                    onKeyDown={async e => {
                        if (e.key === 'Enter' && quickAddLabel.trim()) {
                            e.preventDefault();
                            e.stopPropagation();
                            const newLabelName = quickAddLabel.trim();
                            await handleQuickAdd();
                            onValueSelect(newLabelName);
                            onClose();
                        }
                    }}
                    slotProps={{
                        input: {
                            disableUnderline: true,
                            className: '!text-xs',
                            endAdornment: quickAddLabel && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={async () => {
                                        const newLabelName = quickAddLabel.trim();
                                        await handleQuickAdd();
                                        onValueSelect(newLabelName);
                                        onClose();
                                    }}>
                                        <i className="tabler-plus text-xs" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                />
              </Box>
              <Button
                variant='text'
                size='small'
                startIcon={<i className='tabler-pencil' />}
                onClick={() => setIsEditingLabels(true)}
                className='!normal-case !text-textSecondary !justify-start'
              >
                Edit Labels
              </Button>
            </Box>
          )
        case 'PERSON':
          return (
            <Box className='p-2 flex flex-col gap-2' sx={{ width: 250, maxHeight: 400 }}>
              <TextField
                size="small"
                placeholder="Search people..."
                value={personSearch}
                onChange={e => setPersonSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-search text-sm' />
                    </InputAdornment>
                  )
                }}
                autoFocus
              />
              <List className='overflow-auto p-0 flex-1' sx={{ maxHeight: 250 }}>
                {filteredMembers.map(member => {
                  const name = member.mUser?.userName || member.mUser?.name || 'Unknown'
                  const userIdStr = member.userId.toString()
                  const isSelected = selectedPersons.includes(userIdStr)
                  
                  return (
                    <ListItemButton
                      key={member.userId}
                      onClick={() => {
                        setSelectedPersons(prev => 
                          isSelected ? prev.filter(id => id !== userIdStr) : [...prev, userIdStr]
                        )
                      }}
                      className='!px-2 !py-1 rounded-md'
                    >
                      <ListItemIcon className='!min-w-[30px]'>
                        <Checkbox
                          edge="start"
                          checked={isSelected}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                          className='!p-1'
                        />
                      </ListItemIcon>
                      <MuiAvatar src={member.mUser?.txtImage} sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem', bgcolor: 'primary.main', color: 'white' }}>
                        {name.charAt(0).toUpperCase()}
                      </MuiAvatar>
                      <ListItemText 
                        primary={name} 
                        primaryTypographyProps={{ variant: 'body2', className: 'truncate' }}
                      />
                    </ListItemButton>
                  )
                })}
                {filteredMembers.length === 0 && (
                  <Typography variant='body2' className='text-center p-4 text-textSecondary'>
                    No users found.
                  </Typography>
                )}
              </List>
              <Divider className='!my-1' />
              <div className='flex justify-between items-center px-1'>
                <Button 
                  variant='text' 
                  size='small' 
                  color='error'
                  onClick={() => setSelectedPersons([])}
                  className='!normal-case'
                >
                  Clear
                </Button>
                <Button 
                  variant='contained' 
                  size='small' 
                  onClick={() => {
                    onValueSelect(selectedPersons.length > 0 ? JSON.stringify(selectedPersons) : '')
                    onClose()
                  }}
                  className='!normal-case'
                >
                  Apply
                </Button>
              </div>
            </Box>
          )
        case 'DATE':
          return (
            <div className='p-0'>
              <AppReactDatepicker
                selected={column.currentValue ? new Date(column.currentValue) : new Date()}
                onChange={date => {
                  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                  const dateStr = offsetDate.toISOString().split('T')[0]

                  onValueSelect(dateStr)
                  onClose()
                }}
                inline
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
          )
        default:
          return <div className='p-2'>Not editable via popover.</div>
      }
    }

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => {
          setIsEditingLabels(false)
          setLabels(initialOptions)
          onClose()
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
            sx: {
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(8px)',
                bgcolor: 'background.paper'
            }
        }}
      >
        {renderEditor()}
        <ColorPalettePopover
          anchorEl={colorPickerAnchor}
          onClose={() => setColorPickerAnchor(null)}
          onColorSelect={handleColorSelect}
        />
      </Popover>
    )
  }

  const CreateColumnModal = ({ open, onClose, onColumnCreated, boardId, initialType = 'TEXT' }) => {
    const [columnName, setColumnName] = useState('')
    const [columnType, setColumnType] = useState(initialType)

    useEffect(() => {
      setColumnType(initialType)
    }, [initialType])

    const handleCreate = async () => {
      if (!columnName.trim()) return
      await onColumnCreated({ txtColumnName: columnName, txtColumnType: columnType })
      setColumnName('')
      setColumnType('TEXT')
    }

    return (
      <Modal open={open} onClose={onClose}>
        <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-backgroundPaper p-4'>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h6'>Add New Column</Typography>
            <TextField label='Column Name' value={columnName} onChange={e => setColumnName(e.target.value)} autoFocus />
            <FormControl fullWidth>
              <InputLabel>Column Type</InputLabel>
              <Select value={columnType} label='Column Type' onChange={e => setColumnType(e.target.value)}>
                <MenuItem value={'TEXT'}>Text</MenuItem>
                <MenuItem value={'TIMELINE'}>Timeline</MenuItem>
                <MenuItem value={'STATUS'}>Status</MenuItem>
                <MenuItem value={'PERSON'}>People</MenuItem>
                <MenuItem value={'DATE'}>Date</MenuItem>
                <MenuItem value={'NUMBER'}>Numbers</MenuItem>
                <MenuItem value={'CHECKBOX'}>Checkbox</MenuItem>
                <MenuItem value={'TAGS'}>Tags</MenuItem>
                <MenuItem value={'FILES'}>Files</MenuItem>
                <MenuItem value={'LINK'}>Link</MenuItem>
                <MenuItem value={'PROGRESS'}>Progress</MenuItem>
              </Select>
            </FormControl>
            <div className='flex justify-end gap-2'>
              <Button variant='outlined' color='secondary' onClick={onClose}>
                Cancel
              </Button>
              <Button variant='contained' onClick={handleCreate}>
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      </Modal>
    )
  }

  const FileListPopover = ({ anchorEl, onClose, item, column, onDelete }) => {
    const open = Boolean(anchorEl)
    
    const cellValue = (item?.values || []).find(v => normalizeId(v.columnId) === normalizeId(column?.columnId))?.value

    const files = useMemo(() => {
      if (!cellValue) return []

      return cellValue.split(',').map(url => {
        try {
          const decodedUrl = decodeURIComponent(url)
          const filename = decodedUrl.split('/').pop().substring(decodedUrl.indexOf('_') + 1) // Removed timestamp prefix logic if it exists
          return { url, name: filename || 'File' }
        } catch (e) {
          return { url, name: 'File' }
        }
      })
    }, [cellValue])

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, width: 300, maxHeight: 300, overflowY: 'auto' }}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
            Attached Files
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {files.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>No files attached</Typography>
          ) : (
            <List dense disablePadding>
              {files.map((file, i) => (
                <ListItem
                  key={i}
                  disablePadding
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      size="small" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete(file.url)
                      }}
                      sx={{ color: 'error.main', opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'error.lighter' } }}
                    >
                      <i className='tabler-trash text-sm' />
                    </IconButton>
                  }
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5, 
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemButton
                    component='a'
                    href={file.url}
                    target='_blank'
                    rel='noopener'
                    sx={{ borderRadius: 1, pr: 5 }} // Padding for delete button
                  >
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <i className='tabler-file text-lg' />
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      primaryTypographyProps={{ variant: 'body2', noWrap: true, title: file.name }} 
                    />
                    <i className='tabler-external-link text-xs text-textDisabled ml-1' />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    )
  }




  const ColumnVisibilityPopover = ({ anchorEl, onClose, allColumns, hiddenIds, onToggle }) => {
    const open = Boolean(anchorEl)

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 250, maxHeight: 400, overflowY: 'auto' }}>
          <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold' }}>
            Show/Hide Columns
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <FormGroup>
            {allColumns.map(col => {
              const isHidden = hiddenIds.includes(col.columnId)

              return (
                <FormControlLabel
                  key={col.columnId}
                  control={<Checkbox checked={!isHidden} onChange={() => onToggle(col.columnId)} size='small' />}
                  label={<span className='text-sm truncate max-w-[150px] block'>{col.columnName}</span>}
                />
              )
            })}
          </FormGroup>
        </Box>
      </Popover>
    )
  }

  const FilterPopover = ({ anchorEl, onClose, columns, filters, setFilters }) => {
    const open = Boolean(anchorEl)

    const operators = [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
      { value: 'is', label: 'Is' },
      { value: 'is_not', label: 'Is not' },
      { value: 'starts_with', label: 'Starts with' },
      { value: 'ends_with', label: 'Ends with' },
      { value: 'is_empty', label: 'Is empty' },
      { value: 'is_not_empty', label: 'Is not empty' }
    ]

    const handleAddFilter = () =>
      setFilters([...filters, { id: Date.now(), columnId: '', operator: 'contains', value: '' }])

    const handleRemoveFilter = id => setFilters(filters.filter(f => f.id !== id))

    const handleFilterChange = (id, field, value) =>
      setFilters(filters.map(f => (f.id === id ? { ...f, [field]: value } : f)))

    const handleClearAll = () => setFilters([])

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 600, p: 0, borderRadius: 2 } }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='subtitle1' fontWeight='bold'>
            Advanced filters
          </Typography>
          <Box>
            <Button size='small' onClick={handleClearAll} sx={{ mr: 1, textTransform: 'none', color: 'text.secondary' }}>
              Clear all
            </Button>
          </Box>
        </Box>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filters.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
              No filters applied. Click Add new filter to start.
            </Typography>
          ) : (
            filters.map((filter, index) => (
              <Box key={filter.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant='body2' sx={{ width: 50, color: 'text.secondary', fontWeight: 'medium' }}>
                  {index === 0 ? 'Where' : 'And'}
                </Typography>
                <FormControl size='small' sx={{ width: 150 }}>
                  <Select
                    value={filter.columnId}
                    onChange={e => handleFilterChange(filter.id, 'columnId', e.target.value)}
                    displayEmpty
                    renderValue={selected => {
                      if (!selected) return <span className='text-gray-400'>Column</span>
                      if (selected === 'item_title') return 'Item Name'

                      return columns.find(c => c.columnId === selected)?.columnName || 'Unknown'
                    }}
                  >
                    <MenuItem value='item_title'>Item Name</MenuItem>
                    {columns.map(col => (
                      <MenuItem key={col.columnId} value={col.columnId}>
                        {col.columnName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size='small' sx={{ width: 150 }}>
                  <Select
                    value={filter.operator}
                    onChange={e => handleFilterChange(filter.id, 'operator', e.target.value)}
                  >
                    {operators.map(op => (
                      <MenuItem key={op.value} value={op.value}>
                        {op.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size='small'
                  placeholder='Value'
                  value={filter.value}
                  onChange={e => handleFilterChange(filter.id, 'value', e.target.value)}
                  sx={{ flex: 1 }}
                  disabled={filter.operator === 'is_empty' || filter.operator === 'is_not_empty'}
                />
                <IconButton size='small' onClick={() => handleRemoveFilter(filter.id)}>
                  <i className='tabler-x' />
                </IconButton>
              </Box>
            ))
          )}
          <Button
            startIcon={<i className='tabler-plus' />}
            onClick={handleAddFilter}
            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
          >
            Add new filter
          </Button>
        </Box>
      </Popover>
    )
  }

  const SortPopover = ({ anchorEl, onClose, columns, sortConfig, onSortChange }) => {
    const open = Boolean(anchorEl)

    const sortOptions = [
      { id: 'item_title', label: 'Item Name', icon: 'tabler-t' },
      ...columns.map(col => {
        let icon = 'tabler-t'

        if (col.columnType === 'STATUS') icon = 'tabler-progress-check'
        if (col.columnType === 'DATE') icon = 'tabler-calendar'
        if (col.columnType === 'NUMBER') icon = 'tabler-hash'
        if (col.columnType === 'PERSON') icon = 'tabler-users'

        return { id: col.columnId, label: col.columnName, icon }
      })
    ]

    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 320, p: 2, borderRadius: 2 } }}
      >
        <div className='flex justify-between items-center mb-3'>
          <Typography variant='subtitle2' fontWeight='bold' className='flex items-center gap-1'>
            Sort by <i className='tabler-help-circle text-textDisabled text-xs' />
          </Typography>
          {sortConfig.columnId && (
            <Button
              size='small'
              variant='text'
              color='error'
              onClick={() => onSortChange(null, 'asc')}
              className='!text-xs !min-w-0 !p-1'
            >
              Clear
            </Button>
          )}
        </div>
        <div className='flex gap-2'>
          <FormControl fullWidth size='small'>
            <Select
              value={sortConfig.columnId || ''}
              displayEmpty
              onChange={e => onSortChange(e.target.value, sortConfig.direction)}
              renderValue={selected => {
                if (!selected) return <span className='text-gray-400'>Choose column</span>
                const opt = sortOptions.find(o => String(o.id) === String(selected))

                return opt ? opt.label : selected
              }}
            >
              <MenuItem disabled value=''>
                <em>Choose column</em>
              </MenuItem>
              {sortOptions.map(option => (
                <MenuItem key={option.id} value={option.id}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <i className={`${option.icon} text-textSecondary`} />
                  </ListItemIcon>
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ minWidth: 110 }}>
            <Select value={sortConfig.direction} onChange={e => onSortChange(sortConfig.columnId, e.target.value)}>
              <MenuItem value='asc'>Ascending</MenuItem>
              <MenuItem value='desc'>Descending</MenuItem>
            </Select>
          </FormControl>
        </div>
        <Typography variant='caption' className='mt-2 block text-textDisabled text-center'>
          Sorts items within their groups
        </Typography>
      </Popover>
    )
  }

  const SaveTemplateDialog = ({ open, onClose, onSave }) => {
    const [templateName, setTemplateName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
      if (!templateName.trim()) return
      setIsSaving(true)
      await onSave(templateName)
      setIsSaving(false)
      setTemplateName('')
    }

    return (
      <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2, color: 'text.secondary' }}>
            This will save the current column structure and their positions.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label='Template Name'
            variant='outlined'
            size='small'
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleSave} variant='contained' disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // =================================================================
  // MAIN TABLEVIEW COMPONENT (OPTIMISTIC UI ENABLED WITH PERSISTENCE FIX)
  // =================================================================
  export default function TableView({ board, searchQuery }) {
    const { mutate } = useSWRConfig()
    const boardApiEndpoint = `/api/boards/${board.boardId}` // Cache Key

    // --- STATES ---
    const [boardActionsAnchor, setBoardActionsAnchor] = useState(null)
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

    const [newItemTitle, setNewItemTitle] = useState('')
    const [activeNewItemInput, setActiveNewItemInput] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [editingCell, setEditingCell] = useState(null)
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
    const [editingGroupName, setEditingGroupName] = useState(null)
    const [editingTaskName, setEditingTaskName] = useState(null)
    const [editingTextValue, setEditingTextValue] = useState(null)
    const [menuAnchor, setMenuAnchor] = useState({ anchorEl: null, type: null, id: null })
    const [addColumnMenuAnchor, setAddColumnMenuAnchor] = useState(null)
    const isAddColumnMenuOpen = Boolean(addColumnMenuAnchor)
    const [selectedColumnType, setSelectedColumnType] = useState('TEXT')
    const [columnMenuAnchor, setColumnMenuAnchor] = useState(null)
    const [activeColumn, setActiveColumn] = useState(null)
    const [groups, setGroups] = useState(board?.groups || [])
    const [filesPopover, setFilesPopover] = useState({ anchorEl: null, item: null, column: null })
    const [tagsPopover, setTagsPopover] = useState({ anchorEl: null, item: null, column: null })
    const [manageTagsDialog, setManageTagsDialog] = useState({ open: false, column: null })
    const [calcMenuAnchor, setCalcMenuAnchor] = useState(null)
    const [activeCalcColumn, setActiveCalcColumn] = useState(null)
    const [progressSettingsModal, setProgressSettingsModal] = useState({ open: false, column: null })
    const [timelinePopover, setTimelinePopover] = useState({ anchorEl: null, item: null, column: null })
    const [fileListPopover, setFileListPopover] = useState({ anchorEl: null, item: null, column: null })
    const [hiddenColumnIds, setHiddenColumnIds] = useState([])
    const [visMenuAnchor, setVisMenuAnchor] = useState(null)
    const [selectedTaskIds, setSelectedTaskIds] = useState([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [filters, setFilters] = useState([])
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null)
    const [sortAnchor, setSortAnchor] = useState(null)
    const [sortConfig, setSortConfig] = useState({ columnId: null, direction: 'asc' })
    const [expandedItemIds, setExpandedItemIds] = useState([])
    const [collapsedGroups, setCollapsedGroups] = useState(() => {
      if (!board?.groups) return []
      return board.groups.filter(g => g.bitCollapsed === 1).map(g => g.groupId)
    })

    const [columnWidths, setColumnWidths] = useState({})
    const resizingRef = useRef({ isResizing: false, columnId: null, startX: 0, startWidth: 0 })
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

    // --- FILE UPLOAD HANDLERS ---
    const fileInputRef = useRef(null)
    const [uploadTarget, setUploadTarget] = useState({ item: null, column: null })

    const handleDirectFileChange = async event => {
        const file = event.target.files[0]
        if (!file || !uploadTarget.item || !uploadTarget.column) return
    
        const formData = new FormData()
        formData.append('file', file)
    
        try {
          const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
    
          if (!uploadResponse.ok) throw new Error('Upload failed')
          const result = await uploadResponse.json()
          
          const cellValue = (uploadTarget.item?.values || []).find(v => normalizeId(v.columnId) === normalizeId(uploadTarget.column?.columnId))?.value
          const newValue = cellValue ? `${cellValue},${result.url}` : result.url
    
          await handleUpdateValue(uploadTarget.item, uploadTarget.column, newValue)
        } catch (error) {
          console.error('File upload error:', error)
          alert('Gagal mengunggah file.')
        } finally {
          setUploadTarget({ item: null, column: null })
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // --- COLUMN RESIZING HANDLERS ---
    const handleColumnResizeStart = useCallback((e, columnId, currentWidth) => {
        e.preventDefault()
        e.stopPropagation()
        
        const startX = e.clientX
        const startWidth = currentWidth || 200
        
        resizingRef.current = {
          isResizing: true,
          columnId,
          startX,
          startWidth,
          lastWidth: startWidth
        }
        
        document.body.style.cursor = 'col-resize'
        
        const onMouseMove = (moveEvent) => {
            if (!resizingRef.current.isResizing) return
            
            const diff = moveEvent.clientX - resizingRef.current.startX
            const newWidth = Math.max(50, resizingRef.current.startWidth + diff)
            
            resizingRef.current.lastWidth = newWidth
            setColumnWidths(prev => ({ ...prev, [resizingRef.current.columnId]: newWidth }))
        }
        
        const onMouseUp = async () => {
            const { columnId, lastWidth } = resizingRef.current
            
            if (columnId && lastWidth) {
                try {
                    await fetch(`/api/columns/${columnId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ width: lastWidth })
                    })
                } catch (err) {
                    console.error('Failed to save column width:', err)
                }
            }
            
            resizingRef.current = { isResizing: false, columnId: null, startX: 0, startWidth: 0, lastWidth: 0 }
            document.body.style.cursor = ''
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
        
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }, [])

    const toggleGroupCollapse = async groupId => {
      const isCollapsing = !collapsedGroups.includes(groupId)
      const newCollapsed = isCollapsing
        ? [...collapsedGroups, groupId]
        : collapsedGroups.filter(id => id !== groupId)

      setCollapsedGroups(newCollapsed)

      // Optimistic update for board groups (if needed elsewhere)
      const newGroups = groups.map(g => 
        g.groupId === groupId ? { ...g, bitCollapsed: isCollapsing ? 1 : 0 } : g
      )
      // We don't necessarily need to trigger a full SWR revalidation for this UI state,
      // but keeping local state in sync is good.
      // await updateOptimisticGroups(newGroups) // Optional: might cause flicker if revalidating

      try {
        await fetch(`/api/groups/${groupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bitCollapsed: isCollapsing ? 1 : 0 })
        })
      } catch (error) {
        console.error('Failed to update group collapse state:', error)
      }
    }

    const allTaskIds = useMemo(() => groups.flatMap(group => group.items.map(item => item.taskId)), [groups])

    // Initial Sync from Props
    useEffect(() => {
      setGroups(board?.groups || [])
    }, [board])

    const initialColumnsForDnD = useMemo(() => {
      if (!board?.columns) return []

      return [...board.columns]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.columnId - b.columnId)
        .map(c => ({ 
          ...c,
          width: c.width || 200 // Use DB width or default
        }))
    }, [board?.columns])
    const headerColumnsRef = useRef(initialColumnsForDnD)
    

    const [headerRef, headerColumns, setHeaderColumns] = useDragAndDrop(initialColumnsForDnD, {
      plugins: [
        animations()
      ],
      dragHandle: '.col-handle',
      draggable: el => el.classList?.contains('table-column-draggable'),
      handleEnd: async data => {
        if (!board?.boardId) return

        // Use the ref to get the current state which should be sorted
        const newColumns = headerColumnsRef.current.map((col, index) => ({
          columnId: col.columnId,
          sortOrder: index + 1
        }))

        // console.log('Saving new column order:', newColumns)

        try {
          await fetch(`/api/boards/${board.boardId}/columns/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columns: newColumns })
          })
        } catch (error) {
          console.error('Failed to save column order:', error)
        }
      }
    })

    useEffect(() => {
      headerColumnsRef.current = headerColumns
    }, [headerColumns])


    const visibleColumns = useMemo(
      () => headerColumns.filter(c => !hiddenColumnIds.includes(c.columnId)),
      [headerColumns, hiddenColumnIds]
    )

    useEffect(() => setHeaderColumns(initialColumnsForDnD), [initialColumnsForDnD, setHeaderColumns])

    const processedGroups = useMemo(() => {
      const filteredData = groups.map(group => {
        const filteredItems = group.items.filter(item => {
          // --- SEARCH FILTER ---
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const titleMatch = (item.taskTitle || '').toLowerCase().includes(query)
            if (!titleMatch) return false
          }

          return filters.every(filter => {
            if (!filter.columnId) return true
            let itemValue = ''

            if (filter.columnId === 'item_title') itemValue = item.taskTitle || ''
            else {
              const valObj = item.values.find(v => normalizeId(v.columnId) === normalizeId(filter.columnId))

              itemValue = valObj ? valObj.value : ''

              const colDef = board.columns.find(c => normalizeId(c.columnId) === normalizeId(filter.columnId))
              if (colDef && colDef.columnType === 'PERSON' && itemValue) {
                const users = parsePersonValue(itemValue, board)
                itemValue = users.map(u => u.userName || u.name).join(', ')
              }
            }

            const filterVal = filter.value ? filter.value.toLowerCase() : ''
            const strItemValue = String(itemValue).toLowerCase()

            switch (filter.operator) {
              case 'contains':
                return strItemValue.includes(filterVal)
              case 'not_contains':
                return !strItemValue.includes(filterVal)
              case 'is':
                return strItemValue === filterVal
              default:
                return true
            }
          })
        })

        return { ...group, items: filteredItems }
      })

      if (!sortConfig.columnId) return filteredData

      return filteredData.map(group => {
        const sortedItems = [...group.items].sort((a, b) => {
          let valA = '',
            valB = ''

          if (sortConfig.columnId === 'item_title') {
            valA = a.taskTitle || ''
            valB = b.taskTitle || ''
          } else {
            const vA = a.values.find(val => normalizeId(val.columnId) === normalizeId(sortConfig.columnId))

            valA = vA ? vA.value : ''
            const vB = b.values.find(val => normalizeId(val.columnId) === normalizeId(sortConfig.columnId))

            valB = vB ? vB.value : ''
          }

          return sortConfig.direction === 'asc'
            ? String(valA).localeCompare(String(valB))
            : -String(valA).localeCompare(String(valB))
        })

        return { ...group, items: sortedItems }
      })
    }, [groups, filters, sortConfig, board.columns, searchQuery])

    // --- NEW: GLOBAL OPTIMISTIC UPDATE HELPER ---
    // Fungsi ini memperbarui State Lokal DAN Cache SWR secara bersamaan.
    // Ini kunci agar data tidak hilang saat pindah view.
    const updateOptimisticGroups = async newGroups => {
      // 1. Update State Lokal (Agar UI responsif)
      setGroups(newGroups)

      // 2. Update Cache SWR (Agar data tersimpan di memori app, aman saat unmount)
      // revalidate: false artinya jangan fetch ke server dulu, percaya saja pada data lokal kita
      await mutate(boardApiEndpoint, { ...board, groups: newGroups }, { revalidate: false })
    }

    // --- OPTIMISTIC HANDLERS ---

    // 1. CREATE TASK
    const handleCreateTask = async groupId => {
      const tempId = Date.now()
      const optimisticTask = { taskId: tempId, taskTitle: newItemTitle || 'New Item', values: [], subItems: [] }

      const newGroups = groups.map(g => (g.groupId === groupId ? { ...g, items: [...g.items, optimisticTask] } : g))

      // UPDATE OPTIMISTIK
      await updateOptimisticGroups(newGroups)

      setNewItemTitle('')
      setActiveNewItemInput(null)

      try {
        await fetch(`/api/groups/${groupId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txtTaskTitle: optimisticTask.taskTitle })
        })
        mutate(boardApiEndpoint) // Revalidate agar dapat ID asli dari server
      } catch (e) {
        console.error(e)
      }
    }

    // 2. CREATE GROUP
    const handleCreateGroup = async () => {
      const tempGroup = { groupId: Date.now(), groupName: 'New Group', groupColor: '#579bfc', items: [] }
      const newGroups = [...groups, tempGroup]

      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/boards/${board.boardId}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txtGroupName: 'New Group' })
        })
        mutate(boardApiEndpoint)
      } catch (e) {
        console.error(e)
      }
    }

    // 3. CREATE SUBITEM
    const handleCreateSubitem = async (parentTaskId, title) => {
      const tempSub = { taskId: Date.now(), taskTitle: title, values: [] }

      const newGroups = groups.map(g => ({
        ...g,
        items: g.items.map(i => (i.taskId === parentTaskId ? { ...i, subItems: [...(i.subItems || []), tempSub] } : i))
      }))

      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/tasks/${parentTaskId}/subitems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title })
        })
        mutate(boardApiEndpoint)
      } catch (e) {
        console.error(e)
      }
    }

    // 4. DELETE SUBITEM
    const handleDeleteSubitem = async (parentTaskId, subitemId) => {
      const newGroups = groups.map(group => ({
        ...group,
        items: group.items.map(item => {
          if (item.taskId === parentTaskId)
            return { ...item, subItems: item.subItems ? item.subItems.filter(sub => sub.taskId !== subitemId) : [] }

          return item
        })
      }))

      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/tasks/${subitemId}`, { method: 'DELETE' })
        mutate(boardApiEndpoint)
      } catch (error) {
        console.error(error)
      }
    }

    // 5. GENERAL UPDATE (Values & Title & Timeline & CHECKBOX) - UPDATED FOR PERSISTENCE
    const handleGeneralUpdate = async (itemToUpdate, columnOrType, newValue) => {
      const isTitle = columnOrType.columnType === 'TITLE'

      // Buat deep copy dari groups baru
      const newGroups = groups.map(g => ({
        ...g,
        items: g.items.map(i => {
          // Helper logic
          const updateItemLogic = currentItem => {
            if (isTitle) return { ...currentItem, taskTitle: newValue }

            const colId = Number(columnOrType.columnId)
            const existing = currentItem.values.find(v => normalizeId(v.columnId) === normalizeId(colId))

            const newValues = existing
              ? currentItem.values.map(v =>
                  normalizeId(v.columnId) === normalizeId(colId) ? { ...v, value: String(newValue) } : v
                )
              : [...(currentItem.values || []), { columnId: colId, value: String(newValue) }]

            return { ...currentItem, values: newValues }
          }

          if (i.taskId === itemToUpdate.taskId) return updateItemLogic(i)

          if (i.subItems) {
            const subFound = i.subItems.find(s => s.taskId === itemToUpdate.taskId)

            if (subFound) {
              return {
                ...i,
                subItems: i.subItems.map(s => (s.taskId === itemToUpdate.taskId ? updateItemLogic(s) : s))
              }
            }
          }

          return i
        })
      }))

      // KUNCI PERBAIKAN: Update Cache Global + State Lokal
      await updateOptimisticGroups(newGroups)

      // API Call Background
      try {
        if (isTitle) {
          await fetch(`/api/tasks/${itemToUpdate.taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskTitle: newValue })
          })
        } else {
          await fetch(`/api/tasks/${itemToUpdate.taskId}/values`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intColumn_ID: Number(columnOrType.columnId), txtValue: String(newValue) })
          })
        }

        // Revalidate cache agar konsisten dengan server (tapi user sudah melihat data baru dari updateOptimisticGroups)
        // Kita panggil mutate tanpa data, untuk memicu re-fetch dari server di background
        mutate(boardApiEndpoint)
      } catch (e) {
        console.error(e)
        mutate(boardApiEndpoint) // Rollback jika error
      }
    }

    // Wrapper for consistency
    const handleUpdateValue = (item, col, val) => handleGeneralUpdate(item, col, val)

    // --- NEW: COLUMN & ROW MOVEMENT HANDLERS ---
    const handleMoveColumn = async (direction, colId) => {
      const currentIndex = headerColumns.findIndex(c => c.columnId === colId)
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1

      if (targetIndex >= 0 && targetIndex < headerColumns.length) {
        const newColumns = [...headerColumns]
        const [movedCol] = newColumns.splice(currentIndex, 1)
        newColumns.splice(targetIndex, 0, movedCol)

        setHeaderColumns(newColumns)

        const reorderPayload = newColumns.map((col, index) => ({
          columnId: col.columnId,
          sortOrder: index + 1
        }))

        try {
          await fetch(`/api/boards/${board.boardId}/columns/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columns: reorderPayload })
          })
          mutate(boardApiEndpoint)
        } catch (error) {
          console.error('Failed to move column:', error)
        }
      }
    }

    const handleMoveRow = async (direction, taskId, groupId) => {
      const group = groups.find(g => g.groupId === groupId)
      if (!group) return
      const items = group.items
      const currentIndex = items.findIndex(i => i.taskId === taskId)
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (targetIndex >= 0 && targetIndex < items.length) {
        const newGroups = groups.map(g => {
          if (g.groupId === groupId) {
            const newItems = [...g.items]
            const [movedItem] = newItems.splice(currentIndex, 1)
            newItems.splice(targetIndex, 0, movedItem)
            return { ...g, items: newItems }
          }
          return g
        })

        await updateOptimisticGroups(newGroups)

        try {
          await fetch(`/api/tasks/${taskId}/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetIndex, groupId })
          })
          mutate(boardApiEndpoint)
        } catch (error) {
          console.error('Failed to move row:', error)
          mutate(boardApiEndpoint) // Rollback on failure
        }
      }
    }

    // 6. RENAME TASK
    const handleUpdateTaskTitle = (taskId, newTitle) => {
      setEditingTaskName(null)
      handleGeneralUpdate({ taskId }, { columnType: 'TITLE' }, newTitle)
    }

    // 7. RENAME GROUP
    const handleUpdateGroupName = async (groupId, newName) => {
      const newGroups = groups.map(g => (g.groupId === groupId ? { ...g, groupName: newName } : g))

      setEditingGroupName(null)
      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/groups/${groupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupName: newName })
        })
      } catch (e) {
        console.error(e)
      }
    }

    const handleUpdateGroupColor = async (groupId, newColor) => {
      const newGroups = groups.map(g => (g.groupId === groupId ? { ...g, groupColor: newColor } : g))
      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/groups/${groupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupColor: newColor })
        })
      } catch (e) {
        console.error(e)
      }
    }

    // 8. DELETE TASK
    const handleDeleteTask = async taskId => {
      setMenuAnchor({ anchorEl: null })
      const newGroups = groups.map(g => ({ ...g, items: g.items.filter(i => i.taskId !== taskId) }))

      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
        mutate(boardApiEndpoint)
      } catch (e) {
        console.error(e)
      }
    }

    // 9. DELETE GROUP
    const handleDeleteGroup = async groupId => {
      setMenuAnchor({ anchorEl: null })
      const newGroups = groups.filter(g => g.groupId !== groupId)

      await updateOptimisticGroups(newGroups)

      try {
        await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
        mutate(boardApiEndpoint)
      } catch (e) {
        console.error(e)
      }
    }

    const handleBulkDelete = async () => {
      if (selectedTaskIds.length === 0) return
      if (!confirm(`Delete ${selectedTaskIds.length} items?`)) return

      setIsBulkDeleting(true)
      const backupGroups = structuredClone(groups) // Backup for revert
      const newGroups = groups.map(g => ({ ...g, items: g.items.filter(i => !selectedTaskIds.includes(i.taskId)) }))

      // Optimistic Update
      await updateOptimisticGroups(newGroups)
      setSelectedTaskIds([])

      try {
        await Promise.all(selectedTaskIds.map(id => fetch(`/api/tasks/${id}`, { method: 'DELETE' })))
        mutate(boardApiEndpoint)
      } catch (error) {
        setGroups(backupGroups) // Revert on error manually or fetch
        mutate(boardApiEndpoint)
        alert('Failed delete.')
      } finally {
        setIsBulkDeleting(false)
      }
    }

    const handleToggleSelectAll = () => {
      selectedTaskIds.length === allTaskIds.length ? setSelectedTaskIds([]) : setSelectedTaskIds(allTaskIds)
    }

    const handleToggleSelectRow = taskId => {
      setSelectedTaskIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
    }

    const toggleExpandItem = taskId => {
      setExpandedItemIds(prev => (prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]))
    }

    const handleCreateColumn = async columnData => {
      try {
        const res = await fetch(`/api/boards/${board.boardId}/columns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columnData)
        })

        if (res.ok) mutate(boardApiEndpoint)
      } catch (e) {
      } finally {
        setIsColumnModalOpen(false)
      }
    }

    const handleSaveTextValue = () => {
      if (!editingTextValue) return
      handleUpdateValue(editingTextValue.item, editingTextValue.column, editingTextValue.currentValue)
      setEditingTextValue(null)
    }

    const handleCellClick = (event, item, column) => {
      if (column.columnName.toLowerCase() === 'item') setSelectedItem(item)
      else if (['TEXT', 'LINK', 'NUMBER'].includes(column.columnType)) {
        const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(column.columnId))

        setEditingTextValue({
          taskId: item.taskId,
          columnId: column.columnId,
          item: item,
          column: column,
          currentValue: cellValue?.value || ''
        })
      } else if (['STATUS', 'PERSON', 'DATE'].includes(column.columnType))
        setEditingCell({ anchorEl: event.currentTarget, item, column })
      else if (column.columnType === 'FILES') {
        setUploadTarget({ item, column })
        setTimeout(() => fileInputRef.current?.click(), 0)
      }
      else if (column.columnType === 'TIMELINE')
        setTimelinePopover({ anchorEl: event.currentTarget, item: item, column: column })
      else if (column.columnType === 'TAGS') setTagsPopover({ anchorEl: event.currentTarget, item: item, column: column })
    }

    const handleModifyColumnOptions = async (columnId, action, payload, originalPayload = null) => {
      setHeaderColumns(prev =>
        prev.map(col => {
          if (col.columnId === columnId) {
            const currentOptions = col.options || []

            if (action === 'ADD') {
              if (currentOptions.some(o => o.label === payload.label)) return col

              return { ...col, options: [...currentOptions, payload] }
            }

            if (action === 'UPDATE') {
              const targetIdentifier = payload.id || (originalPayload ? originalPayload.label : payload.label)

              return { ...col, options: currentOptions.map(o => ((o.id || o.label) === targetIdentifier ? payload : o)) }
            }

            if (action === 'DELETE') {
              return { ...col, options: currentOptions.filter(o => (o.id || o.label) !== (payload.id || payload.label)) }
            }
          }

          return col
        })
      )

      const updatedColumn = headerColumns.find(c => c.columnId === columnId)
      let newOptions = updatedColumn?.options || []

      if (action === 'ADD') newOptions = [...newOptions, payload]

      if (action === 'UPDATE') {
        const targetIdentifier = payload.id || (originalPayload ? originalPayload.label : payload.label)

        newOptions = newOptions.map(o => ((o.id || o.label) === targetIdentifier ? payload : o))
      }

      if (action === 'DELETE') newOptions = newOptions.filter(o => (o.id || o.label) !== (payload.id || payload.label))

      try {
        await fetch(`/api/columns/${columnId}/options`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ options: newOptions })
        })
      } catch (e) {
        console.error(e)
      }
    }

    const handleSaveAsTemplate = async name => {
      try {
        // 1. Determine Source Columns
        let sourceColumns = headerColumns

        // Fallback: If drag-and-drop state is empty, use the original board columns
        if (!sourceColumns || sourceColumns.length === 0) {
          console.warn('headerColumns is empty, falling back to board.columns')
          sourceColumns = board?.columns || []
        }

        // 2. Validation
        if (sourceColumns.length === 0) {
          alert('No columns found to save.')

          return
        }

        // 3. Map Data
        const columnsToSave = sourceColumns.map((col, index) => ({
          columnName: col.columnName,
          columnType: col.columnType,
          options: col.options || [],
          width: col.width || 150, // Default width
          sortOrder: index,
          calculationType: col.calculationType || null,
          unit: col.unit || null
        }))

        // 4. API Call
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            columns: columnsToSave
          })
        })

        if (!response.ok) throw new Error('Failed to save')

        alert('Template saved successfully!')
        setIsTemplateModalOpen(false)
      } catch (error) {
        console.error(error)
        alert('Error saving template')
      }
    }

    const handleOpenAddColumnMenu = event => setAddColumnMenuAnchor(event.currentTarget)
    const handleCloseAddColumnMenu = () => setAddColumnMenuAnchor(null)

    const handleColumnTypeSelect = type => {
      handleCloseAddColumnMenu()
      setSelectedColumnType(type)
      setIsColumnModalOpen(true)
    }

    const openColumnMenu = (event, column) => {
      setColumnMenuAnchor({ anchorEl: event.currentTarget, column })
      setActiveColumn(column)
    }

    const closeColumnMenu = () => {
      setColumnMenuAnchor(null)
      setActiveColumn(null)
    }

    const handleRenameColumn = async () => {
      if (!activeColumn) return
      const newName = prompt('Rename:', activeColumn.columnName)

      if (!newName) return
      await fetch(`/api/columns/${activeColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtColumnName: newName.trim() })
      })
      setHeaderColumns(cols => cols.map(c => (c.columnId === activeColumn.columnId ? { ...c, columnName: newName } : c)))
      closeColumnMenu()
    }

    const handleDeleteColumn = async () => {
      if (!activeColumn || !confirm('Delete column?')) return
      await fetch(`/api/columns/${activeColumn.columnId}`, { method: 'DELETE' })
      setHeaderColumns(cols => cols.filter(c => c.columnId !== activeColumn.columnId))
      closeColumnMenu()
    }

    const handleDuplicateColumn = async () => {
      if (!activeColumn) return
      await fetch(`/api/boards/${board.boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txtColumnName: `${activeColumn.columnName} (Copy)`,
          txtColumnType: activeColumn.columnType
        })
      })
      closeColumnMenu()
      mutate(boardApiEndpoint)
    }

    const handleAddColumnToRight = async () => {
      await handleCreateColumn({ txtColumnName: 'New Column', txtColumnType: 'TEXT' })
      closeColumnMenu()
    }

    const handleChangeColumnType = async () => {
      if (!activeColumn) return
      const next = prompt(`Change type:`, activeColumn.columnType)

      if (!next) return
      await fetch(`/api/columns/${activeColumn.columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtColumnType: next })
      })
      closeColumnMenu()
      mutate(boardApiEndpoint)
    }

    const handleToggleColumnVisibility = columnId => {
      setHiddenColumnIds(prev => (prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]))
    }

    const handleHideColumn = () => {
      if (activeColumn) {
        handleToggleColumnVisibility(activeColumn.columnId)
        closeColumnMenu()
      }
    }

    const handleOpenCalcMenu = (event, column) => {
      setCalcMenuAnchor(event.currentTarget)
      setActiveCalcColumn(column)
    }

    const handleCloseCalcMenu = () => {
      setCalcMenuAnchor(null)
      setActiveCalcColumn(null)
    }

    /* DND Handlers */
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8
        }
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    )

    const handleDragEnd = async (event) => {
      const { active, over } = event
      
      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)

      // GROUP REORDERING
      if (activeId.startsWith('group-') && overId.startsWith('group-')) {
          const oldIndex = groups.findIndex(g => `group-${g.groupId}` === activeId)
          const newIndex = groups.findIndex(g => `group-${g.groupId}` === overId)

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              const newGroups = arrayMove(groups, oldIndex, newIndex)
              
              // Optimistic update
              updateOptimisticGroups(newGroups)
              
              // API Call
              try {
                  const groupIds = newGroups.map(g => g.groupId)
                  await fetch(`/api/boards/${board.boardId}/groups/reorder`, {
                      method: 'PUT',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ groupIds })
                  })
              } catch (e) {
                 console.error(e)
                 mutate(boardApiEndpoint)
              }
          }
          return
      }

      if (active.id !== over?.id) {
        // Find source group and items
        let sourceGroup = board.groups.find(g => g.items.find(i => i.taskId === active.id))
        let destGroup = board.groups.find(g => g.items.find(i => i.taskId === over.id))

        // Logic for same-group reordering
        if (sourceGroup && destGroup && sourceGroup.groupId === destGroup.groupId) {
            const oldIndex = sourceGroup.items.findIndex(i => i.taskId === active.id)
            const newIndex = sourceGroup.items.findIndex(i => i.taskId === over.id)
            
            if (oldIndex !== -1 && newIndex !== -1) {
              // Optimistic update
              const newItems = arrayMove(sourceGroup.items, oldIndex, newIndex)
              
              // Update local state (deep clone to avoid mutation issues if any)
              const newGroups = board.groups.map(g => {
                if (g.groupId === sourceGroup.groupId) {
                  return { ...g, items: newItems }
                }
                return g
              })
              
              mutate(boardApiEndpoint, { ...board, groups: newGroups }, false) // false = no revalidate yet

              // API Call
              await fetch(`/api/tasks/${active.id}/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  targetIndex: newIndex, 
                  groupId: sourceGroup.groupId 
                })
              }).catch(e => {
                console.error('Reorder failed', e)
                mutate(boardApiEndpoint) // Revert on failure
              })
              
            }
        }
      }
    }

    const handleSelectCalcSetting = async (type, value) => {
      if (!activeCalcColumn) return
      const payload = type === 'calc' ? { txtCalculationType: value } : { txtUnit: value }
      const updatedCol = { ...activeCalcColumn, [type === 'calc' ? 'calculationType' : 'unit']: value }

      setHeaderColumns(prev => prev.map(c => (c.columnId === activeCalcColumn.columnId ? updatedCol : c)))
      handleCloseCalcMenu()

      try {
        await fetch(`/api/columns/${activeCalcColumn.columnId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } catch (e) {}
    }

    const handleSaveProgressSettings = async data => {
      setProgressSettingsModal({ open: false, column: null })
      mutate(boardApiEndpoint)
    }

    const calcOptions = ['Sum', 'Average', 'Median', 'Min', 'Max', 'Count']

    const unitOptions = [
      { label: 'None', value: null },
      { label: '$', value: '$' },
      { label: '€', value: '€' },
      { label: '£', value: '£' },
      { label: '%', value: '%' }
    ]

    const columnTypes = {
      essentials: [
        { key: 'STATUS', label: 'Status', icon: 'tabler-progress-check' },
        { key: 'TEXT', label: 'Text', icon: 'tabler-t' },
        { key: 'PERSON', label: 'People', icon: 'tabler-users' },
        { key: 'DATE', label: 'Date', icon: 'tabler-calendar' },
        { key: 'NUMBER', label: 'Numbers', icon: 'tabler-hash' }
      ],
      superUseful: [
        { key: 'TIMELINE', label: 'Timeline', icon: 'tabler-timeline' },
        { key: 'FILES', label: 'Files', icon: 'tabler-file' },
        { key: 'TAGS', label: 'Tags', icon: 'tabler-tags' },
        { key: 'LINK', label: 'Link', icon: 'tabler-link' },
        { key: 'PROGRESS', label: 'Progress', icon: 'tabler-progress' },
        { key: 'CHECKBOX', label: 'Checkbox', icon: 'tabler-checkbox' },
        { key: 'FORMULA', label: 'Formula', icon: 'tabler-variable' }
      ]
    }

    const getStatusSummary = group => {
      const statusColumnId = board.columns.find(c => c.columnName === 'Status')?.columnId

      if (!statusColumnId) return {}
      const summary = {}

      group.items.forEach(item => {
        const statusValue = (item.values || []).find(v => v.columnId === statusColumnId)?.value

        if (statusValue) summary[statusValue] = (summary[statusValue] || 0) + 1
      })

      return summary
    }

    const calculateSummary = (items, columnId, calcType) => {
      const values = items
        .map(item => {
          const cellValue = (item.values || []).find(val => normalizeId(val.columnId) === normalizeId(columnId))

          return parseFloat(cellValue?.value) || 0
        })
        .filter(v => v !== 0)

      if (values.length === 0) return 0

      switch (calcType) {
        case 'Sum':
          return values.reduce((acc, val) => acc + val, 0)
        case 'Average':
          return values.reduce((acc, val) => acc + val, 0) / values.length
        case 'Median':
          const sorted = [...values].sort((a, b) => a - b)
          const mid = Math.floor(sorted.length / 2)

          return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
        case 'Min':
          return Math.min(...values)
        case 'Max':
          return Math.max(...values)
        case 'Count':
          return values.length
        default:
          return values.reduce((acc, val) => acc + val, 0)
      }
    }

    const formatCalculation = (result, unit, calcType) => {
      let formattedResult

      if (unit === '%') formattedResult = `${result.toFixed(2)}%`
      else if (unit) formattedResult = `${unit}${new Intl.NumberFormat().format(result)}`
      else formattedResult = new Intl.NumberFormat().format(result)

      return `${calcType}: ${formattedResult}`
    }


    // --- IMPORT FUNCTIONALITY ---
    const importFileInputRef = useRef(null)
    const [isImporting, setIsImporting] = useState(false)

    const handleImportClick = () => {
      importFileInputRef.current?.click()
    }

    const handleFileChange = async event => {
      const file = event.target.files[0]
      if (!file) return

      setIsImporting(true)
      try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
          alert('Excel file appears to be empty')
          return
        }

        const response = await fetch(`/api/boards/${board.boardId}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: jsonData })
        })

        if (!response.ok) throw new Error('Import failed')

        const result = await response.json()
        alert(result.message)
        mutate(boardApiEndpoint) // Refresh board data
      } catch (error) {
        console.error('Import Error:', error)
        alert('Failed to import file')
      } finally {
        setIsImporting(false)
        event.target.value = '' // Reset input
      }
    }

    const handleExport = () => {
      if (!board || !board.groups) return

      const rows = []

      board.groups.forEach(group => {
        // Add a group header row (optional, or just list items)
        // rows.push({ 'Task Name': `[Group] ${group.groupName}` })

        group.items.forEach(item => {
          const row = {}

          // Basic Info
          row['Task Name'] = item.taskTitle

          // Dynamic Columns
          visibleColumns.forEach(col => {
            if (col.columnName === 'Item') return // Already handled as Task Name

            let cellValue = (item.values || []).find(v => v.columnId === col.columnId)?.value
            
            // Format specific column types if needed
            if (col.columnType === 'PERSON' && cellValue) {
              const users = parsePersonValue(cellValue, board)
              cellValue = users.length > 0 ? users.map(u => u.userName || u.name).join(', ') : cellValue
            }

            row[col.columnName] = cellValue || ''
          })

          rows.push(row)
        })
      })

      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Board Data')
      XLSX.writeFile(workbook, `${board.boardName} - ${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const renderHeaderRow = (isMainHeader = false) => {
      const isAllSelected = allTaskIds.length > 0 && selectedTaskIds.length === allTaskIds.length
      const isIndeterminate = selectedTaskIds.length > 0 && selectedTaskIds.length < allTaskIds.length

      return (
        <tr
          ref={isMainHeader ? headerRef : null}
          className={`bg-backgroundPaper border-b border-divider ${!isMainHeader ? 'bg-opacity-40' : ''}`}
        >
          {visibleColumns?.map(column => {
            const isItemColumn = column.columnName.toLowerCase() === 'item' || column.columnId === 'item_title'
            const currentWidth = columnWidths[column.columnId] || column.width || 200

            return (
              <th
                key={column.columnId}
                className={`p-0 text-left text-[11px] uppercase tracking-wider font-bold text-textSecondary border-r border-divider sticky ${isMainHeader ? 'top-0' : ''} ${isItemColumn ? 'left-0 z-[60] shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : 'z-20'} bg-backgroundPaper ${isMainHeader ? 'table-column-draggable' : ''} group transition-colors hover:bg-actionHover/30`}
                style={{ 
                  width: currentWidth, 
                  minWidth: currentWidth, 
                  maxWidth: currentWidth, 
                  backgroundColor: 'var(--mui-palette-background-paper)' 
                }}
              >
                <div className='flex items-center justify-between px-4 py-2.5 h-full gap-2'>
                  {isMainHeader && isItemColumn && (
                    <div className="flex items-center gap-1 mr-1">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onChange={handleToggleSelectAll}
                          size='small'
                          className='!p-0 !mr-2 opacity-60 hover:opacity-100 transition-opacity'
                        />
                        <div className="w-[1px] h-4 bg-divider mr-2"></div>
                    </div>
                  )}

                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    {isMainHeader && (
                      <div className='col-handle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-0.5 rounded hover:bg-actionHover -ml-1'>
                        <i className='tabler-grip-vertical text-sm' />
                      </div>
                    )}
                    <span className='truncate'>{column.columnName}</span>
                    {isMainHeader && (
                      <div className='flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-backgroundPaper border border-divider rounded p-0.5'>
                        <IconButton
                          size='small'
                          className='!p-0'
                          disabled={headerColumns.findIndex(c => c.columnId === column.columnId) === 0}
                          onClick={e => { e.stopPropagation(); handleMoveColumn('left', column.columnId); }}
                        >
                          <i className='tabler-chevron-left text-xs' />
                        </IconButton>
                        <IconButton
                          size='small'
                          className='!p-0'
                          disabled={headerColumns.findIndex(c => c.columnId === column.columnId) === headerColumns.length - 1}
                          onClick={e => { e.stopPropagation(); handleMoveColumn('right', column.columnId); }}
                        >
                          <i className='tabler-chevron-right text-xs' />
                        </IconButton>
                      </div>
                    )}
                  </div>

                  {isMainHeader && (
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      {/* Search / Filter for specific column */}
                      {['STATUS', 'PERSON', 'TEXT'].includes(column.columnType) && (
                         <i className='tabler-search text-sm cursor-pointer hover:text-primary transition-colors' />
                      )}
                      
                      <IconButton 
                        size='small' 
                        onClick={e => openColumnMenu(e, column)}
                        className="!p-0.5"
                      >
                        <i className='tabler-chevron-down text-sm' />
                      </IconButton>
                    </div>
                  )}
                </div>

                {isMainHeader && (
                  <div
                    className='absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-30 touch-none after:content-[""] after:absolute after:right-0 after:top-0 after:w-[1.5px] after:h-full after:bg-divider group-hover:after:bg-primary'
                    onMouseDown={e => handleColumnResizeStart(e, column.columnId, currentWidth)}
                  />
                )}
              </th>
            )
          })}
          <th className='border-r border-divider w-full bg-backgroundPaper'>
            {isMainHeader && (
              <IconButton size='small' onClick={handleOpenAddColumnMenu}>
                <i className='tabler-plus text-textSecondary' />
              </IconButton>
            )}
          </th>
        </tr>
      )
    }

    const getFreshItem = staleItem => {
      if (!staleItem) return null

      for (const g of groups) {
        const item = g.items.find(i => i.taskId === staleItem.taskId)

        if (item) return item

        for (const p of g.items) {
          if (p.subItems) {
            const sub = p.subItems.find(s => s.taskId === staleItem.taskId)

            if (sub) return sub
          }
        }
      }

      return staleItem
    }

    const getFreshColumn = staleColumn => {
      if (!staleColumn) return null

      return headerColumns.find(c => c.columnId === staleColumn.columnId) || staleColumn
    }

    return (
      <div className='relative'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2'>
          <div className='flex flex-wrap gap-3'>
            <Button
              variant={filters.length > 0 ? 'contained' : 'outlined'}
              size='small'
              startIcon={<i className='tabler-filter' />}
              onClick={e => setFilterMenuAnchor(e.currentTarget)}
              className={`!rounded-full !px-4 !border-divider ${filters.length === 0 ? '!text-textSecondary !bg-transparent' : ''}`}
            >
              Filter {filters.length > 0 && `(${filters.length})`}
            </Button>
            <Button
              variant={sortConfig.columnId ? 'contained' : 'outlined'}
              size='small'
              startIcon={<i className='tabler-arrows-sort' />}
              onClick={e => setSortAnchor(e.currentTarget)}
              className={`!rounded-full !px-4 !border-divider ${!sortConfig.columnId ? '!text-textSecondary !bg-transparent' : ''}`}
            >
              Sort {sortConfig.columnId ? '/ 1 Rule' : ''}
            </Button>
          </div>


          <div className='flex flex-wrap items-center gap-2 mt-1 sm:mt-0'>
            <Button
                variant='text'
                size='small'
                startIcon={<i className='tabler-user-plus' />}
                onClick={() => setIsInviteDialogOpen(true)}
                className='!text-primary font-bold'
            >
                Invite
            </Button>
            <Button
                variant='outlined'
                size='small'
                startIcon={<i className='tabler-layout-columns' />}
                onClick={e => setVisMenuAnchor(e.currentTarget)}
                className='!text-textSecondary !border-divider'
            >
                Columns{' '}
                {hiddenColumnIds.length > 0 && `(${headerColumns.length - hiddenColumnIds.length}/${headerColumns.length})`}
            </Button>
            <IconButton onClick={e => setBoardActionsAnchor(e.currentTarget)} size='small'>
                <i className='tabler-dots' />
            </IconButton>
          </div>
        </div>

        <Menu
            anchorEl={boardActionsAnchor}
            open={Boolean(boardActionsAnchor)}
            onClose={() => setBoardActionsAnchor(null)}
        >
            <MenuItem onClick={() => { setBoardActionsAnchor(null); setIsTemplateModalOpen(true); }}>
                <i className='tabler-template mr-2' /> Save as Template
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setBoardActionsAnchor(null); handleExport(); }}>
                <i className='tabler-file-spreadsheet mr-2' /> Export to Excel
            </MenuItem>
            <MenuItem onClick={() => { setBoardActionsAnchor(null); handleImportClick(); }}>
                {isImporting ? <CircularProgress size={16} className='mr-2' /> : <i className='tabler-file-upload mr-2' />} 
                Import from Excel
            </MenuItem>
        </Menu>

        <input
            type="file"
            ref={importFileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
            onChange={handleFileChange}
        />

        <div className='overflow-auto rounded-lg border border-divider min-h-[400px] md:max-h-[calc(100vh-280px)] max-h-[calc(100vh-250px)] relative 
          [&::-webkit-scrollbar]:h-3 
          [&::-webkit-scrollbar]:w-3 
          [&::-webkit-scrollbar-thumb]:bg-gray-300 
          dark:[&::-webkit-scrollbar-thumb]:bg-gray-600
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-track]:bg-transparent'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
          <table className='min-w-full border-collapse'>
            <thead className='bg-backgroundPaper'>{renderHeaderRow(true)}</thead>
            <SortableContext 
                items={processedGroups.map(g => `group-${g.groupId}`)} 
                strategy={verticalListSortingStrategy}
            >
              {processedGroups?.map(group => (
                <SortableGroup key={group.groupId} id={`group-${group.groupId}`}>
                  {(listeners, attributes) => (
                    <React.Fragment>
                  <tr className='bg-backgroundPaper border-b border-divider group/row'>
                    <td
                      className='p-3 font-bold text-textPrimary sticky left-0 z-[50] border-r border-divider shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]'
                      style={{
                        borderLeft: `6px solid ${group.groupColor}`,
                        width:
                          columnWidths[visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.columnId] ||
                          visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.width ||
                          200,
                        minWidth:
                          columnWidths[visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.columnId] ||
                          visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.width ||
                          200,
                        maxWidth:
                          columnWidths[visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.columnId] ||
                          visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.width ||
                          200,
                        backgroundColor: hexToRGBA(group.groupColor, 0.05),
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div className='flex items-center gap-3'>
                         <div
                            className='cursor-grab active:cursor-grabbing text-textDisabled hover:text-textPrimary transition-colors flex items-center justify-center p-1.5 rounded hover:bg-actionHover -ml-1'
                            {...listeners}
                            {...attributes}
                         >
                             <i className='tabler-grip-vertical text-xl' />
                         </div>
                        
                        <IconButton
                          size='small'
                          onClick={() => toggleGroupCollapse(group.groupId)}
                          sx={{
                            color: group.groupColor,
                            transform: collapsedGroups.includes(group.groupId) ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            bgcolor: hexToRGBA(group.groupColor, 0.1),
                            '&:hover': { bgcolor: hexToRGBA(group.groupColor, 0.2) },
                            padding: 0.5
                          }}
                        >
                          <i className='tabler-chevron-down text-base' />
                        </IconButton>
                        <div className="flex-1 overflow-hidden">
                          {editingGroupName?.groupId === group.groupId ? (
                            <TextField
                              autoFocus
                              fullWidth
                              variant='standard'
                              value={editingGroupName.currentName}
                              onChange={e => setEditingGroupName({ ...editingGroupName, currentName: e.target.value })}
                              onBlur={() => handleUpdateGroupName(group.groupId, editingGroupName.currentName)}
                              onKeyDown={e =>
                                e.key === 'Enter' && handleUpdateGroupName(group.groupId, editingGroupName.currentName)
                              }
                              slotProps={{
                                input: { disableUnderline: true, className: '!text-textPrimary !font-bold !text-lg' }
                              }}
                            />
                          ) : (
                            <Typography
                              variant='h6'
                              onClick={() => setEditingGroupName({ groupId: group.groupId, currentName: group.groupName })}
                              className='cursor-pointer truncate !font-bold !text-textPrimary tracking-tight'
                            >
                              {group.groupName}
                            </Typography>
                          )}
                        </div>
                         <IconButton
                          size='small'
                          className='opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity'
                          onClick={e => setMenuAnchor({ anchorEl: e.currentTarget, type: 'group', id: group.groupId })}
                        >
                          <i className='tabler-dots-vertical text-base' />
                        </IconButton>
                      </div>
                    </td>
                    <td colSpan={visibleColumns.length - 1} className='border-r border-divider'></td>
                  </tr>
                  {!collapsedGroups.includes(group.groupId) && (
                    <SortableContext 
                      items={group.items.map(i => i.taskId)} 
                      strategy={verticalListSortingStrategy}
                    >
                    <>
                      {renderHeaderRow(false)}
                      {group.items?.map(item => {
                        const isSelected = selectedTaskIds.includes(item.taskId)
                        const hoverBg = hexToRGBA(group.groupColor, 0.1) // 10% opacity
                        const selectedBg = hexToRGBA(group.groupColor, 0.2) // 20% opacity

                        return (
                          <React.Fragment key={item.taskId}>
                          <SortableRow
                              key={item.taskId} 
                              item={item}
                              isSelected={isSelected}
                              className={`group hover:bg-[var(--row-bg-hover)] border-b border-divider transition-colors ${isSelected ? 'bg-[var(--row-bg-selected)]' : 'bg-[var(--row-bg-default)]'}`}
                              style={{
                                '--row-bg-default': 'var(--mui-palette-background-paper)',
                                '--row-bg-hover': hoverBg,
                                '--row-bg-selected': selectedBg,
                              }}
                          >
                        {(dragListeners) => (
                        <>
                          {visibleColumns.map(column => {
                            const isItemColumn = column.columnName.toLowerCase() === 'item' || column.columnId === 'item_title'
                            
                            const cellValue = (item.values || []).find(
                              val => normalizeId(val.columnId) === normalizeId(column.columnId)
                            )

                            let cellContent

                            const isEditingItemTitle =
                              editingTaskName?.taskId === item.taskId && isItemColumn

                            const isEditingTextValue =
                              editingTextValue?.taskId === item.taskId && editingTextValue?.columnId === column.columnId

                            const stickyClass = isItemColumn 
                              ? `sticky left-0 z-[45] shadow-[2px_0_5px_rgba(0,0,0,0.05)] clip-right transition-all duration-200 ${isSelected ? 'bg-[var(--row-bg-selected)]' : 'bg-[var(--row-bg-default)]'} group-hover:bg-[var(--row-bg-hover)]`
                              : 'transition-all duration-200'
                            
                            const stickyStyle = isItemColumn ? { 
                                zIndex: 45, 
                            } : {
                                zIndex: 'auto'
                            }

                            switch (column.columnType) {
                              case 'PERSON':
                                cellContent = (
                                  <div className='flex justify-center'>
                                    <PersonAvatar users={parsePersonValue(cellValue?.value, board)} />
                                  </div>
                                )
                                break
                              case 'STATUS':
                                cellContent = <StatusCell value={cellValue?.value} column={column} />
                                break
                              case 'TAGS':
                                cellContent = (
                                  <div
                                    className='w-full h-full cursor-pointer'
                                    onClick={e => {
                                      if (!isEditingItemTitle && !isEditingTextValue) handleCellClick(e, item, column)
                                    }}
                                  >
                                    <TagsCell value={cellValue?.value} column={column} />
                                  </div>
                                )
                                break
                              case 'TIMELINE':
                                cellContent = (
                                  <div
                                    className='w-full h-full flex items-center'
                                    onClick={e => {
                                      if (!isEditingItemTitle && !isEditingTextValue) handleCellClick(e, item, column)
                                    }}
                                  >
                                    <TimelineCell value={cellValue?.value} column={column} />
                                  </div>
                                )
                                break
                              case 'DATE':
                                cellContent = <DateCell value={cellValue?.value} />
                                break
                              case 'CHECKBOX':
                                cellContent = (
                                  <div className='flex justify-center'>
                                    <Checkbox
                                      checked={cellValue?.value === 'true'}
                                      onChange={e => handleUpdateValue(item, column, e.target.checked.toString())}
                                      onClick={e => e.stopPropagation()}
                                      size='small'
                                    />
                                  </div>
                                )
                                break
                              case 'FILES':
                                cellContent = (
                                  <div
                                    className='w-full h-full flex items-center justify-center cursor-pointer'
                                    onClick={e => {
                                      if (!isEditingItemTitle && !isEditingTextValue) handleCellClick(e, item, column)
                                    }}
                                  >
                                    <FilesCell 
                                      value={cellValue?.value} 
                                      onListClick={(e) => setFileListPopover({ anchorEl: e.currentTarget, item, column })}
                                    />
                                  </div>
                                )
                                break
                              case 'LINK':
                                cellContent = <LinkCell value={cellValue?.value} />
                                break
                              case 'NUMBER':
                                cellContent = <span>{cellValue?.value || '—'}</span>
                                break
                              case 'PROGRESS':
                                cellContent = <ProgressCell item={item} column={column} />
                                break
                              case 'TEXT':
                              default:
                                if (isItemColumn) {
                                  cellContent = (
                                    <div className='flex items-center gap-2'>
                                      <div
                                        className='cursor-pointer p-1 hover:bg-gray-200 rounded transition-colors flex items-center justify-center'
                                        onClick={e => {
                                          e.stopPropagation()
                                          toggleExpandItem(item.taskId)
                                        }}
                                      >
                                        <i
                                          className={`tabler-chevron-right text-gray-400 transition-transform ${expandedItemIds.includes(item.taskId) ? 'rotate-90' : ''}`}
                                        />
                                      </div>
                                      <span className='truncate font-medium text-textPrimary'>{item.taskTitle}</span>
                                      {(item.subItems?.length || 0) > 0 && (
                                        <span className='text-[10px] bg-gray-100 text-gray-500 px-1 rounded border ml-1'>
                                          {item.subItems.length}
                                        </span>
                                      )}
                                    </div>
                                  )
                                } else {
                                  cellContent = <span className='truncate block w-full' title={cellValue?.value}>{cellValue?.value || '—'}</span>
                                }
                                break
                            }

                            if (isItemColumn) {
                                const itemContent = cellContent
                                cellContent = (
                                    <div className="flex items-center w-full h-full gap-2 pl-1">
                                        <div
                                            className='cursor-grab active:cursor-grabbing text-textDisabled hover:text-textPrimary transition-colors flex items-center justify-center p-0.5 rounded hover:bg-actionHover'
                                            {...dragListeners}
                                        >
                                            <i className='tabler-grip-vertical text-lg' />
                                        </div>

                                        <div className='flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-backgroundPaper border border-divider rounded-sm'>
                                          <IconButton
                                            size='small'
                                            className='!p-0'
                                            disabled={group.items.findIndex(i => i.taskId === item.taskId) === 0}
                                            onClick={e => { e.stopPropagation(); handleMoveRow('up', item.taskId, group.groupId); }}
                                          >
                                            <i className='tabler-chevron-up text-[10px]' />
                                          </IconButton>
                                          <IconButton
                                            size='small'
                                            className='!p-0'
                                            disabled={group.items.findIndex(i => i.taskId === item.taskId) === group.items.length - 1}
                                            onClick={e => { e.stopPropagation(); handleMoveRow('down', item.taskId, group.groupId); }}
                                          >
                                            <i className='tabler-chevron-down text-[10px]' />
                                          </IconButton>
                                        </div>
                                        
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={() => handleToggleSelectRow(item.taskId)}
                                          size='small'
                                          className='!p-0 opacity-0 group-hover:opacity-100 transition-opacity data-[checked=true]:opacity-100'
                                          data-checked={isSelected}
                                        />

                                        <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

                                        <div className="flex-1 overflow-hidden">
                                          {itemContent}
                                        </div>
                                    </div>
                                )
                            }

                            const currentWidth = columnWidths[column.columnId] || column.width || 200

                            return (
                              <td
                                key={`${item.taskId}-${column.columnId}`}
                                className={`p-0 h-8 md:h-10 border-r border-divider ${stickyClass}`}
                                style={{ 
                                    width: currentWidth, 
                                    minWidth: currentWidth, 
                                    maxWidth: currentWidth, 
                                    overflow: 'hidden', 
                                    ...stickyStyle
                                }}

                              >
                                {' '}
                                <div
                                  onClick={e => {
                                    if (
                                      column.columnType === 'TAGS' ||
                                      column.columnType === 'TIMELINE' ||
                                      column.columnType === 'FILES'
                                    ) {
                                    } else {
                                      if (isEditingItemTitle || isEditingTextValue) return
                                      handleCellClick(e, item, column)
                                    }
                                  }}
                                  className={`flex items-center w-full h-full cursor-pointer ${column.columnType !== 'STATUS' && column.columnType !== 'TEXT' && !isItemColumn ? 'justify-center' : 'justify-start'} ${column.columnType !== 'STATUS' && !isItemColumn ? 'px-1.5 md:px-3' : ''}`}
                                >
                                  {isEditingItemTitle ? (
                                    <div className="flex items-center w-full pl-8"> 
                                        <TextField
                                          autoFocus
                                          fullWidth
                                          variant='standard'
                                          value={editingTaskName.currentName}
                                          onChange={e =>
                                            setEditingTaskName({ ...editingTaskName, currentName: e.target.value })
                                          }
                                          onBlur={() => handleUpdateTaskTitle(item.taskId, editingTaskName.currentName)}
                                          onKeyDown={e =>
                                            e.key === 'Enter' &&
                                            handleUpdateTaskTitle(item.taskId, editingTaskName.currentName)
                                          }
                                          slotProps={{
                                            input: {
                                              disableUnderline: true,
                                              className: '!text-textPrimary !font-semibold'
                                            }
                                          }}
                                          onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                  ) : isEditingTextValue ? (
                                    <TextField
                                      autoFocus
                                      fullWidth
                                      multiline={column.columnType === 'TEXT'}
                                      minRows={1}
                                      maxRows={4}
                                      variant='standard'
                                      type={column.columnType === 'NUMBER' ? 'number' : 'text'}
                                      value={editingTextValue.currentValue}
                                      onChange={e =>
                                        setEditingTextValue({ ...editingTextValue, currentValue: e.target.value })
                                      }
                                      onBlur={handleSaveTextValue}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { 
                                            e.stopPropagation(); handleSaveTextValue(); 
                                        }
                                      }}
                                      slotProps={{ input: { disableUnderline: true, className: '!text-textPrimary' } }}
                                      onClick={e => e.stopPropagation()}
                                    />
                                  ) : isItemColumn ? (
                                    <div
                                      onClick={e => {
                                        e.stopPropagation()
                                        setEditingTaskName({ taskId: item.taskId, currentName: item.taskTitle })
                                        setSelectedItem(null)
                                      }}
                                      className='w-full h-full'
                                    >
                                      {cellContent}
                                    </div>
                                  ) : (
                                    <div className='w-full h-full'>{cellContent}</div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          <td className='border-r border-divider'></td>
                        </>
                        )}
                      </SortableRow>
                        {expandedItemIds.includes(item.taskId) && (
                          <tr className='bg-backgroundPaper'>
                            <td colSpan={visibleColumns.length} className='p-0 border-r border-divider relative'>
                              <SubItemsView
                                parentItem={item}
                                board={board}
                                columns={visibleColumns}
                                onCreateSubitem={handleCreateSubitem}
                                onUpdateValue={handleGeneralUpdate}
                                onCellClick={handleCellClick}
                                onDeleteSubitem={handleDeleteSubitem}
                                columnWidths={columnWidths}
                                onColumnResizeStart={handleColumnResizeStart}
                              />
                            </td>
                            <td className='border-r border-divider'></td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                  <tr className='bg-backgroundPaper'>
                    <td
                      className='p-3 text-textSecondary border-r border-divider sticky left-0 z-[45] bg-backgroundPaper'
                      style={{
                        width:
                          columnWidths[visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.columnId] ||
                          visibleColumns.find(c => c.columnName.toLowerCase() === 'item')?.width ||
                          200,
                        backgroundColor: 'var(--mui-palette-background-paper)',
                        zIndex: 45,
                        borderLeft: `5px solid transparent` 
                      }}
                    >
                      <div className="pl-10 flex items-center gap-2 group/add">
                          <i className='tabler-plus text-textDisabled group-hover/add:text-primary transition-colors' />
                          {activeNewItemInput === group.groupId ? (
                          <TextField
                              fullWidth
                              autoFocus
                              variant='standard'
                              value={newItemTitle}
                              onChange={e => setNewItemTitle(e.target.value)}
                              onBlur={() => handleCreateTask(group.groupId)}
                              onKeyDown={e => e.key === 'Enter' && handleCreateTask(group.groupId)}
                              placeholder='Type item name and press Enter...'
                              slotProps={{ input: { disableUnderline: true, className: '!text-textPrimary !text-sm' } }}
                          />
                          ) : (
                          <Typography
                              variant='body2'
                              className='cursor-text text-textDisabled hover:text-textSecondary transition-colors py-1'
                              onClick={() => setActiveNewItemInput(group.groupId)}
                          >
                              Add Item
                          </Typography>
                          )}
                      </div>
                    </td>
                    <td colSpan={visibleColumns.length} className='border-r border-divider border-b'></td>
                  </tr>
                  <tr className='bg-backgroundPaper border-t border-gray-700'>
                    {visibleColumns.map(column => {
                      let summaryContent = null
                      const calcType = column.calculationType || 'Sum'
                      const unit = column.unit || null
                      const isItemColumn = column.columnName.toLowerCase() === 'item' || column.columnId === 'item_title'

                      if (isItemColumn)
                        summaryContent = (
                          <Typography variant='caption' className='text-gray-400 px-3 pl-8'>
                            Count: {group.items?.length || 0}
                          </Typography>
                        )
                      else if (column.columnName === 'Status') {
                        const summary = getStatusSummary(group)
                        summaryContent = (
                          <div className='flex h-4 rounded-sm overflow-hidden mx-2'>
                            {Object.entries(summary).map(([status, count]) => {
                              let bgColor = 'bg-gray-500'
                              if (status === 'Selesai') bgColor = 'bg-green-500'
                              else if (status === 'Sedang Dikerjakan') bgColor = 'bg-yellow-500'
                              else if (status === 'Buntu') bgColor = 'bg-red-500'
                              return (
                                <div
                                  key={status}
                                  className={bgColor}
                                  style={{ flexGrow: count }}
                                  title={`${status}: ${count}`}
                                ></div>
                              )
                            })}
                          </div>
                        )
                      } else if (column.columnType === 'NUMBER') {
                        const result = calculateSummary(group.items, column.columnId, calcType)
                        summaryContent = (
                          <Button
                            onClick={e => handleOpenCalcMenu(e, column)}
                            className='!text-textSecondary !normal-case !font-semibold !p-0 !min-w-0'
                          >
                            {formatCalculation(result, unit, calcType)}
                          </Button>
                        )
                      }

                        return (
                          <td
                            key={`footer-${column.columnId}`}
                            className={`p-2 border-r border-divider text-center ${isItemColumn ? 'sticky left-0 z-[45] bg-backgroundPaper border-r-2 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]' : ''}`}
                            style={{
                              width: columnWidths[column.columnId] || column.width || 200,
                              minWidth: columnWidths[column.columnId] || column.width || 200,
                              maxWidth: columnWidths[column.columnId] || column.width || 200,
                              backgroundColor: isItemColumn ? 'var(--mui-palette-background-paper)' : hexToRGBA(group.groupColor, 0.02),
                              zIndex: isItemColumn ? 45 : 'auto'
                            }}
                          >
                            {summaryContent}
                          </td>
                        )
                    })}
                    <td className='border-r border-divider'></td>
                  </tr>
                    </>
                    </SortableContext>
                  )}
                    </React.Fragment>
                  )}
                </SortableGroup>
              ))}
            </SortableContext>
          </table>
          </DndContext>
        </div>
        <Button startIcon={<i className='tabler-plus' />} className='!mt-4 !normal-case' onClick={handleCreateGroup}>
          Add new group
        </Button>

        <Menu
          anchorEl={menuAnchor.anchorEl}
          open={Boolean(menuAnchor.anchorEl)}
          onClose={() => setMenuAnchor({ anchorEl: null })}
        >
          <div className='px-4 py-2 border-b border-divider mb-2'>
              <Typography variant='caption' className='text-textSecondary uppercase font-bold mb-2 block'>
                Group Color
              </Typography>
              <div className='flex gap-2 flex-wrap max-w-[160px]'>
                {GROUP_COLORS.map(color => { 
                  const currentGroup = groups.find(g => g.groupId === menuAnchor.id)
                  const isSelected = currentGroup?.groupColor === color
                  return (
                    <div
                      key={color}
                      onClick={() => handleUpdateGroupColor(menuAnchor.id, color)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${isSelected ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && <i className='tabler-check text-white text-xs' />}
                    </div>
                  )
                })}
              </div>
          </div>
          <MenuItem
            onClick={() =>
              menuAnchor.type === 'task' ? handleDeleteTask(menuAnchor.id) : handleDeleteGroup(menuAnchor.id)
            }
            sx={{ color: 'error.main' }}
          >
            <i className='tabler-trash mr-2' /> Delete {menuAnchor.type === 'group' ? 'Group' : 'Task'}
          </MenuItem>
        </Menu>

        {/* POPOVERS */}
        {timelinePopover.anchorEl && (
          <TimelinePopover
            anchorEl={timelinePopover.anchorEl}
            onClose={() => setTimelinePopover({ anchorEl: null, item: null, column: null })}
            item={getFreshItem(timelinePopover.item)}
            column={getFreshColumn(timelinePopover.column)}
            onSave={newValue => handleUpdateValue(timelinePopover.item, timelinePopover.column, newValue)}
          />
        )}

        {tagsPopover.anchorEl && (
          <TagsPopover
            anchorEl={tagsPopover.anchorEl}
            onClose={() => setTagsPopover({ anchorEl: null, item: null, column: null })}
            item={getFreshItem(tagsPopover.item)}
            column={getFreshColumn(tagsPopover.column)}
            onSave={newValue => handleUpdateValue(tagsPopover.item, tagsPopover.column, newValue)}
            onAddOption={newOption => handleModifyColumnOptions(tagsPopover.column.columnId, 'ADD', newOption)}
            onManage={() => {
              setManageTagsDialog({ open: true, column: getFreshColumn(tagsPopover.column) })
              setTagsPopover({ anchorEl: null, item: null, column: null })
            }}
          />
        )}

        <FilterPopover
          anchorEl={filterMenuAnchor}
          onClose={() => setFilterMenuAnchor(null)}
          columns={board?.columns || []}
          filters={filters}
          setFilters={setFilters}
        />
        <SortPopover
          anchorEl={sortAnchor}
          onClose={() => setSortAnchor(null)}
          columns={board?.columns || []}
          sortConfig={sortConfig}
          onSortChange={(colId, dir) => setSortConfig({ columnId: colId, direction: dir })}
        />
        {selectedItem && <ItemDetailPanel item={selectedItem} board={board} onClose={() => setSelectedItem(null)} />}
        {editingCell && (
          <ValueEditorPopover
            anchorEl={editingCell.anchorEl}
            onClose={() => setEditingCell(null)}
            column={{
              ...getFreshColumn(editingCell.column),
              currentValue: (editingCell.item.values || []).find(
                v => normalizeId(v.columnId) === normalizeId(editingCell.column.columnId)
              )?.value
            }}
            board={board}
            onValueSelect={newValue => handleUpdateValue(editingCell.item, editingCell.column, newValue)}
          />
        )}
        {fileListPopover.anchorEl && (
          <FileListPopover
            anchorEl={fileListPopover.anchorEl}
            item={fileListPopover.item}
            column={fileListPopover.column}
            onClose={() => setFileListPopover({ anchorEl: null, item: null, column: null })}
            onDelete={async (fileUrlToDelete) => {
              const { item, column } = fileListPopover
              const cellValue = (item?.values || []).find(v => normalizeId(v.columnId) === normalizeId(column?.columnId))?.value
              if (!cellValue) return

              const currentFiles = cellValue.split(',')
              
              // Normalize URLs for comparison
              const targetUrl = decodeURIComponent(fileUrlToDelete)
              const newFiles = currentFiles.filter(url => decodeURIComponent(url) !== targetUrl)
              
              const newValue = newFiles.join(',')

              await handleUpdateValue(item, column, newValue)
              
              // Force re-render of popover by updating local item state if needed
              // But handleUpdateValue should cascade updates.
              // Explicitly closing if empty for UX
              if (newFiles.length === 0) {
                setFileListPopover({ anchorEl: null, item: null, column: null })
              }
            }}
          />
        )}
        <ManageTagsDialog
          open={manageTagsDialog.open}
          onClose={() => setManageTagsDialog({ open: false, column: null })}
          column={getFreshColumn(manageTagsDialog.column)}
          onUpdateOption={(newOption, oldOption) =>
            handleModifyColumnOptions(manageTagsDialog.column.columnId, 'UPDATE', newOption, oldOption)
          }
          onDeleteOption={option => handleModifyColumnOptions(manageTagsDialog.column.columnId, 'DELETE', option)}
        />

        <Menu
          anchorEl={addColumnMenuAnchor}
          open={isAddColumnMenuOpen}
          onClose={handleCloseAddColumnMenu}
          PaperProps={{ style: { maxHeight: 500, width: '350px' } }}
        >
          <div className='px-4 pt-2 pb-1'>
            <TextField
              fullWidth
              size='small'
              variant='outlined'
              placeholder='Search or describe your column'
              InputProps={{ startAdornment: <i className='tabler-search text-textDisabled mr-2' /> }}
            />
          </div>
          <ListSubheader className='!bg-transparent uppercase font-semibold !text-xs !text-textDisabled'>
            Essentials
          </ListSubheader>
          <div className='grid grid-cols-2 gap-1 px-2'>
            {columnTypes.essentials.map(type => (
              <MenuItem key={type.key} onClick={() => handleColumnTypeSelect(type.key)} className='!rounded-md'>
                <ListItemIcon sx={{ color: 'text.secondary', minWidth: '32px' }}>
                  <i className={`${type.icon} text-lg`} />
                </ListItemIcon>
                <ListItemText primary={type.label} primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            ))}
          </div>
          <ListSubheader className='!bg-transparent uppercase font-semibold !text-xs !text-textDisabled mt-2'>
            Super useful
          </ListSubheader>
          <div className='grid grid-cols-2 gap-1 px-2'>
            {columnTypes.superUseful.map(type => (
              <MenuItem key={type.key} onClick={() => handleColumnTypeSelect(type.key)} className='!rounded-md'>
                <ListItemIcon sx={{ color: 'text.secondary', minWidth: '32px' }}>
                  <i className={`${type.icon} text-lg`} />
                </ListItemIcon>
                <ListItemText primary={type.label} primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            ))}
          </div>
          <Divider className='!my-2' />
          <MenuItem onClick={handleCloseAddColumnMenu} className='justify-center'>
            <Typography variant='body2' color='primary'>
              More columns
            </Typography>
          </MenuItem>
        </Menu>
        <CreateColumnModal
          open={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          boardId={board.boardId}
          onColumnCreated={handleCreateColumn}
          initialType={selectedColumnType}
        />
        <Menu
          anchorEl={columnMenuAnchor?.anchorEl}
          open={Boolean(columnMenuAnchor?.anchorEl)}
          onClose={closeColumnMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleRenameColumn}>
            <ListItemIcon>
              <i className='tabler-pencil text-lg' />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleHideColumn}>
            <ListItemIcon>
              <i className='tabler-eye-off text-lg' />
            </ListItemIcon>
            <ListItemText>Hide column</ListItemText>
          </MenuItem>
          {activeColumn?.columnType === 'PROGRESS' && (
            <MenuItem
              onClick={() => {
                setProgressSettingsModal({ open: true, column: activeColumn })
                closeColumnMenu()
              }}
            >
              <ListItemIcon>
                <i className='tabler-settings text-lg' />
              </ListItemIcon>
              <ListItemText>Progress Settings</ListItemText>
            </MenuItem>
          )}
          <Divider className='!my-1' />
          <MenuItem onClick={handleDuplicateColumn}>
            <ListItemIcon>
              <i className='tabler-copy text-lg' />
            </ListItemIcon>
            <ListItemText>Duplicate column</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleAddColumnToRight}>
            <ListItemIcon>
              <i className='tabler-plus text-lg' />
            </ListItemIcon>
            <ListItemText>Add column to the right</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleChangeColumnType}>
            <ListItemIcon>
              <i className='tabler-arrows-exchange text-lg' />
            </ListItemIcon>
            <ListItemText>Change column type</ListItemText>
          </MenuItem>
          <Divider className='!my-1' />
          <MenuItem onClick={handleDeleteColumn} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <i className='tabler-trash text-lg' />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
        <Menu
          anchorEl={calcMenuAnchor}
          open={Boolean(calcMenuAnchor)}
          onClose={handleCloseCalcMenu}
          PaperProps={{ sx: { width: 300 } }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant='caption' className='uppercase font-semibold text-textDisabled'>
              Unit
            </Typography>
            <Box
              sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
            >
              {unitOptions.map(opt => {
                const isSelected = (activeCalcColumn?.unit || null) === opt.value

                return (
                  <Button
                    key={opt.label}
                    onClick={() => handleSelectCalcSetting('unit', opt.value)}
                    sx={{
                      minWidth: 40,
                      borderRadius: 0,
                      backgroundColor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? 'white' : 'text.secondary',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderRight: 'none' }
                    }}
                  >
                    {opt.label}
                  </Button>
                )
              })}
              <TextField
                variant='standard'
                placeholder='Type your own'
                size='small'
                sx={{ flex: 1, px: 1, input: { color: 'text.primary', fontSize: '0.875rem' } }}
              />
            </Box>
            <Typography
              variant='caption'
              className='uppercase font-semibold text-textDisabled'
              sx={{ mt: 1, display: 'block' }}
            >
              Calculation
            </Typography>
            <Box
              sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}
            >
              {calcOptions.map(type => {
                const isSelected = type === (activeCalcColumn?.calculationType || 'Sum')

                return (
                  <Button
                    key={type}
                    onClick={() => handleSelectCalcSetting('calc', type)}
                    sx={{
                      flex: 1,
                      borderRadius: 0,
                      backgroundColor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? 'white' : 'text.secondary',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderRight: 'none' },
                      fontSize: '0.875rem',
                      textTransform: 'capitalize'
                    }}
                  >
                    {type}
                  </Button>
                )
              })}
            </Box>
          </Box>
        </Menu>
        {progressSettingsModal.open && (
          <ProgressColumnSettingsModal
            open={progressSettingsModal.open}
            onClose={() => setProgressSettingsModal({ open: false, column: null })}
            board={board}
            column={progressSettingsModal.column}
          />
        )}
        <ColumnVisibilityPopover
          anchorEl={visMenuAnchor}
          onClose={() => setVisMenuAnchor(null)}
          allColumns={headerColumns}
          hiddenIds={hiddenColumnIds}
          onToggle={handleToggleColumnVisibility}
        />
        <SaveTemplateDialog
          open={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSave={handleSaveAsTemplate}
        />
        {selectedTaskIds.length > 0 && (
          <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 shadow-xl border border-divider rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300'>
            <div className='flex items-center gap-2 border-r border-divider pr-4'>
              <div className='bg-primary main text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center'>
                {selectedTaskIds.length}
              </div>
              <Typography variant='subtitle2' className='font-semibold'>
                Selected
              </Typography>
            </div>
            <Button
              variant='text'
              color='error'
              startIcon={isBulkDeleting ? <CircularProgress size={16} color='error' /> : <i className='tabler-trash' />}
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              Delete
            </Button>
            <IconButton size='small' onClick={() => setSelectedTaskIds([])}>
              <i className='tabler-x' />
            </IconButton>
          </div>
        )}
        
        {/* Hidden File Input for Direct Upload */}
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleDirectFileChange}
          style={{ display: 'none' }}
        />
      <InviteMemberDialog 
        open={isInviteDialogOpen} 
        onClose={() => setIsInviteDialogOpen(false)} 
        boardId={board.boardId}
        onMemberAdded={() => mutate(boardApiEndpoint)} 
      />
      </div>
    )
  }
