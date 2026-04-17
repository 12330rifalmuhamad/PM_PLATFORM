'use client'

// Component Imports
import Button from '@mui/material/Button'

import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'
import AuthGuard from '@/hocs/AuthGuard'

// PASTIKAN MODAL PROVIDER DIIMPOR DI SINI
import ModalProvider from '@/components/ModalProvider'
import RotateOverlay from '@/components/layout/shared/RotateOverlay'
import FloatingChatWidget from '@/views/apps/chat/FloatingChatWidget'
import FloatingNotesWidget from '@/views/apps/notes/FloatingNotesWidget'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Config Imports
import { i18n } from '@configs/i18n'

const ProtectedLayoutContent = props => {
  const { direction, dictionary, mode, systemMode, children, locale } = props
  const { settings } = useSettings()

  return (
    <>
      {/* ModalProvider HARUS ADA DI SINI agar bisa aktif di semua halaman */}
      <ModalProvider />
      <RotateOverlay />

      <AuthGuard locale={locale}>
        <LayoutWrapper
          systemMode={systemMode}
          verticalLayout={
            <VerticalLayout
              navigation={<Navigation dictionary={dictionary} mode={mode} />}
              navbar={<Navbar />}
              footer={<VerticalFooter />}
            >
              {children}
            </VerticalLayout>
          }
          horizontalLayout={<></>}
        />
        <ScrollToTop className='mui-fixed'>
          <Button
            variant='contained'
            className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
          >
            <i className='tabler-arrow-up' />
          </Button>
        </ScrollToTop>
        <Customizer dir={direction} />
        <FloatingChatWidget />
        <FloatingNotesWidget />
      </AuthGuard>
    </>
  )
}

export default ProtectedLayoutContent
