'use client'

import { useState } from 'react'

import useSWR, { useSWRConfig } from 'swr'
import { useSession } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'

const fetcher = async url => {
  const res = await fetch(url)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))

    throw new Error(errorData.message || 'Failed to fetch updates')
  }

  return res.json()
}

export default function ItemDetailPanel({ item, board, onClose }) {
  const { data: session } = useSession()
  const { mutate } = useSWRConfig()
  const [newUpdateText, setNewUpdateText] = useState('')

  const updatesUrl = `/api/tasks/${item.taskId}/updates`

  const { data: updates, error, isLoading } = useSWR(updatesUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000
  })

  const handlePostUpdate = async () => {
    if (!newUpdateText.trim()) return

    const currentUpdates = Array.isArray(updates) ? updates : []

    // Optimistic UI: Tambahkan update baru ke cache SWR secara lokal
    // sebelum request ke server selesai, agar UI terasa instan.
    mutate(
      updatesUrl,
      [
        ...currentUpdates,
        {
          updateText: newUpdateText,
          user: session?.user || {},
          dtmInserted: new Date().toISOString(),
          isOptimistic: true
        }
      ],
      false
    )

    // Kirim request ke API
    await fetch(updatesUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateText: newUpdateText })
    })

    // Reset input dan trigger revalidasi dari server
    setNewUpdateText('')
    mutate(updatesUrl)
  }

  return (
    <div className='fixed top-0 right-0 h-full w-full md:w-1/3 bg-backgroundPaper border-l border-divider shadow-2xl z-[2000] transform transition-transform duration-300 ease-in-out translate-x-0'>
      <Card className='h-full flex flex-col bg-backgroundPaper text-textPrimary'>
        {/* Header Panel */}
        <CardContent className='flex items-center justify-between border-b border-divider'>
          <Typography variant='h6' className='!font-semibold'>
            {item.taskTitle}
          </Typography>
          <IconButton onClick={onClose} className='!text-textSecondary hover:!text-textPrimary'>
            <i className='tabler-x' />
          </IconButton>
        </CardContent>

        {/* Konten (Updates) */}
        <CardContent className='flex-1 overflow-y-auto'>
          {isLoading && (
            <div className='flex justify-center mt-8'>
              <CircularProgress />
            </div>
          )}
          {error && <Typography color='error'>Gagal memuat updates.</Typography>}
          <div className='space-y-6'>
            {Array.isArray(updates) && updates.length === 0 && !isLoading && !error && (
              <Typography variant='body2' className='text-textSecondary text-center py-4'>
                Belum ada update untuk task ini.
              </Typography>
            )}
            {Array.isArray(updates) &&
              updates.map((update, index) => (
              <div
                key={update.updateId || `optimistic-${index}`}
                className={`flex gap-4 ${update.isOptimistic ? 'opacity-60' : ''}`}
              >
                {(() => {
                  const displayName = update?.user?.userName || update?.user?.name || 'User'

                  const initial =
                    typeof displayName === 'string' && displayName.length > 0 ? displayName.charAt(0) : 'U'

                  return <Avatar>{initial}</Avatar>
                })()}
                <div className='flex-1 bg-actionHover border border-divider p-3 rounded-lg'>
                  <div className='flex justify-between items-center mb-1'>
                    <Typography variant='subtitle2' className='!font-bold'>
                      {update?.user?.userName || update?.user?.name || 'User'}
                    </Typography>
                    <Typography variant='caption' className='text-textSecondary'>
                      {new Date(update.dtmInserted).toLocaleString('id-ID')}
                    </Typography>
                  </div>
                  <Typography variant='body2'>{update.updateText}</Typography>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {/* Form Input Update Baru */}
        <CardContent className='border-t border-divider'>
          <div className='flex gap-4'>
            {(() => {
              const me = session?.user
              const displayName = me?.name || me?.userName || 'U'
              const initial = typeof displayName === 'string' && displayName.length > 0 ? displayName.charAt(0) : 'U'

              return <Avatar>{initial}</Avatar>
            })()}
            <div className='flex-1'>
              <TextField
                fullWidth
                multiline
                variant='outlined'
                placeholder='Write an update...'
                value={newUpdateText}
                onChange={e => setNewUpdateText(e.target.value)}
                className='bg-backgroundDefault rounded'
              />
              <Button variant='contained' className='!mt-2' onClick={handlePostUpdate} disabled={!newUpdateText.trim()}>
                Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
