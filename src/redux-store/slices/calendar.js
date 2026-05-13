import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Fetch events from real database
export const fetchEvents = createAsyncThunk('calendar/fetchEvents', async () => {
  const response = await fetch('/api/calendar/events')
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events')
  }
  const data = await response.json()
  return data
})

// Add event to database
export const addEvent = createAsyncThunk('calendar/addEvent', async (event, { dispatch }) => {
  const response = await fetch('/api/calendar/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
  if (!response.ok) {
    throw new Error('Failed to add calendar event')
  }
  const data = await response.json()
  dispatch(fetchEvents())
  return data
})

// Update event in database
export const updateEvent = createAsyncThunk('calendar/updateEvent', async (event, { dispatch }) => {
  const response = await fetch('/api/calendar/events', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  })
  if (!response.ok) {
    throw new Error('Failed to update calendar event')
  }
  const data = await response.json()
  dispatch(fetchEvents())
  return data
})

// Delete event from database
export const deleteEvent = createAsyncThunk('calendar/deleteEvent', async (id, { dispatch }) => {
  const response = await fetch(`/api/calendar/events?id=${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete calendar event')
  }
  dispatch(fetchEvents())
  return id
})

const initialState = {
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC', 'Tasks'],
  loading: false,
  error: null
}

const filterEventsUsingCheckbox = (events, selectedCalendars) => {
  return events.filter(event => selectedCalendars.includes(event.extendedProps?.calendar))
}

export const calendarSlice = createSlice({
  name: 'calendar',
  initialState: initialState,
  reducers: {
    filterEvents: state => {
      state.filteredEvents = state.events
    },
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload
    },
    filterCalendarLabel: (state, action) => {
      const index = state.selectedCalendars.indexOf(action.payload)

      if (index !== -1) {
        state.selectedCalendars.splice(index, 1)
      } else {
        state.selectedCalendars.push(action.payload)
      }

      state.events = filterEventsUsingCheckbox(state.filteredEvents, state.selectedCalendars)
    },
    filterAllCalendarLabels: (state, action) => {
      state.selectedCalendars = action.payload ? ['Personal', 'Business', 'Family', 'Holiday', 'ETC', 'Tasks'] : []
      state.events = filterEventsUsingCheckbox(state.filteredEvents, state.selectedCalendars)
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchEvents.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false
        state.filteredEvents = action.payload || []
        state.events = filterEventsUsingCheckbox(state.filteredEvents, state.selectedCalendars)
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})
export const {
  filterEvents,
  setSelectedEvent,
  filterCalendarLabel,
  filterAllCalendarLabels
} = calendarSlice.actions
export default calendarSlice.reducer
