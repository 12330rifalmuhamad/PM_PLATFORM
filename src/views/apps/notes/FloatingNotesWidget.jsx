'use client'

// React Imports
import { useEffect, useState, useRef } from 'react'

// MUI Imports
import {
  Fab,
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Card,
  CardContent,
  CardActions,
  Fade,
  ClickAwayListener,
  Zoom,
  useTheme
} from '@mui/material'

// Third-party Imports
import { useDispatch, useSelector } from 'react-redux'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Slice Imports
import { fetchNotes, saveNote, deleteNote } from '@/redux-store/slices/notes'

// Helper Component for Ink Notes
const InkCanvas = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = 250 // Fixed height for quick sketches

    // Initial setup
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
  }, [])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    onSave(dataUrl)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <Box>
      <Box
        component='canvas'
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerOut={stopDrawing}
        sx={{
          touchAction: 'none',
          cursor: 'crosshair',
          border: '1px dashed #ccc',
          borderRadius: 1,
          bgcolor: '#ffffd1',
          display: 'block',
          width: '100%',
          mb: 2
        }}
      />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <IconButton size='small' onClick={handleClear} title='Clear Workspace'>
          <i className='tabler-eraser' />
        </IconButton>
        <IconButton size='small' onClick={onCancel}>
          <i className='tabler-x' />
        </IconButton>
        <IconButton color='primary' size='small' onClick={handleSave}>
          <i className='tabler-check' />
        </IconButton>
      </Box>
    </Box>
  )
}

const FloatingNotesWidget = () => {
  // States
  const [isOpen, setIsOpen] = useState(false)
  const [activeNote, setActiveNote] = useState(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isInkMode, setIsInkMode] = useState(false)

  // Hooks
  const theme = useTheme()
  const dispatch = useDispatch()
  const { notes, loading } = useSelector((state) => state.notesReducer)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotes())
    }
  }, [isOpen, dispatch])

  const handleToggle = () => setIsOpen((prev) => !prev)

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return
    dispatch(saveNote({ content: newNoteContent, color: '#ffffd1' }))
    setNewNoteContent('')
  }

  const handleSaveInk = (dataUrl) => {
    dispatch(saveNote({ content: dataUrl, color: '#ffffd1' }))
    setIsInkMode(false)
  }

  const handleDeleteNote = (id) => {
    dispatch(deleteNote(id))
  }

  const handleTogglePin = (note) => {
    dispatch(saveNote({ ...note, isPinned: !note.isPinned }))
  }

  const isInkNote = (content) => content && content.startsWith('data:image/')

  return (
    <Box className='mui-fixed' sx={{ position: 'fixed', bottom: 90, right: 20, zIndex: 1200 }}>
      {/* PopUp Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={12}
          sx={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            width: { xs: 'calc(100vw - 40px)', sm: 300 },
            height: 450,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>Quick Notes</Typography>
            <Box>
              <IconButton size='small' onClick={() => setIsInkMode(!isInkMode)} color={isInkMode ? 'primary' : 'default'} sx={{ mr: 1 }}>
                <i className='tabler-scribble' />
              </IconButton>
              <IconButton size='small' onClick={handleToggle}>
                <i className='tabler-x' />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <PerfectScrollbar options={{ wheelPropagation: false }}>
              <Box sx={{ p: 3 }}>
                {notes.map((note) => (
                  <Card
                    key={note.noteId.toString()}
                    sx={{
                      mb: 3,
                      bgcolor: note.color || '#ffffd1',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)' },
                      position: 'relative'
                    }}
                  >
                    <CardContent sx={{ p: '12px !important' }}>
                      {isInkNote(note.content) ? (
                        <Box
                          component='img'
                          src={note.content}
                          alt='Handwritten note'
                          sx={{ width: '100%', display: 'block', borderRadius: 0.5 }}
                        />
                      ) : (
                        <Typography variant='body2' sx={{ color: 'black', whiteSpace: 'pre-wrap' }}>
                          {note.content}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', p: 0.5 }}>
                      <IconButton size='small' onClick={() => handleTogglePin(note)}>
                        <i className={note.isPinned ? 'tabler-pin' : 'tabler-pin-filled'} style={{ fontSize: 16, color: 'rgba(0,0,0,0.5)' }} />
                      </IconButton>
                      <IconButton size='small' onClick={() => handleDeleteNote(note.noteId)}>
                        <i className='tabler-trash' style={{ fontSize: 16, color: 'rgba(0,0,0,0.5)' }} />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            </PerfectScrollbar>
          </Box>

          <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.default' }}>
            {isInkMode ? (
              <InkCanvas onSave={handleSaveInk} onCancel={() => setIsInkMode(false)} />
            ) : (
              <>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder='Write a note...'
                  variant='standard'
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  InputProps={{ disableUnderline: true, style: { fontSize: '0.875rem' } }}
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton color='primary' onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                    <i className='tabler-send' />
                  </IconButton>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Fade>

      {/* Toggle Button */}
      <Zoom in={true}>
        <Fab
          variant='extended'
          size='medium'
          color='secondary'
          onClick={handleToggle}
          sx={{
            boxShadow: theme.shadows[10],
            textTransform: 'none',
            '& i': { mr: 1 }
          }}
        >
          <i className='tabler-notes' />
          {isOpen ? 'Close Notes' : 'Quick Notes'}
        </Fab>
      </Zoom>
    </Box>
  )
}

export default FloatingNotesWidget
