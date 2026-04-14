// React Imports
import { useState } from 'react'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Slice Imports
import { startNewChat, fetchChatRooms } from '@/redux-store/slices/chat'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomChip from '@core/components/mui/Chip'
import UserProfileLeft from './UserProfileLeft'
import AvatarWithBadge from './AvatarWithBadge'
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { formatDateToMonthShort } from './utils'

export const statusObj = {
  busy: 'error',
  away: 'warning',
  online: 'success',
  offline: 'secondary'
}

// Render chat list
const renderChat = props => {
  // Props
  const { chatStore, getActiveUserData, setSidebarOpen, backdropOpen, setBackdropOpen, isBelowMdScreen } = props

  if (!chatStore.rooms || chatStore.rooms.length === 0) {
    return (
      <li className='text-center p-4 text-sm text-textDisabled'>
        No conversations yet. Search for a contact to start chatting.
      </li>
    )
  }

  return chatStore.rooms.map(room => {
    const isChatActive = chatStore.activeUser?.id === room.userId

    return (
      <li
        key={room.id}
        className={classnames('flex items-start gap-4 pli-3 plb-2 cursor-pointer rounded mbe-1', {
          'bg-primary shadow-primarySm': isChatActive,
          'text-[var(--mui-palette-primary-contrastText)]': isChatActive
        })}
        onClick={() => {
          getActiveUserData(room.userId)
          isBelowMdScreen && setSidebarOpen(false)
          isBelowMdScreen && backdropOpen && setBackdropOpen(false)
        }}
      >
        <CustomAvatar
          color='primary'
          skin={isChatActive ? 'filled' : 'light'}
          alt={room.name}
        >
          {getInitials(room.name || 'U')}
        </CustomAvatar>
        <div className='min-is-0 flex-auto'>
          <Typography color='inherit'>{room.name}</Typography>
          <Typography variant='body2' color={isChatActive ? 'inherit' : 'text.secondary'} className='truncate'>
            {room.lastMessage || 'No messages yet'}
          </Typography>
        </div>
        <div className='flex flex-col items-end justify-start'>
          <Typography
            variant='body2'
            color='inherit'
            className={classnames('truncate', { 'text-textDisabled': !isChatActive })}
          >
            {room.lastMessageTime ? formatDateToMonthShort(new Date(room.lastMessageTime)) : null}
          </Typography>
          {room.unseenMsgs > 0 ? <CustomChip round='true' label={room.unseenMsgs} color='error' size='small' /> : null}
        </div>
      </li>
    )
  })
}

// Scroll wrapper for chat list
const ScrollWrapper = ({ children, isBelowLgScreen }) => {
  if (isBelowLgScreen) {
    return <div className='bs-full overflow-y-auto overflow-x-hidden'>{children}</div>
  } else {
    return <PerfectScrollbar options={{ wheelPropagation: false }}>{children}</PerfectScrollbar>
  }
}

const SidebarLeft = props => {
  // Props
  const {
    chatStore,
    getActiveUserData,
    dispatch,
    backdropOpen,
    setBackdropOpen,
    sidebarOpen,
    setSidebarOpen,
    isBelowLgScreen,
    isBelowMdScreen,
    isBelowSmScreen,
    messageInputRef
  } = props

  // States
  const [userSidebar, setUserSidebar] = useState(false)
  const [searchValue, setSearchValue] = useState()

  const handleChange = async (event, newValue) => {
    if (!newValue) return
    setSearchValue(null)

    // Cari contact berdasarkan nama yang dipilih dari dropdown
    const contact = chatStore.contacts.find(c => c.fullName === newValue)
    if (!contact) return

    // 1. Buat / buka room chat dengan user ini via API
    await dispatch(startNewChat({ targetUserId: contact.id }))

    // 2. Refresh daftar room dan tunggu hingga selesai
    //    Setelah ini, state.rooms sudah terisi dengan roomId yang benar
    await dispatch(fetchChatRooms())

    // 3. Baru set active user — reducer getActiveUserData akan menemukan
    //    room di state.rooms dan mengisi chat.id dengan benar
    getActiveUserData(contact.id)

    isBelowMdScreen && setSidebarOpen(false)
    setBackdropOpen(false)
    messageInputRef.current?.focus()
  }

  return (
    <>
      <Drawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className='bs-full'
        variant={!isBelowMdScreen ? 'permanent' : 'persistent'}
        ModalProps={{
          disablePortal: true,
          keepMounted: true // Better open performance on mobile.
        }}
        sx={{
          zIndex: isBelowMdScreen && sidebarOpen ? 11 : 10,
          position: !isBelowMdScreen ? 'static' : 'absolute',
          ...(isBelowSmScreen && sidebarOpen && { width: '100%' }),
          '& .MuiDrawer-paper': {
            overflow: 'hidden',
            boxShadow: 'none',
            width: isBelowSmScreen ? '100%' : '370px',
            position: !isBelowMdScreen ? 'static' : 'absolute'
          }
        }}
      >
        <div className='flex items-center plb-[18px] pli-6 gap-4 border-be'>
          <AvatarWithBadge
            alt={chatStore.profileUser.fullName}
            src={chatStore.profileUser.avatar}
            badgeColor={statusObj[chatStore.profileUser.status]}
            onClick={() => {
              setUserSidebar(true)
            }}
          />
          <div className='flex is-full items-center flex-auto sm:gap-x-3'>
            <Autocomplete
              fullWidth
              size='small'
              id='select-contact'
              options={chatStore.contacts.map(contact => contact.fullName) || []}
              value={searchValue || null}
              onChange={handleChange}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  variant='outlined'
                  placeholder='Search Contacts'
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-search' />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              )}
              renderOption={(props, option) => {
                const contact = chatStore.contacts.find(contact => contact.fullName === option)

                return (
                  <li
                    {...props}
                    key={option.toLowerCase().replace(/\s+/g, '-')}
                    className={classnames('gap-3 max-sm:pli-3', props.className)}
                  >
                    {contact ? (
                      contact.avatar ? (
                        <Avatar
                          alt={contact.fullName}
                          src={contact.avatar}
                          key={option.toLowerCase().replace(/\s+/g, '-')}
                        />
                      ) : (
                        <CustomAvatar
                          color={contact.avatarColor}
                          skin='light'
                          key={option.toLowerCase().replace(/\s+/g, '-')}
                        >
                          {getInitials(contact.fullName)}
                        </CustomAvatar>
                      )
                    ) : null}
                    {option}
                  </li>
                )
              }}
            />
            {isBelowMdScreen ? (
              <IconButton
                className='mis-2'
                size='small'
                onClick={() => {
                  setSidebarOpen(false)
                  setBackdropOpen(false)
                }}
              >
                <i className='tabler-x text-2xl' />
              </IconButton>
            ) : null}
          </div>
        </div>
        <ScrollWrapper isBelowLgScreen={isBelowLgScreen}>
          <ul className='p-3 pbs-4'>
            {renderChat({
              chatStore,
              getActiveUserData,
              backdropOpen,
              setSidebarOpen,
              isBelowMdScreen,
              setBackdropOpen
            })}
          </ul>
        </ScrollWrapper>
      </Drawer>

      <UserProfileLeft
        userSidebar={userSidebar}
        setUserSidebar={setUserSidebar}
        profileUserData={chatStore.profileUser}
        dispatch={dispatch}
        isBelowLgScreen={isBelowLgScreen}
        isBelowSmScreen={isBelowSmScreen}
      />
    </>
  )
}

export default SidebarLeft
