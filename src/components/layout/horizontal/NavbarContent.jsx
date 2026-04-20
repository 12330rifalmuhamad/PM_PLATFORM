// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import NavSearch from '@components/layout/shared/search'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import FullscreenToggle from '@components/layout/shared/FullscreenToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'
import { getLocalizedUrl } from '@/utils/i18n'

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
  // States
  const [notifications, setNotifications] = useState([])

  // Hooks
  const { isBreakpointReached } = useHorizontalNav()
  const { lang: locale } = useParams()

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
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && (
          <Link href={getLocalizedUrl('/', locale)}>
            <Logo />
          </Link>
        )}
      </div>

      <div className='flex items-center'>
        <NavSearch />
        <LanguageDropdown />
        <FullscreenToggle />
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown notifications={notifications} onRefresh={fetchNotifications} />
        <UserDropdown />
        {/* Language Dropdown, Notification Dropdown, quick access menu dropdown, user dropdown will be placed here */}
      </div>
    </div>
  )
}

export default NavbarContent
