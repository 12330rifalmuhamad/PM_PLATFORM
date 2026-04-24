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

// TipTap Imports
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import classnames from 'classnames'

// Style Imports
import '@/libs/styles/tiptapEditor.css'
import CustomIconButton from '@core/components/mui/IconButton'

// Helper to identify ink notes
const isInkNote = (content) => typeof content === 'string' && content.startsWith('data:image/')

// Helper Component for Ink Notes
const InkCanvas = ({ initialData, onSave, onCancel, canvasHeight = 250, loading = false }) => {
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

    // Load initial image if provided
    if (initialData) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = initialData
      hasDrawn.current = true
    }
  }

  useEffect(() => {
    initCanvas()

    window.addEventListener('resize', initCanvas)
    return () => window.removeEventListener('resize', initCanvas)
  }, [canvasHeight, initialData])

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

const EditorToolbar = ({ editor }) => {
  if (!editor) return null

  return (
    <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1, 
        p: 2, 
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        bgcolor: 'action.hover'
    }}>
      <CustomIconButton
        {...(editor.isActive('bold') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleBold().run()}
        title='Bold'
      >
        <i className={classnames('tabler-bold', { 'text-textSecondary': !editor.isActive('bold') })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive('underline') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title='Underline'
      >
        <i className={classnames('tabler-underline', { 'text-textSecondary': !editor.isActive('underline') })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive('italic') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title='Italic'
      >
        <i className={classnames('tabler-italic', { 'text-textSecondary': !editor.isActive('italic') })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive('strike') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title='Strikethrough'
      >
        <i className={classnames('tabler-strikethrough', { 'text-textSecondary': !editor.isActive('strike') })} />
      </CustomIconButton>

      <Box sx={{ mx: 0.5, borderLeft: theme => `1px solid ${theme.palette.divider}`, height: 24, my: 'auto' }} />

      <CustomIconButton
        {...(editor.isActive('heading', { level: 1 }) && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title='Heading 1'
      >
        <i className={classnames('tabler-h-1', { 'text-textSecondary': !editor.isActive('heading', { level: 1 }) })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive('heading', { level: 2 }) && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title='Heading 2'
      >
        <i className={classnames('tabler-h-2', { 'text-textSecondary': !editor.isActive('heading', { level: 2 }) })} />
      </CustomIconButton>

      <Box sx={{ mx: 0.5, borderLeft: theme => `1px solid ${theme.palette.divider}`, height: 24, my: 'auto' }} />

      <CustomIconButton
        {...(editor.isActive({ textAlign: 'left' }) && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title='Align Left'
      >
        <i className={classnames('tabler-align-left', { 'text-textSecondary': !editor.isActive({ textAlign: 'left' }) })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive({ textAlign: 'center' }) && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title='Align Center'
      >
        <i className={classnames('tabler-align-center', { 'text-textSecondary': !editor.isActive({ textAlign: 'center' }) })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive({ textAlign: 'right' }) && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title='Align Right'
      >
        <i className={classnames('tabler-align-right', { 'text-textSecondary': !editor.isActive({ textAlign: 'right' }) })} />
      </CustomIconButton>

      <Box sx={{ mx: 0.5, borderLeft: theme => `1px solid ${theme.palette.divider}`, height: 24, my: 'auto' }} />

      <CustomIconButton
        {...(editor.isActive('bulletList') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title='Bullet List'
      >
        <i className={classnames('tabler-list', { 'text-textSecondary': !editor.isActive('bulletList') })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive('orderedList') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title='Ordered List'
      >
        <i className={classnames('tabler-list-numbers', { 'text-textSecondary': !editor.isActive('orderedList') })} />
      </CustomIconButton>
      <CustomIconButton
        {...(editor.isActive('blockquote') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title='Blockquote'
      >
        <i className={classnames('tabler-quote', { 'text-textSecondary': !editor.isActive('blockquote') })} />
      </CustomIconButton>
       <CustomIconButton
        {...(editor.isActive('codeBlock') && { color: 'primary' })}
        variant='tonal'
        size='small'
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title='Code Block'
      >
        <i className={classnames('tabler-code', { 'text-textSecondary': !editor.isActive('codeBlock') })} />
      </CustomIconButton>
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
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [initialInkData, setInitialInkData] = useState(null)

  // Hooks
  const theme = useTheme()
  const isTabletLandscape = useMediaQuery('(min-width: 900px) and (orientation: landscape)')
  const dispatch = useDispatch()
  const { notes, loading, error } = useSelector((state) => state.notesReducer)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write something...'
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Underline
    ],
    content: newNoteContent,
    onUpdate: ({ editor }) => {
      setNewNoteContent(editor.getHTML())
    },
    immediatelyRender: false
  })

  // Sync editor content when newNoteContent changes externally (e.g. during edit)
  useEffect(() => {
    if (editor && editor.getHTML() !== newNoteContent) {
      editor.commands.setContent(newNoteContent)
    }
  }, [newNoteContent, editor])

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

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) return
    
    try {
      const payload = { 
        content: newNoteContent, 
        color: '#ffffd1',
        title: '' 
      }

      if (editingNoteId) {
        payload.noteId = editingNoteId
      }

      const result = await dispatch(saveNote(payload)).unwrap()
      
      toast.success(editingNoteId ? 'Note updated successfully!' : 'Note saved successfully!')
      setNewNoteContent('')
      setEditingNoteId(null)
      if (isFullScreen) setActiveNote(result)
    } catch (err) {
      // Rejection handled by useEffect watching error state
    }
  }

  const handleEditNote = (note) => {
    if (isInkNote(note.content)) {
      setEditingNoteId(note.noteId)
      setInitialInkData(note.content)
      setIsInkMode(true)
      return
    }
    setEditingNoteId(note.noteId)
    setNewNoteContent(note.content)
    setIsInkMode(false)
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setNewNoteContent('')
    setInitialInkData(null)
  }

  const handleSaveInk = async (dataUrl) => {
    try {
      const payload = { 
        content: dataUrl, 
        color: '#ffffd1' 
      }

      if (editingNoteId) {
        payload.noteId = editingNoteId
      }

      await dispatch(saveNote(payload)).unwrap()
      
      toast.success(editingNoteId ? 'Drawing updated!' : 'Drawing saved!')
      setIsInkMode(false)
      setEditingNoteId(null)
      setInitialInkData(null)
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
                 flexDirection: 'column',
                 height: '100%',
                 overflow: 'hidden'
             }}>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <PerfectScrollbar options={{ wheelPropagation: false }}>
                        <Box sx={{ p: 4, pb: 10 }}>
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
                                <CardContent sx={{ 
                                    p: '16px !important', 
                                    maxHeight: 200, 
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': { width: '4px' },
                                    '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
                                }}>
                                {isInkNote(note.content) ? (
                                    <Box
                                    component='img'
                                    src={note.content}
                                    alt='Handwritten note'
                                    sx={{ width: '100%', display: 'block', borderRadius: 0.5 }}
                                    />
                                ) : (
                                    <Box 
                                        className="ProseMirror" 
                                        sx={{ 
                                            p: '0 !important', 
                                            '& p': { m: 0, color: 'black', whiteSpace: 'pre-wrap', lineHeight: 1.6 } 
                                        }}
                                        dangerouslySetInnerHTML={{ __html: note.content }}
                                    />
                                )}
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', p: 1, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <IconButton size='small' onClick={(e) => { e.stopPropagation(); handleEditNote(note); }}>
                                        <i className='tabler-edit' style={{ fontSize: 18, color: 'rgba(0,0,0,0.5)' }} />
                                    </IconButton>
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
                </Box>
                
                {(!isFullScreen || !isTabletLandscape) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'background.default', borderTop: `1px solid ${theme.palette.divider}` }}>
                         {isInkMode ? (
                            <Box sx={{ p: 4 }}>
                                <InkCanvas initialData={initialInkData} onSave={handleSaveInk} onCancel={() => { setIsInkMode(false); setEditingNoteId(null); setInitialInkData(null); }} loading={loading} />
                            </Box>
                        ) : (
                            <>
                                <EditorToolbar editor={editor} />
                                <Box sx={{ p: 4, maxHeight: 150, overflowY: 'auto' }}>
                                    <EditorContent editor={editor} />
                                </Box>
                                <Box sx={{ px: 4, pb: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    {editingNoteId && (
                                        <IconButton size='small' onClick={handleCancelEdit}>
                                            <i className='tabler-x' />
                                        </IconButton>
                                    )}
                                    <IconButton color='primary' onClick={handleSaveNote} disabled={editor?.isEmpty || loading}>
                                        <i className={loading ? 'tabler-loader animate-spin' : (editingNoteId ? 'tabler-check' : 'tabler-send')} />
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
                                    initialData={initialInkData}
                                    canvasHeight={isFullScreen ? 500 : 250} 
                                    onSave={handleSaveInk} 
                                    onCancel={() => { setIsInkMode(false); setEditingNoteId(null); setInitialInkData(null); }} 
                                    loading={loading}
                                />
                            ) : (
                                <>
                                    <EditorToolbar editor={editor} />
                                    <Box sx={{ 
                                        flexGrow: 1, 
                                        overflowY: 'auto',
                                        '& .ProseMirror': { 
                                            minHeight: '100%',
                                            padding: 4,
                                            fontSize: '1.1rem'
                                        } 
                                    }}>
                                        <EditorContent editor={editor} />
                                    </Box>
                                    <Box sx={{ p: 4, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                                        {(newNoteContent.trim() !== '<p></p>' || editingNoteId) && (
                                            <Button 
                                                variant='tonal' 
                                                color='secondary' 
                                                onClick={handleCancelEdit}
                                                disabled={loading}
                                            >
                                                {editingNoteId ? 'Cancel Edit' : 'Clear'}
                                            </Button>
                                        )}
                                        <Button 
                                            variant='contained' 
                                            startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className={editingNoteId ? 'tabler-check' : 'tabler-save'} />}
                                            onClick={handleSaveNote}
                                            disabled={editor?.isEmpty || loading}
                                        >
                                            {editingNoteId ? 'Update Note' : 'Save Note'}
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
