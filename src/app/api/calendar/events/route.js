import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Cari semua task yang punya nilai DATE di tabel trTaskValue
    // Bergabung dengan tabel Task, Group, Board untuk informasi labelnya.
    const tasksWithDates = await prisma.task.findMany({
      where: {
        bitActive: 1,
        values: {
          some: {
            column: {
              columnType: 'DATE'
            },
            value: {
              not: null
            }
          }
        }
      },
      include: {
        group: {
          include: {
            board: true
          }
        },
        values: {
          where: {
            column: {
              columnType: 'DATE'
            }
          },
          include: {
            column: true
          }
        }
      }
    })

    const events = tasksWithDates.map(task => {
      // Cari nilai date-nya. Asumsi nilai disave dalam string YYYY-MM-DD
      const dateValue = task.values[0]?.value

      // Mengambil ID untuk validitas kalender event
      const taskId = Number(task.taskId)

      // Menentukan Calendar Color (Misal dari Group Color atau bawaan)
      // Tersedia: Personal, Business, Family, Holiday, ETC
      const calendar = 'Business' 

      return {
        id: taskId.toString(),
        url: '',
        title: task.taskTitle,
        allDay: true,
        start: dateValue,
        end: dateValue,
        extendedProps: {
          calendar: calendar,
          description: `Group: ${task.group?.groupName} | Board: ${task.group?.board?.boardName}`
        }
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
