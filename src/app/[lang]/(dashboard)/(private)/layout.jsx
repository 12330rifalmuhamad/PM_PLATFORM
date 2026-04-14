// Next Imports
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

// Component Imports
import ProtectedLayoutContent from '@/components/layout/ProtectedLayoutContent'
import Providers from '@components/Providers'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children } = props
  const params = await props.params

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${params.lang}/login`)
  }

  // Ambil data di server
  const direction = i18n.langDirection[params.lang]
  const dictionary = await getDictionary(params.lang)

  const mode = await getMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <TranslationWrapper headersList={headers()} lang={params.lang}>
      <Providers direction={direction} mode={mode} systemMode={systemMode} settingsCookie={settingsCookie}>
        <ProtectedLayoutContent
          direction={direction}
          dictionary={dictionary}
          mode={mode}
          systemMode={systemMode}
          locale={params.lang}
        >
          {children}
        </ProtectedLayoutContent>
      </Providers>
    </TranslationWrapper>
  )
}

export default Layout
