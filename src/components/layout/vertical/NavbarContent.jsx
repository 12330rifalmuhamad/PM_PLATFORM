// React Imports
import { useState, useEffect } from 'react'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'

import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import FullscreenToggle from '@components/layout/shared/FullscreenToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Vars
const shortcuts = [
  {
    url: '/dashboards/crm',
    icon: 'tabler-device-desktop-analytics',
    title: 'Dashboard',
    subtitle: 'Project Overview'
  },
  {
    url: '/user-profile',
    icon: 'tabler-user',
    title: 'My Profile',
    subtitle: 'Account Settings'
  },
  {
    url: '/apps/calendar',
    icon: 'tabler-calendar',
    title: 'Calendar',
    subtitle: 'Appointments'
  },
  {
    url: '/apps/email',
    icon: 'tabler-mail',
    title: 'Email',
    subtitle: 'Messages'
  },
  {
    url: '/react-table',
    icon: 'tabler-table',
    title: 'Tables',
    subtitle: 'Data Overview'
  },
  {
    url: '/apps/chat',
    icon: 'tabler-message',
    title: 'Chat',
    subtitle: 'Team Chat'
  }
]

const NavbarContent = () => {
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Polling setiap 30 detik
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
      </div>
      <div className='flex items-center'>
        <LanguageDropdown />
        <FullscreenToggle />
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown notifications={notifications} onRefresh={fetchNotifications} />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
