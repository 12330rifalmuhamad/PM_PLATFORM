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
  Button,
  Card,
  CardContent,
  CardActions,
  Fade,
  ClickAwayListener,
  Zoom,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material'

// Third-party Imports
import { useDispatch, useSelector } from 'react-redux'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { toast } from 'react-toastify'

// Slice Imports
import { fetchNotes, saveNote, deleteNote } from '@/redux-store/slices/notes'

// Helper to identify ink notes
const isInkNote = (content) => typeof content === 'string' && content.startsWith('data:image/')

// Helper Component for Ink Notes
const InkCanvas = ({ onSave, onCancel, canvasHeight = 250, loading = false }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const hasDrawn = useRef(false)

  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvasHeight

    // Initial setup
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
  }

  useEffect(() => {
    initCanvas()

    window.addEventListener('resize', initCanvas)
    return () => window.removeEventListener('resize', initCanvas)
  }, [canvasHeight])

  const startDrawing = (e) => {
    if (loading) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || loading) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
    hasDrawn.current = true
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleSave = () => {
    if (!hasDrawn.current) {
      toast.warning('Please draw something first!')
      return
    }
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        component='canvas'
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerOut={stopDrawing}
        onPointerCancel={stopDrawing}
        sx={{
          touchAction: 'none',
          cursor: loading ? 'wait' : 'crosshair',
          border: '1px dashed #ccc',
          borderRadius: 1,
          bgcolor: '#ffffd1',
          display: 'block',
          width: '100%',
          mb: 2,
          opacity: loading ? 0.6 : 1
        }}
      />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
        {loading && <CircularProgress size={20} />}
        <IconButton size='small' onClick={handleClear} title='Clear Workspace' disabled={loading}>
          <i className='tabler-eraser' />
        </IconButton>
        <IconButton size='small' onClick={onCancel} disabled={loading}>
          <i className='tabler-x' />
        </IconButton>
        <IconButton color='primary' size='small' onClick={handleSave} disabled={loading || !hasDrawn}>
          <i className='tabler-check' />
        </IconButton>
      </Box>
    </Box>
  )
}

const FloatingNotesWidget = () => {
  // States
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [activeNote, setActiveNote] = useState(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isInkMode, setIsInkMode] = useState(false)

  // Hooks
  const theme = useTheme()
  const isTabletLandscape = useMediaQuery('(min-width: 900px) and (orientation: landscape)')
  const dispatch = useDispatch()
  const { notes, loading, error } = useSelector((state) => state.notesReducer)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotes())
    }
  }, [isOpen, dispatch])

  // Handle Error from Redux
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleToggle = () => setIsOpen((prev) => !prev)

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return
    
    try {
      const result = await dispatch(saveNote({ 
        content: newNoteContent, 
        color: '#ffffd1',
        title: '' // Could be added to UI later
      })).unwrap()
      
      toast.success('Note saved successfully!')
      setNewNoteContent('')
      if (isFullScreen) setActiveNote(result)
    } catch (err) {
      // Rejection handled by useEffect watching error state
    }
  }

  const handleSaveInk = async (dataUrl) => {
    try {
      await dispatch(saveNote({ 
        content: dataUrl, 
        color: '#ffffd1' 
      })).unwrap()
      
      toast.success('Drawing saved!')
      setIsInkMode(false)
    } catch (err) {
      // Handled
    }
  }

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await dispatch(deleteNote(id)).unwrap()
        toast.info('Note deleted')
        if (activeNote?.noteId === id) setActiveNote(null)
      } catch (err) {
        // Handled
      }
    }
  }

  const handleTogglePin = async (note) => {
    try {
      await dispatch(saveNote({ ...note, isPinned: !note.isPinned })).unwrap()
    } catch (err) {
      // Handled
    }
  }

  const handleFullScreenToggle = () => setIsFullScreen(!isFullScreen)

  // Auto-switch to full screen on tablet landscape if open
  useEffect(() => {
    if (isOpen && isTabletLandscape) {
      setIsFullScreen(true)
    } else if (!isTabletLandscape) {
      setIsFullScreen(false)
    }
  }, [isTabletLandscape, isOpen])

  return (
    <Box className='mui-fixed' sx={{ position: 'fixed', bottom: 90, right: 20, zIndex: 1200 }}>
      {/* PopUp Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            bottom: isFullScreen ? 0 : 70,
            right: isFullScreen ? 0 : 0,
            top: isFullScreen ? 0 : 'auto',
            left: isFullScreen ? 0 : 'auto',
            width: isFullScreen ? '100vw' : { xs: 'calc(100vw - 40px)', sm: 300 },
            height: isFullScreen ? '100vh' : 450,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: isFullScreen ? 0 : 2,
            border: isFullScreen ? 'none' : `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            transition: 'all 0.3s ease-in-out',
            zIndex: 1300
          }}
        >
          <Box sx={{ p: 4, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <i className='tabler-notes text-2xl text-primary' />
                <Typography variant='h5' sx={{ fontWeight: 600 }}>Quick Notes</Typography>
                {loading && <CircularProgress size={16} sx={{ ml: 2 }} />}
            </Box>
            <Box>
              <IconButton size='small' onClick={() => setIsInkMode(!isInkMode)} color={isInkMode ? 'primary' : 'default'} sx={{ mr: 1 }}>
                <i className={isInkMode ? 'tabler-keyboard' : 'tabler-scribble'} />
              </IconButton>
              <IconButton size='small' onClick={handleFullScreenToggle} sx={{ mr: 1 }}>
                <i className={isFullScreen ? 'tabler-arrows-minimize' : 'tabler-arrows-maximize'} />
              </IconButton>
              <IconButton size='small' onClick={handleToggle}>
                <i className='tabler-x' />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar / List area - Always shown in full screen, scrollable */}
             <Box sx={{ 
                 width: isFullScreen ? { xs: '100%', md: 350 } : '100%', 
                 borderRight: isFullScreen ? `1px solid ${theme.palette.divider}` : 'none',
                 display: (isFullScreen && !isTabletLandscape && isInkMode) ? 'none' : 'flex',
                 flexDirection: 'column'
             }}>
                <PerfectScrollbar options={{ wheelPropagation: false }}>
                    <Box sx={{ p: 4 }}>
                        {notes.length === 0 && !loading && (
                            <Typography variant='body2' color='text.disabled' sx={{ textAlign: 'center', py: 10 }}>
                                No notes yet. Start writing!
                            </Typography>
                        )}
                        {notes.map((note) => (
                        <Card
                            key={note.noteId.toString()}
                            onClick={() => isFullScreen && setActiveNote(note)}
                            sx={{
                            mb: 4,
                            bgcolor: note.color || '#ffffd1',
                            transition: 'all 0.2s',
                            cursor: isFullScreen ? 'pointer' : 'default',
                            transform: activeNote?.noteId === note.noteId ? 'scale(1.02)' : 'none',
                            boxShadow: activeNote?.noteId === note.noteId ? theme.shadows[4] : theme.shadows[1],
                            '&:hover': { transform: 'scale(1.02)', boxShadow: theme.shadows[4] },
                            position: 'relative'
                            }}
                        >
                            <CardContent sx={{ p: '16px !important' }}>
                            {isInkNote(note.content) ? (
                                <Box
                                component='img'
                                src={note.content}
                                alt='Handwritten note'
                                sx={{ width: '100%', display: 'block', borderRadius: 0.5 }}
                                />
                            ) : (
                                <Typography variant='body1' sx={{ color: 'black', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {note.content}
                                </Typography>
                            )}
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', p: 1, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            <IconButton size='small' onClick={(e) => { e.stopPropagation(); handleTogglePin(note); }}>
                                <i className={note.isPinned ? 'tabler-pin' : 'tabler-pin-filled'} style={{ fontSize: 18, color: 'rgba(0,0,0,0.5)' }} />
                            </IconButton>
                            <IconButton size='small' onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.noteId); }}>
                                <i className='tabler-trash' style={{ fontSize: 18, color: 'rgba(0,0,0,0.5)' }} />
                            </IconButton>
                            </CardActions>
                        </Card>
                        ))}
                    </Box>
                </PerfectScrollbar>
                
                {(!isFullScreen || !isTabletLandscape) && (
                    <Box sx={{ p: 4, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.default' }}>
                         {isInkMode ? (
                            <InkCanvas onSave={handleSaveInk} onCancel={() => setIsInkMode(false)} loading={loading} />
                        ) : (
                            <>
                                <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder='Write a quick note...'
                                variant='standard'
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                InputProps={{ disableUnderline: true, style: { fontSize: '1rem' } }}
                                disabled={loading}
                                />
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton color='primary' onClick={handleAddNote} disabled={!newNoteContent.trim() || loading}>
                                    <i className={loading ? 'tabler-loader animate-spin' : 'tabler-send'} />
                                </IconButton>
                                </Box>
                            </>
                        )}
                    </Box>
                )}
             </Box>

            {/* Main Content Area (Full Screen Only) */}
            {isFullScreen && (
                <Box sx={{ 
                    flexGrow: 1, 
                    display: { xs: (isTabletLandscape || !isInkMode) ? 'none' : 'flex', md: 'flex' }, 
                    flexDirection: 'column',
                    bgcolor: 'action.hover',
                    p: 6
                }}>
                    <Paper sx={{ 
                        flexGrow: 1, 
                        p: 6, 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 3,
                        boxShadow: theme.shadows[2]
                    }}>
                         <Typography variant='h6' sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <i className='tabler-edit text-primary' />
                            {isInkMode ? 'Drawing Workspace' : 'Write Note'}
                         </Typography>
                         
                         <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            {isInkMode ? (
                                <InkCanvas 
                                    canvasHeight={isFullScreen ? 500 : 250} 
                                    onSave={handleSaveInk} 
                                    onCancel={() => setIsInkMode(false)} 
                                    loading={loading}
                                />
                            ) : (
                                <>
                                    <TextField
                                        fullWidth
                                        multiline
                                        placeholder='Type your thoughts here...'
                                        variant='outlined'
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        sx={{ 
                                            flexGrow: 1, 
                                            '& .MuiOutlinedInput-root': { height: '100%', alignItems: 'flex-start' },
                                            '& fieldset': { border: 'none' }
                                        }}
                                        InputProps={{ style: { fontSize: '1.25rem', padding: 0 } }}
                                        disabled={loading}
                                    />
                                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                                        <Button 
                                            variant='tonal' 
                                            color='secondary' 
                                            onClick={() => setNewNoteContent('')}
                                            disabled={loading}
                                        >
                                            Clear
                                        </Button>
                                        <Button 
                                            variant='contained' 
                                            startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-save' />}
                                            onClick={handleAddNote}
                                            disabled={!newNoteContent.trim() || loading}
                                        >
                                            Save Note
                                        </Button>
                                    </Box>
                                </>
                            )}
                         </Box>
                    </Paper>
                </Box>
            )}
          </Box>
        </Paper>
      </Fade>

      {/* Toggle Button */}
      <Zoom in={!isFullScreen}>
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
