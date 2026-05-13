import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { sendMail } from '@/libs/mail'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
  const { taskId } = await params

  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ? BigInt(session.user.id) : null
    const txtInsertedBy = session?.user?.name || 'system'

    const body = await request.json()

    // Debugging Log
    console.log(`[API LOG] Update Value Task/Subtask ID: ${taskId}`, body)

    // 1. Verify Task Exists
    const taskExists = await prisma.task.findUnique({
      where: { taskId: BigInt(taskId) },
      include: { group: { include: { board: true } } }
    })

    if (!taskExists) {
      console.warn(`[API LOG] Task ${taskId} not found. Skipping update.`)
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    const column = await prisma.boardColumn.findUnique({
      where: { columnId: BigInt(body.intColumn_ID) }
    })

    const oldValueRecord = await prisma.trTaskValue.findUnique({
      where: {
        taskId_columnId: {
          taskId: BigInt(taskId),
          columnId: BigInt(body.intColumn_ID)
        }
      }
    })
    
    const oldValue = oldValueRecord?.value || null

    const updatedValue = await prisma.trTaskValue.upsert({
      where: {
        taskId_columnId: {
          taskId: BigInt(taskId), 
          columnId: BigInt(body.intColumn_ID)
        }
      },
      update: {
        value: body.txtValue,
        txtUpdatedBy: txtInsertedBy
      },
      create: {
        taskId: BigInt(taskId),
        columnId: BigInt(body.intColumn_ID),
        value: body.txtValue,
        txtInsertedBy: txtInsertedBy
      }
    })

    // Log Activity
    if (userId) {
      await prisma.logTaskActivity.create({
        data: {
          taskId: BigInt(taskId),
          userId: userId,
          actionType: 'UPDATE_COLUMN_VALUE',
          oldValue: oldValue,
          newValue: body.txtValue,
          description: `Updated column ${column?.columnName || body.intColumn_ID}`,
          txtInsertedBy: txtInsertedBy
        }
      })

      // Notifications for PERSON column
      if (column?.columnType === 'PERSON') {
        let oldUserIds = []
        let newUserIds = []
        
        try {
          if (oldValue && oldValue.startsWith('[')) oldUserIds = JSON.parse(oldValue)
          else if (oldValue) oldUserIds = [oldValue]
          
          if (body.txtValue && body.txtValue.startsWith('[')) newUserIds = JSON.parse(body.txtValue)
          else if (body.txtValue) newUserIds = [body.txtValue]
        } catch (e) {
          if (oldValue) oldUserIds = [oldValue]
          if (body.txtValue) newUserIds = [body.txtValue]
        }

        const addedUserIds = newUserIds.filter(id => !oldUserIds.includes(id))
        
        if (addedUserIds.length > 0) {
          const boardName = taskExists.group?.board?.boardName || 'Board'
          
          const notifications = addedUserIds.map(addedId => ({
            userId: BigInt(addedId),
            message: `${txtInsertedBy} assigned you to the task "${taskExists.taskTitle}" in board "${boardName}".`,
            link: `/board/${taskExists.group?.board?.boardId}`,
            txtInsertedBy: 'system'
          }))
          
          if (notifications.length > 0) {
            await prisma.trNotification.createMany({
              data: notifications
            })

            if (userId) {
              const recipients = await prisma.user.findMany({
                where: {
                  userId: {
                    in: addedUserIds.map(id => BigInt(id))
                  }
                },
                select: {
                  userId: true,
                  userName: true,
                  email: true
                }
              })

              const emails = recipients.map(rec => ({
                senderId: userId,
                recipientId: rec.userId,
                subject: `📋 Penugasan Tugas Baru: "${taskExists.taskTitle}"`,
                body: `Halo,

Anda telah ditugaskan oleh ${txtInsertedBy} untuk mengerjakan tugas berikut:
📌 Tugas: "${taskExists.taskTitle}"
📊 Board: "${boardName}"

Silakan kunjungi tautan berikut untuk melihat rincian papan kerja Anda:
/board/${taskExists.group?.board?.boardId}

Semangat mengerjakan!
-- Sistem Manajemen Proyek`,
                folder: 'inbox',
                txtInsertedBy: 'system'
              }))

              await prisma.internalMessage.createMany({
                data: emails
              })

              // Dispatch real external emails
              for (const rec of recipients) {
                if (rec.email) {
                  const emailSubject = `📋 Penugasan Tugas Baru: "${taskExists.taskTitle}"`
                  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                  const linkUrl = `${appUrl}/board/${taskExists.group?.board?.boardId}`
                  
                  const emailHtml = `
                    <div style="font-family: 'Public Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #7367f0; margin: 0;">Sistem Manajemen Proyek</h2>
                      </div>
                      <div style="background-color: #f8f7fa; border-left: 4px solid #7367f0; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333333;">Halo, ${rec.userName || 'Rekan Kerja'}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666666;">Anda baru saja diberikan penugasan baru oleh <strong>${txtInsertedBy}</strong>.</p>
                      </div>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; width: 30%; color: #555555;">📌 Tugas</td>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #333333;">${taskExists.taskTitle}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; font-weight: bold; color: #555555;">📊 Papan Kerja</td>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1; color: #333333;">${boardName}</td>
                        </tr>
                      </table>
                      <div style="text-align: center;">
                        <a href="${linkUrl}" style="background-color: #7367f0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Buka Papan Kerja</a>
                      </div>
                      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0 20px 0;" />
                      <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">Email ini dikirim secara otomatis oleh sistem. Jangan membalas email ini.</p>
                    </div>
                  `
                  
                  const emailText = `Halo ${rec.userName || 'Rekan Kerja'},\n\nAnda baru saja ditugaskan untuk tugas "${taskExists.taskTitle}" pada board "${boardName}" oleh ${txtInsertedBy}.\n\nBuka papan kerja Anda di sini:\n${linkUrl}`

                  // Non-blocking async sendMail execution
                  sendMail({
                    to: rec.email,
                    subject: emailSubject,
                    text: emailText,
                    html: emailHtml
                  })
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json(updatedValue)
  } catch (error) {
    console.error('🔴 [API LOG] Failed Update Value:', error)

    return NextResponse.json({ message: 'Failed to update task value' }, { status: 500 })
  }
}
