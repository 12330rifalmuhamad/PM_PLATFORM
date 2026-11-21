import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const userId = parseInt(session.user.id)

    const boards = await prisma.board.findMany({
      where: { boardMember: { some: { userId: userId } } },
      orderBy: { dtmInserted: 'desc' },
      include: { workspace: { select: { workspaceId: true, workspaceName: true } } }
    })

    return NextResponse.json(boards)
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch boards', error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.name) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { boardName, description, workspaceId, templateId } = body || {}
    const userId = parseInt(session.user.id)
    const currentUser = session.user.name

    if (!boardName || !workspaceId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const parsedWorkspaceId = parseInt(workspaceId)

    // 1. Cek Workspace
    const ws = await prisma.workspace.findUnique({
      where: { workspaceId: parsedWorkspaceId },
      include: { workspaceMember: true }
    })

    if (!ws) return NextResponse.json({ message: 'Workspace not found' }, { status: 404 })

    // 2. Cek Akses (LOGIKA PERBAIKAN DI SINI)
    let hasAccess = ws.workspaceMember.some(m => m.userId === userId && m.bitActive === 1)

    // Jika tidak punya akses, tapi dia adalah PEMBUAT workspace tersebut -> Perbaiki Data
    if (!hasAccess && ws.txtInsertedBy === currentUser) {
      console.log(`[Fix Access] User ${currentUser} is creator but not active member. Fixing...`)

      try {
        // Cek apakah data member 'hantu' (tidak aktif) sudah ada?
        const existingMember = await prisma.trWorkspaceMember.findFirst({
          where: { workspaceId: parsedWorkspaceId, userId: userId }
        })

        if (existingMember) {
          // Skenario A: Data ada tapi bitActive 0 -> UPDATE
          console.log('[Fix Access] Updating existing inactive member...')
          await prisma.trWorkspaceMember.update({
            where: { workspaceMemberId: existingMember.workspaceMemberId },
            data: { bitActive: 1, role: 'Owner' }
          })
        } else {
          // Skenario B: Data belum ada sama sekali -> CREATE
          console.log('[Fix Access] Creating new member...')
          await prisma.trWorkspaceMember.create({
            data: { workspaceId: parsedWorkspaceId, userId, role: 'Owner', txtInsertedBy: currentUser, bitActive: 1 }
          })
        }

        // PENTING: Setelah diperbaiki, anggap akses sudah diberikan
        hasAccess = true
      } catch (e) {
        console.error('[Fix Access Failed]', e)

        // Jangan return error dulu, coba lanjut siapa tau akses terbuka
      }
    }

    if (!hasAccess) return NextResponse.json({ message: 'Access denied' }, { status: 403 })

    // 3. Siapkan Kolom
    let rawColumns = []

    if (templateId) {
      try {
        const template = await prisma.boardTemplate.findUnique({ where: { templateId: parseInt(templateId) } })

        if (template?.structure) {
          let structureData = template.structure

          if (typeof structureData === 'string') structureData = JSON.parse(structureData)
          if (Array.isArray(structureData)) rawColumns = structureData
        }
      } catch (e) {
        console.warn('Template parsing warning:', e.message)
      }
    }

    // Default Columns
    if (rawColumns.length === 0 && !body.isImporting) {
      rawColumns = [
        { columnName: 'Item', columnType: 'TEXT', sortOrder: 1 },
        { columnName: 'Person', columnType: 'PERSON', sortOrder: 2 },
        { columnName: 'Status', columnType: 'STATUS', sortOrder: 3 },
        { columnName: 'Date', columnType: 'DATE', sortOrder: 4 },
        { columnName: 'Priority', columnType: 'STATUS', sortOrder: 5 }
      ]
    }

    // Format Columns untuk Prisma (Nested Write)
    const columnsToCreate = rawColumns
      .filter(c => c && typeof c === 'object')
      .map((col, index) => {
        const prismaCol = {
          columnName: String(col.columnName || 'Untitled'),
          columnType: String(col.columnType || 'TEXT'),
          sortOrder: Number(col.sortOrder ?? index + 1),

          // HAPUS width jika tidak ada di schema
          calculationType: col.calculationType ? String(col.calculationType) : null,
          unit: col.unit ? String(col.unit) : null,
          txtInsertedBy: currentUser
        }

        // Handle `options` Relation (Fix: Hanya create jika array ada isi)
        if (Array.isArray(col.options) && col.options.length > 0) {
          prismaCol.options = {
            create: col.options.map((opt, i) => ({
              label: opt.label || 'Option',
              color: opt.color || '#cccccc',
              sortOrder: i + 1,
              txtInsertedBy: currentUser
            }))
          }
        }

        return prismaCol
      })

    // 4. Create Board
    const newBoard = await prisma.board.create({
      data: {
        workspaceId: parsedWorkspaceId,
        boardName: boardName.trim(),
        description: description || undefined,
        txtInsertedBy: currentUser,
        columns: { create: columnsToCreate },
        groups: { create: [{ groupName: 'Group Title', groupColor: '#579BFC', txtInsertedBy: currentUser }] },
        boardMember: { create: [{ userId, role: 'Owner', txtInsertedBy: currentUser }] }
      },
      include: { workspace: { select: { workspaceId: true, workspaceName: true } } }
    })

    return NextResponse.json(newBoard, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('SERVER ERROR [POST /api/boards]:', errorMessage)

    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 })
  }
}
