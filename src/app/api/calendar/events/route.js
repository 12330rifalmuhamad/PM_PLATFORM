import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'

export const dynamic = 'force-dynamic'

// Serialize BigInt for JSON response
const serializeEvent = (event) => {
  return {
    ...event,
    id: event.eventId.toString(),
    start: event.startDate,
    end: event.endDate,
    extendedProps: {
      calendar: event.calendar,
      description: event.description || '',
      location: event.location || ''
    }
  }
}

export async function GET() {
  try {
    const dbEvents = await prisma.calendarEvent.findMany({
      where: { bitActive: 1 }
    })

    const events = dbEvents.map(serializeEvent)

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, start, end, allDay, url, extendedProps } = body

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title,
        startDate: new Date(start),
        endDate: new Date(end),
        allDay: allDay || false,
        url: url || null,
        calendar: extendedProps?.calendar || 'ETC',
        description: extendedProps?.description || null,
        location: extendedProps?.location || null
      }
    })

    return NextResponse.json(serializeEvent(newEvent))
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, title, start, end, allDay, url, extendedProps } = body

    // Support both direct update and FullCalendar event object structure
    const eventId = id || body._def?.publicId
    const data = body._def ? {
      title: body._def.title,
      startDate: new Date(body._instance.range.start),
      endDate: new Date(body._instance.range.end),
      allDay: body._def.allDay,
      calendar: body._def.extendedProps?.calendar,
      description: body._def.extendedProps?.description,
      location: body._def.extendedProps?.location
    } : {
      title,
      startDate: new Date(start),
      endDate: new Date(end),
      allDay,
      url,
      calendar: extendedProps?.calendar,
      description: extendedProps?.description,
      location: extendedProps?.location
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { eventId: BigInt(eventId) },
      data
    })

    return NextResponse.json(serializeEvent(updatedEvent))
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    await prisma.calendarEvent.update({
      where: { eventId: BigInt(id) },
      data: { bitActive: 0 }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
