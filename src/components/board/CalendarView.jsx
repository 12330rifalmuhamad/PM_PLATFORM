'use client'

import React, { useMemo, useState } from 'react'

import { useSWRConfig } from 'swr'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction' // untuk event klik, dll.

// Fungsi untuk mempersiapkan data event untuk kalender
const prepareCalendarEvents = board => {
  if (!board?.columns || !board?.groups) return []

  // 1. Cari ID kolom tanggal di papan Anda
  // Kita asumsikan kolom tanggal pertama adalah tanggal event
  const dateColumn = board.columns.find(c => c.columnType === 'DATE')

  if (!dateColumn) return [] // Jika tidak ada kolom tanggal, tidak ada event

  const events = []

  // 2. Loop semua item/tugas untuk membuat event
  board.groups.forEach(group => {
    group.items.forEach(item => {
      const dateValue = item.values.find(v => v.columnId === dateColumn.columnId)

      if (dateValue?.value) {
        events.push({
          id: item.taskId,
          title: item.taskTitle,
          date: dateValue.value // Format 'YYYY-MM-DD'
          // Anda bisa menambahkan properti lain seperti warna
          // backgroundColor: group.groupColor,
          // borderColor: group.groupColor
        })
      }
    })
  })

  return events
}

const CalendarView = ({ board }) => {
  // Gunakan useMemo agar data tidak diproses ulang di setiap render
  const calendarEvents = useMemo(() => prepareCalendarEvents(board), [board])

  const { mutate } = useSWRConfig()

  // State untuk dialog form
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // State untuk dialog detail/edit event
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')

  const handleEventClick = clickInfo => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title
    })
    setEditTaskTitle(clickInfo.event.title)
    setIsEventDetailOpen(true)
  }

  const handleUpdateNote = async () => {
    if (!selectedEvent || !editTaskTitle.trim()) return

    try {
      const response = await fetch(`/api/tasks/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: editTaskTitle })
      })

      if (response.ok) {
        mutate(`/api/boards/${board.boardId}`)
        setIsEventDetailOpen(false)
      }
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedEvent) return
    if (!confirm('Apakah Anda yakin ingin menghapus notes ini?')) return

    try {
      const response = await fetch(`/api/tasks/${selectedEvent.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        mutate(`/api/boards/${board.boardId}`)
        setIsEventDetailOpen(false)
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleDateClick = arg => {
    setSelectedDate(arg.dateStr) // Menyimpan tanggal yang diklik (contoh: '2024-04-14')
    setNewTaskTitle('')
    setIsDialogOpen(true)
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const firstGroup = board.groups[0]
      if (!firstGroup) {
        alert('Buat Group/Tabel terlebih dahulu di Main Table sebelum menambahkan Notes.')
        return 
      }

      // 1. Buat task baru
      const response = await fetch(`/api/groups/${firstGroup.groupId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txtTaskTitle: newTaskTitle })
      })

      if (response.ok) {
        const newTask = await response.json()
        
        // 2. Cari kolom DATE untuk mengisinya dengan selectedDate
        const dateColumn = board.columns.find(c => c.columnType === 'DATE')

        if (dateColumn) {
          await fetch(`/api/tasks/${newTask.taskId}/values`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intColumn_ID: dateColumn.columnId,
              txtValue: selectedDate
            })
          })
        }
        
        // 3. Re-fetch data
        mutate(`/api/boards/${board.boardId}`)
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  if (!board.columns.some(c => c.columnType === 'DATE')) {
    return (
      <div className='text-center text-yellow-400'>
        Tampilan Kalender memerlukan setidaknya satu kolom bertipe DATE di papan ini.
      </div>
    )
  }

  return (
    <div className='calendar-container text-textPrimary'>
      {/* FullCalendar memerlukan file CSS-nya sendiri, yang akan kita atasi dengan global import */}
      <style jsx global>{`
        .fc .fc-button-primary {
          background-color: #7367f0; // Warna primary Vuexy
          border-color: #7367f0;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: rgba(115, 103, 240, 0.15);
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        weekends={true}
        events={calendarEvents}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek,dayGridDay'
        }}
      />

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tulis Notes / Tambah Item Baru</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label={`Notes untuk Tanggal ${selectedDate}`}
            variant="outlined"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions className='px-6 py-4'>
          <Button onClick={() => setIsDialogOpen(false)} color="secondary">Batal</Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={!newTaskTitle.trim()}>
            Simpan Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Detail & Edit Event */}
      <Dialog open={isEventDetailOpen} onClose={() => setIsEventDetailOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Detail Notes</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            label="Isi Notes"
            variant="outlined"
            value={editTaskTitle}
            onChange={(e) => setEditTaskTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions className='px-6 py-4 flex justify-between'>
          <Button onClick={handleDeleteNote} color="error" variant="outlined" startIcon={<i className='tabler-trash' />}>
            Hapus
          </Button>
          <div className='flex gap-2'>
            <Button onClick={() => setIsEventDetailOpen(false)} color="secondary">Batal</Button>
            <Button onClick={handleUpdateNote} variant="contained" disabled={!editTaskTitle.trim()}>
              Simpan Perubahan
            </Button>
          </div>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default CalendarView
