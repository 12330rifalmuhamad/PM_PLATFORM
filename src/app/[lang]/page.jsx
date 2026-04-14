'use client'

import { useEffect, use } from 'react'

import { useRouter } from 'next/navigation'

export default function LangPage({ params }) {
  const router = useRouter()
  const { lang } = use(params)

  useEffect(() => {
    // Redirect to dashboard
    router.replace(`/${lang}/dashboards/crm`)
  }, [router, lang])

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main mx-auto mb-4'></div>
        <p className='text-textSecondary'>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
