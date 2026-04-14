// React Imports
import { useRef, useEffect } from 'react'

// Next Imports
import { useSession } from 'next-auth/react'

// MUI Imports
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// Third-party Imports
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Group consecutive messages by same sender
const groupMessages = messages => {
  if (!messages?.length) return []

  const groups = []
  let currentGroup = null

  messages.forEach(msg => {
    if (!currentGroup || currentGroup.senderId !== msg.senderId) {
      currentGroup = { senderId: msg.senderId, senderName: msg.senderName, messages: [] }
      groups.push(currentGroup)
    }
    currentGroup.messages.push(msg)
  })

  return groups
}

// Scroll wrapper
const ScrollWrapper = ({ children, isBelowLgScreen, scrollRef, className }) => {
  if (isBelowLgScreen) {
    return (
      <div ref={scrollRef} className={classnames('bs-full overflow-y-auto overflow-x-hidden', className)}>
        {children}
      </div>
    )
  }
  return (
    <PerfectScrollbar ref={scrollRef} options={{ wheelPropagation: false }} className={className}>
      {children}
    </PerfectScrollbar>
  )
}

const ChatLog = ({ chatStore, isBelowLgScreen, isBelowMdScreen, isBelowSmScreen }) => {
  const { data: session } = useSession()
  const scrollRef = useRef(null)

  // Ambil roomId dari activeUser
  const activeUser = chatStore.activeUser
  const roomId = activeUser?.chat?.id

  // Ambil pesan dari state.messages[roomId]
  const messages = (roomId && chatStore.messages?.[roomId]) || []

  const messageGroups = groupMessages(messages)

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    if (!scrollRef.current) return
    if (isBelowLgScreen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    } else {
      scrollRef.current._container.scrollTop = scrollRef.current._container.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  const currentUserId = session?.user?.id?.toString()

  return (
    <ScrollWrapper isBelowLgScreen={isBelowLgScreen} scrollRef={scrollRef}>
      <CardContent className='p-0'>
        {messageGroups.length === 0 && (
          <div className='flex items-center justify-center p-6 text-textDisabled text-sm'>
            No messages yet. Say hello! 👋
          </div>
        )}
        {messageGroups.map((group, groupIdx) => {
          const isSender = group.senderId === currentUserId

          return (
            <div
              key={groupIdx}
              className={classnames('flex gap-4 p-6', { 'flex-row-reverse': isSender })}
            >
              {/* Avatar */}
              <CustomAvatar
                color='primary'
                skin={isSender ? 'filled' : 'light'}
                size={32}
              >
                {getInitials(isSender ? (session?.user?.name || 'Me') : (group.senderName || 'U'))}
              </CustomAvatar>

              {/* Messages */}
              <div
                className={classnames('flex flex-col gap-2', {
                  'items-end': isSender,
                  'max-is-[65%]': !isBelowMdScreen,
                  'max-is-[75%]': isBelowMdScreen && !isBelowSmScreen,
                  'max-is-[calc(100%-5.75rem)]': isBelowSmScreen
                })}
              >
                {group.messages.map((msg, msgIdx) => (
                  <div key={msgIdx} className='flex flex-col gap-1'>
                    <Typography
                      className={classnames('whitespace-pre-wrap pli-4 plb-2 shadow-xs', {
                        'bg-backgroundPaper rounded-e rounded-b': !isSender,
                        'bg-primary text-[var(--mui-palette-primary-contrastText)] rounded-s rounded-b': isSender
                      })}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {msg.message}
                    </Typography>
                    {msgIdx === group.messages.length - 1 && (
                      <Typography variant='caption' className={isSender ? 'text-right' : ''}>
                        {msg.time
                          ? new Date(msg.time).toLocaleString('en-US', {
                              hour: 'numeric',
                              minute: 'numeric',
                              hour12: true
                            })
                          : ''}
                      </Typography>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </ScrollWrapper>
  )
}

export default ChatLog
