// Next Imports
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'WANATASK',
  description: 'WANATASK'
}

const RootLayout = async props => {
  const params = await props.params
  const { children } = props

  // Vars
  const headersList = await headers()

  // =======================================================
  // PERUBAHAN UTAMA DI SINI
  // =======================================================
  // PERUBAHAN UTAMA DI SINI
  // =======================================================
  const systemMode = await getSystemMode()
  const direction = i18n.langDirection[params.lang]

  return (
    <TranslationWrapper headersList={headersList} lang={params.lang}>
      {children}
    </TranslationWrapper>
  )
}

export default RootLayout
