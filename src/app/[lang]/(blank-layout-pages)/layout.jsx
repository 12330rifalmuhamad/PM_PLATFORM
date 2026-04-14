// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getMode, getSystemMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

const Layout = async props => {
  const params = await props.params
  const { children } = props

  // Vars
  const direction = i18n.langDirection[params.lang]
  const mode = await getMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} systemMode={systemMode} settingsCookie={settingsCookie}>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout
