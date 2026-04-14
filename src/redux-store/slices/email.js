import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchEmails = createAsyncThunk('email/fetchEmails', async ({ folder, label } = {}) => {
  const params = new URLSearchParams()
  if (folder) params.set('folder', folder)
  if (label) params.set('label', label)

  const res = await fetch(`/api/emails?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch emails')
  return res.json()
})

export const updateEmail = createAsyncThunk('email/updateEmail', async ({ emailId, ...updates }) => {
  const res = await fetch(`/api/emails/${emailId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  if (!res.ok) throw new Error('Failed to update email')
  return { emailId, updates }
})

export const deleteEmailPermanent = createAsyncThunk('email/deleteEmailPermanent', async emailId => {
  const res = await fetch(`/api/emails/${emailId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete email')
  return emailId
})

export const sendEmail = createAsyncThunk('email/sendEmail', async ({ recipientEmail, subject, message }) => {
  const res = await fetch('/api/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, subject, message })
  })
  if (!res.ok) throw new Error('Failed to send email')
  return res.json()
})

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  emails: [],
  filteredEmails: [],
  currentEmailId: null,
  loading: false,
  error: null
}

// ─── Slice ─────────────────────────────────────────────────────────────────────

export const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    // Filter emails secara lokal berdasarkan folder/label (untuk navigasi cepat)
    filterEmails: (state, action) => {
      const { emails, folder, label, uniqueLabels } = action.payload

      state.filteredEmails = emails.filter(email => {
        if (folder === 'starred' && email.folder !== 'trash') {
          return email.isStarred
        } else if (uniqueLabels?.includes(label) && email.folder !== 'trash') {
          return email.labels.includes(label)
        } else {
          return email.folder === folder
        }
      })
    },

    getCurrentEmail: (state, action) => {
      state.currentEmailId = action.payload
    },

    navigateEmails: (state, action) => {
      const { type, emails: filteredEmails, currentEmailId } = action.payload
      const currentIndex = filteredEmails.findIndex(e => e.id === currentEmailId)

      if (type === 'next' && currentIndex < filteredEmails.length - 1) {
        state.currentEmailId = filteredEmails[currentIndex + 1].id
      } else if (type === 'prev' && currentIndex > 0) {
        state.currentEmailId = filteredEmails[currentIndex - 1].id
      }
    },

    // Legacy reducers (dipertahankan untuk kompatibilitas komponen yang belum dimigrasikan)
    moveEmailsToFolder: (state, action) => {
      const { emailIds, folder } = action.payload
      state.emails = state.emails.map(e => (emailIds.includes(e.id) ? { ...e, folder } : e))
    },
    deleteTrashEmails: (state, action) => {
      const { emailIds } = action.payload
      state.emails = state.emails.filter(e => !emailIds.includes(e.id))
    },
    toggleReadEmails: (state, action) => {
      const { emailIds } = action.payload
      const hasUnread = state.filteredEmails.filter(e => emailIds.includes(e.id)).some(e => !e.isRead)
      state.emails = state.emails.map(e => {
        if (emailIds.includes(e.id)) return { ...e, isRead: hasUnread }
        return e
      })
    },
    toggleLabel: (state, action) => {
      const { emailIds, label } = action.payload
      state.emails = state.emails.map(e => {
        if (emailIds.includes(e.id)) {
          return e.labels.includes(label)
            ? { ...e, labels: e.labels.filter(l => l !== label) }
            : { ...e, labels: [...e.labels, label] }
        }
        return e
      })
    },
    toggleStarEmail: (state, action) => {
      const { emailId } = action.payload
      state.emails = state.emails.map(e => (e.id === emailId ? { ...e, isStarred: !e.isStarred } : e))
    }
  },
  extraReducers: builder => {
    builder
      // fetchEmails
      .addCase(fetchEmails.pending, state => { state.loading = true })
      .addCase(fetchEmails.fulfilled, (state, action) => {
        state.loading = false
        state.emails = action.payload
        state.filteredEmails = action.payload
      })
      .addCase(fetchEmails.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })

      // updateEmail – sync state lokal setelah API berhasil
      .addCase(updateEmail.fulfilled, (state, action) => {
        const { emailId, updates } = action.payload
        state.emails = state.emails.map(e => {
          if (e.id !== emailId) return e
          const updated = { ...e, ...updates }

          // Handle labels
          if (updates.addLabel && !updated.labels.includes(updates.addLabel)) {
            updated.labels = [...updated.labels, updates.addLabel]
          }
          if (updates.removeLabel) {
            updated.labels = updated.labels.filter(l => l !== updates.removeLabel)
          }

          return updated
        })
        state.filteredEmails = state.filteredEmails.map(e => {
          if (e.id !== emailId) return e
          return { ...e, ...updates }
        })
      })

      // deleteEmailPermanent
      .addCase(deleteEmailPermanent.fulfilled, (state, action) => {
        const emailId = action.payload
        state.emails = state.emails.filter(e => e.id !== emailId)
        state.filteredEmails = state.filteredEmails.filter(e => e.id !== emailId)
      })
  }
})

export const {
  filterEmails,
  moveEmailsToFolder,
  deleteTrashEmails,
  toggleReadEmails,
  toggleLabel,
  toggleStarEmail,
  getCurrentEmail,
  navigateEmails
} = emailSlice.actions

export default emailSlice.reducer
