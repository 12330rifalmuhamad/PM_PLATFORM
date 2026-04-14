// MUI Imports
import Link from 'next/link'

import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'

// Next-Auth Imports
import { getServerSession } from 'next-auth'

import { authOptions } from '@/app/api/auth/[...nextauth]/route'

import { getBoardsForWorkspace } from '@/libs/data'

// Fungsi untuk mendapatkan sapaan berdasarkan waktu
const getGreeting = () => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'

  return 'Good evening'
}

const CrmDashboardPage = async () => {
  // Ambil sesi pengguna di server
  const session = await getServerSession(authOptions)
  const recentBoards = await getBoardsForWorkspace(session?.user?.id)

  const greeting = getGreeting()
  const userName = session?.user?.name || 'Guest'

  return (
    <div className='p-8'>
      {/* --- Bagian Sapaan --- */}
      <div className='mb-8'>
        <Typography variant='h4' component='h1' className='text-textPrimary font-semibold'>
          {`${greeting}, ${userName}!`}
        </Typography>
        <Typography className='text-textSecondary'>Quickly access your recent boards, Inbox and workspaces</Typography>
      </div>

      {/* --- Layout Utama: Konten & Sidebar Kanan --- */}
      <Grid container spacing={6}>
        {/* Kolom Konten Utama (kiri) */}
        <Grid item xs={12} md={8}>
          <div className='flex flex-col gap-6'>
            {/* Kartu Recently Visited */}
            <Paper elevation={0} className='p-6 rounded-lg border'>
              <Typography variant='h6' className='font-semibold mb-4 flex items-center gap-2'>
                {/* PERBAIKAN: Ikon yang lebih sesuai untuk 'recent' */}
                <i className='tabler-clock text-primary' /> Recently visited
              </Typography>

              <Grid container spacing={4}>
                {/* PERBAIKAN: Gunakan variabel 'recentBoards' */}
                {Array.isArray(recentBoards) && recentBoards.length > 0 ? (
                  recentBoards.slice(0, 3).map(board => (
                    <Grid item xs={12} sm={6} md={4} key={board.boardId}>
                      <Link href={`/board/${board.boardId}`}>
                        <Box className='border rounded-lg hover:border-primary transition-colors cursor-pointer'>
                          <Box className='h-24 bg-actionHover rounded-t-lg flex items-center justify-center'>
                            {/* Placeholder untuk thumbnail board */}
                            <i className='tabler-layout-kanban text-4xl text-textDisabled' />
                          </Box>
                          <div className='p-3 flex justify-between items-center'>
                            <Typography className='font-medium text-textPrimary'>{board.boardName}</Typography>
                            <IconButton size='small'>
                              <i className='tabler-star text-textSecondary hover:text-warning' />
                            </IconButton>
                          </div>
                        </Box>
                      </Link>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography className='text-textSecondary text-center py-8'>No recent boards found.</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Link Update Feed */}
            <Link href='#'>
              <Typography className='font-semibold text-textPrimary hover:text-primary flex items-center gap-2'>
                <i className='tabler-arrow-right' /> Update feed (Inbox){' '}
                <span className='bg-actionHover text-xs px-2 py-0.5 rounded-full'>0</span>
              </Typography>
            </Link>
          </div>
        </Grid>

        {/* Kolom Sidebar Kanan */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} className='p-6 rounded-lg border'>
            <Typography variant='h6' className='font-semibold mb-4'>
              Learn & get inspired
            </Typography>
            <div className='flex flex-col gap-4'>
              <Button
                variant='outlined'
                color='secondary'
                className='!justify-start !p-3 !normal-case'
              >
                <div className='bg-blue-500/20 p-2 rounded-md mr-4'>
                  <i className='tabler-rocket text-blue-400' />
                </div>
                <div>
                  <Typography className='font-semibold text-left'>Getting started</Typography>
                  <Typography variant='body2' className='text-textSecondary text-left'>
                    Learn how monday.com works
                  </Typography>
                </div>
              </Button>
              <Button
                variant='outlined'
                color='secondary'
                className='!justify-start !p-3 !normal-case'
              >
                <div className='bg-purple-500/20 p-2 rounded-md mr-4'>
                  <i className='tabler-help-circle text-purple-400' />
                </div>
                <div>
                  <Typography className='font-semibold text-left'>Help center</Typography>
                  <Typography variant='body2' className='text-textSecondary text-left'>
                    Learn and get support
                  </Typography>
                </div>
              </Button>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  )
}

export default CrmDashboardPage
