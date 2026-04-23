// Next Imports
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'WANATASK',
  description: 'WANATASK'
}

const RootLayout = async ({ children }) => {
  const systemMode = await getSystemMode()

  return (
    <html id='__next' lang='en' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        {children}
      </body>
    </html>
  )
}

export default RootLayout

