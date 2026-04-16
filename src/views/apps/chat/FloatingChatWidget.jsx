'use client'

// React Imports
import { useEffect, useState, useRef } from 'react'

// MUI Imports
import {
  Fab,
  Paper,
  Box,
  Typography,
  IconButton,
  CardHeader,
  Divider,
  Fade,
  ClickAwayListener,
  Badge,
  useTheme
} from '@mui/material'

// Third-party Imports
import { useDispatch, useSelector } from 'react-redux'
import classnames from 'classnames'

// Slice Imports
import {
  fetchChatRooms,
  fetchContacts,
  getActiveUserData,
  setMessagesEmpty
} from '@/redux-store/slices/chat'

// Component Imports
import SidebarLeft from './SidebarLeft'
import ChatContent from './ChatContent'
import CustomAvatar from '@core/components/mui/Avatar'

const FloatingChatWidget = () => {
  // States
  const [isOpen, setIsOpen] = useState(false)
  const [showContent, setShowContent] = useState(false) // View toggle: list vs content

  // Refs
  const messageInputRef = useRef(null)

  // Hooks
  const dispatch = useDispatch()
  const theme = useTheme()
  const chatStore = useSelector(state => state.chatReducer)

  // Total unread calculation
  const totalUnread = chatStore.rooms.reduce((acc, room) => acc + (room.unseenMsgs || 0), 0)

  // Load rooms and contacts
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchChatRooms())
      dispatch(fetchContacts())
    }
  }, [isOpen, dispatch])

  // Monitor active user to switch views if needed
  useEffect(() => {
    if (chatStore.activeUser?.id && isOpen) {
      setShowContent(true)
    }
  }, [chatStore.activeUser, isOpen])

  const toggleWidget = () => setIsOpen(prev => !prev)

  const handleBackToList = () => {
    setShowContent(false)
    dispatch(getActiveUserData(null)) // Deactivate current chat in store
  }

  const handleActiveUser = id => {
    dispatch(getActiveUserData(id))
    setShowContent(true)
  }

  return (
    <Box className='mui-fixed' sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1200 }}>
      {/* PopUp Window */}
      <Fade in={isOpen}>
        <Paper
          elevation={12}
          sx={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            width: { xs: 'calc(100vw - 40px)', sm: 360 },
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: theme.shadows[18],
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {/* Header */}
          <CardHeader
            title={showContent ? chatStore.activeUser?.fullName || 'Chat' : 'Messenger'}
            avatar={
              showContent && (
                <IconButton size='small' onClick={handleBackToList}>
                  <i className='tabler-chevron-left' />
                </IconButton>
              )
            }
            action={
              <IconButton size='small' onClick={toggleWidget}>
                <i className='tabler-x' />
              </IconButton>
            }
            titleTypographyProps={{ variant: 'h6' }}
            sx={{ p: 3, bgcolor: 'background.paper', borderBottom: `1px solid ${theme.palette.divider}` }}
          />

          <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative', bgcolor: 'background.default' }}>
            {!showContent ? (
              /* Room List View */
              <SidebarLeft
                chatStore={chatStore}
                getActiveUserData={handleActiveUser}
                dispatch={dispatch}
                isBelowMdScreen={true}
                disableDrawer={true}
                setSidebarOpen={() => {}}
                setBackdropOpen={() => {}}
                messageInputRef={messageInputRef}
              />
            ) : (
              /* Chat Thread View */
              <ChatContent
                chatStore={chatStore}
                dispatch={dispatch}
                isBelowMdScreen={true}
                isBelowSmScreen={true}
                isBelowLgScreen={true}
                messageInputRef={messageInputRef}
                setSidebarOpen={() => setShowContent(false)}
                setBackdropOpen={() => {}}
              />
            )}
          </Box>
        </Paper>
      </Fade>

      {/* Toggle Button */}
      <Badge badgeContent={totalUnread} color='error' overlap='circular'>
        <Fab
          color='primary'
          onClick={toggleWidget}
          sx={{
            boxShadow: theme.shadows[10],
            '&:hover': { transform: 'scale(1.05)' },
            transition: 'transform 0.2s'
          }}
        >
          {isOpen ? <i className='tabler-chevron-down text-2xl' /> : <i className='tabler-message-2 text-2xl' />}
        </Fab>
      </Badge>
    </Box>
  )
}

export default FloatingChatWidget
