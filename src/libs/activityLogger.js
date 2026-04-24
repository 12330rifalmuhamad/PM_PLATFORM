import prisma from './prisma'

/**
 * Log user activity to the database
 * @param {Object} params
 * @param {BigInt} params.userId - The ID of the user performing the action
 * @param {BigInt} [params.taskId] - Optional Task ID related to the action
 * @param {string} params.actionType - Type of action (e.g., 'CREATE_TASK', 'UPDATE_NOTE')
 * @param {string} [params.description] - Human-readable description
 * @param {string} [params.oldValue] - Previous state
 * @param {string} [params.newValue] - New state
 */
export async function logActivity({ 
    userId, 
    taskId = null, 
    actionType, 
    description = '', 
    oldValue = null, 
    newValue = null 
}) {
  try {
    // Create activity log
    const log = await prisma.logTaskActivity.create({
      data: {
        userId,
        taskId,
        actionType,
        description,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null,
        dtmInserted: new Date()
      }
    })

    // Create notification for the user (and potentially others in the future)
    await prisma.trNotification.create({
        data: {
            userId,
            message: description || actionType.replace(/_/g, ' '),
            link: taskId ? `/apps/kanban` : null,
            isRead: 0
        }
    })

    return log
  } catch (error) {
    console.error('[ACTIVITY_LOG_ERROR]', error)
    return null
  }
}
