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

const initialState = {
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC'],
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
    addEvent: (state, action) => {
      const newEvent = { ...action.payload, id: `${parseInt(state.events[state.events.length - 1]?.id ?? '') + 1}` }

      state.events.push(newEvent)
    },
    updateEvent: (state, action) => {
      state.events = state.events.map(event => {
        if (action.payload._def && event.id === action.payload._def.publicId) {
          return {
            id: event.id,
            url: action.payload._def.url,
            title: action.payload._def.title,
            allDay: action.payload._def.allDay,
            end: action.payload._instance.range.end,
            start: action.payload._instance.range.start,
            extendedProps: action.payload._def.extendedProps
          }
        } else if (event.id === action.payload.id) {
          return action.payload
        } else {
          return event
        }
      })
    },
    deleteEvent: (state, action) => {
      state.events = state.events.filter(event => event.id !== action.payload)
    },
    selectedEvent: (state, action) => {
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
      state.selectedCalendars = action.payload ? ['Personal', 'Business', 'Family', 'Holiday', 'ETC'] : []
      // Update with filtered real events
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
        state.events = action.payload || []
        state.filteredEvents = action.payload || []
        
        // Filter based on currently selected calendars
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
  addEvent,
  updateEvent,
  deleteEvent,
  selectedEvent,
  filterCalendarLabel,
  filterAllCalendarLabels
} = calendarSlice.actions
export default calendarSlice.reducer
