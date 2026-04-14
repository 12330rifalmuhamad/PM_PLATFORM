import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunks dari API backend nyata
export const fetchChatRooms = createAsyncThunk('chat/fetchChatRooms', async () => {
  const res = await fetch('/api/chat/rooms')
  if (!res.ok) throw new Error('Failed to fetch chat rooms')
  return res.json()
})

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async roomId => {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return { roomId, messages: await res.json() }
})

// Polling: hanya ambil pesan baru setelah timestamp terakhir
export const pollNewMessages = createAsyncThunk(
  'chat/pollNewMessages',
  async ({ roomId, since }, { getState }) => {
    const params = since ? `?since=${encodeURIComponent(since)}` : ''
    const res = await fetch(`/api/chat/rooms/${roomId}/messages${params}`)
    if (!res.ok) throw new Error('Failed to poll messages')
    const newMessages = await res.json()
    return { roomId, newMessages }
  }
)

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ roomId, message }) => {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  if (!res.ok) throw new Error('Failed to send message')
  return { roomId, newMessage: await res.json() }
})

export const startNewChat = createAsyncThunk('chat/startNewChat', async ({ targetUserId }) => {
  const res = await fetch('/api/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId })
  })
  if (!res.ok) throw new Error('Failed to start chat')
  return res.json()
})

export const fetchContacts = createAsyncThunk('chat/fetchContacts', async () => {
  const res = await fetch('/api/users/list')
  if (!res.ok) throw new Error('Failed to fetch contacts')
  return res.json()
})

const initialState = {
  rooms: [],
  activeRoom: null,
  messages: {}, // keyed by roomId
  loading: false,
  error: null,
  contacts: [],
  chats: [],
  activeUser: null,
  profileUser: { id: null, status: 'online' }
}

// Helper: buat contact object dengan room info
const makeContact = (user, room = null) => ({
  id: user.id || user.userId?.toString(),
  fullName: user.fullName || user.userName || user.name,
  avatar: user.avatar || null,
  status: 'online',
  about: '',
  chat: room ? { id: room.id, unseenMsgs: room.unseenMsgs || 0 } : (user.chat || null)
})

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload
    },
    setUserStatus: (state, action) => {
      state.profileUser = { ...state.profileUser, status: action.payload.status }
    },
    // Cari contact + attach roomId dari state.rooms agar chat.id terisi
    getActiveUserData: (state, action) => {
      const contactId = action.payload?.toString()

      // Cari di contacts
      const contact = state.contacts.find(u => u.id?.toString() === contactId)

      // Cari room yang terkait dengan user ini
      const room = state.rooms.find(r => r.userId?.toString() === contactId)

      if (contact) {
        state.activeUser = {
          ...contact,
          // Pastikan chat.id selalu terisi dari room jika ada
          chat: room ? { id: room.id, unseenMsgs: room.unseenMsgs || 0 } : (contact.chat || null)
        }
      } else if (room) {
        // Fallback: buat activeUser dari room
        state.activeUser = {
          id: room.userId,
          fullName: room.name,
          avatar: null,
          status: 'online',
          about: '',
          chat: { id: room.id, unseenMsgs: room.unseenMsgs || 0 }
        }
      }
    },
    // Legacy stubs
    addNewChat: () => {},
    sendMsg: () => {}
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChatRooms.pending, state => { state.loading = true })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = action.payload

        // Update chats list (sidebar)
        state.chats = action.payload.map(r => ({
          id: r.id,
          userId: r.userId,
          unseenMsgs: r.unseenMsgs,
          lastMessage: r.lastMessage,
          lastMessageTime: r.lastMessageTime
        }))

        // Merge rooms ke contacts: update chat info jika user sudah ada di contacts
        const roomContactIds = action.payload.map(r => r.userId).filter(Boolean)

        state.contacts = state.contacts.map(c => {
          const room = action.payload.find(r => r.userId?.toString() === c.id?.toString())
          return room ? { ...c, chat: { id: room.id, unseenMsgs: room.unseenMsgs || 0 } } : c
        })

        // Tambahkan contact dari room yang belum ada di contacts
        action.payload.forEach(room => {
          if (!room.userId) return
          const exists = state.contacts.find(c => c.id?.toString() === room.userId?.toString())
          if (!exists) {
            state.contacts.push({
              id: room.userId,
              fullName: room.name,
              avatar: null,
              status: 'online',
              about: '',
              chat: { id: room.id, unseenMsgs: room.unseenMsgs || 0 }
            })
          }
        })

        // Update activeUser jika sedang aktif
        if (state.activeUser) {
          const room = action.payload.find(r => r.userId?.toString() === state.activeUser.id?.toString())
          if (room) {
            state.activeUser = {
              ...state.activeUser,
              chat: { id: room.id, unseenMsgs: room.unseenMsgs || 0 }
            }
          }
        }
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { roomId, messages } = action.payload
        // Initial load: replace semua pesan
        state.messages[roomId] = messages
      })
      .addCase(pollNewMessages.fulfilled, (state, action) => {
        const { roomId, newMessages } = action.payload
        if (!newMessages.length) return
        // Polling: append hanya pesan yang belum ada (cek by id)
        const existing = state.messages[roomId] || []
        const existingIds = new Set(existing.map(m => m.id))
        const toAdd = newMessages.filter(m => !existingIds.has(m.id))
        if (toAdd.length > 0) {
          state.messages[roomId] = [...existing, ...toAdd]
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { roomId, newMessage } = action.payload
        if (!state.messages[roomId]) state.messages[roomId] = []
        state.messages[roomId].push(newMessage)
      })
      // Saat room baru berhasil dibuat, langsung update activeUser dengan roomId baru
      .addCase(startNewChat.fulfilled, (state, action) => {
        const { id: newRoomId } = action.payload
        if (state.activeUser && newRoomId) {
          state.activeUser = {
            ...state.activeUser,
            chat: { id: newRoomId, unseenMsgs: 0 }
          }
        }
      })
      // fetchContacts: MERGE dengan contacts yang sudah ada (jangan timpa chat info)
      .addCase(fetchContacts.fulfilled, (state, action) => {
        action.payload.forEach(user => {
          const existingIdx = state.contacts.findIndex(c => c.id?.toString() === user.id?.toString())
          if (existingIdx !== -1) {
            // Update tapi pertahankan chat info yang sudah ada
            state.contacts[existingIdx] = {
              ...state.contacts[existingIdx],
              fullName: user.fullName || state.contacts[existingIdx].fullName,
              email: user.email
            }
          } else {
            // Tambahkan kontak baru tanpa room
            state.contacts.push(makeContact(user))
          }
        })
      })
  }
})

export const { setActiveRoom, setUserStatus, getActiveUserData, addNewChat, sendMsg } = chatSlice.actions
export default chatSlice.reducer
