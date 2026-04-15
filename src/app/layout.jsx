// Style Imports
import '@/app/globals.css'
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'WANATASK',
  description: 'WANATASK'
}

const RootLayout = async ({ children }) => {
  return (
    <html id='__next' lang='en' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>{children}</body>
    </html>
  )
}

export default RootLayout

