import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () => {
  const res = await fetch('/api/notes')
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.details || errorData.error || 'Failed to fetch notes')
  }
  return res.json()
})

export const saveNote = createAsyncThunk('notes/saveNote', async (noteData) => {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData)
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.details || errorData.error || 'Failed to save note')
  }
  return res.json()
})

export const deleteNote = createAsyncThunk('notes/deleteNote', async (noteId) => {
  const res = await fetch('/api/notes', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId })
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.details || errorData.error || 'Failed to delete note')
  }
  return noteId
})

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false
        state.notes = action.payload
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      
      // Save Note
      .addCase(saveNote.pending, (state) => {
        state.loading = true
      })
      .addCase(saveNote.fulfilled, (state, action) => {
        state.loading = false
        const savedNote = action.payload
        const index = state.notes.findIndex(n => n.noteId.toString() === savedNote.noteId.toString())
        if (index !== -1) {
          state.notes[index] = savedNote
        } else {
          state.notes.unshift(savedNote)
        }
      })
      .addCase(saveNote.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      // Delete Note
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n.noteId.toString() !== action.payload.toString())
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.error = action.error.message
      })
  }
})

export default notesSlice.reducer
