import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () => {
  const res = await fetch('/api/notes')
  if (!res.ok) throw new Error('Failed to fetch notes')
  return res.json()
})

export const saveNote = createAsyncThunk('notes/saveNote', async (noteData) => {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData)
  })
  if (!res.ok) throw new Error('Failed to save note')
  return res.json()
})

export const deleteNote = createAsyncThunk('notes/deleteNote', async (noteId) => {
  const res = await fetch('/api/notes', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteId })
  })
  if (!res.ok) throw new Error('Failed to delete note')
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
      .addCase(fetchNotes.pending, (state) => { state.loading = true })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false
        state.notes = action.payload
      })
      .addCase(saveNote.fulfilled, (state, action) => {
        const savedNote = action.payload
        const index = state.notes.findIndex(n => n.noteId.toString() === savedNote.noteId.toString())
        if (index !== -1) {
          state.notes[index] = savedNote
        } else {
          state.notes.unshift(savedNote)
        }
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n.noteId.toString() !== action.payload.toString())
      })
  }
})

export default notesSlice.reducer
