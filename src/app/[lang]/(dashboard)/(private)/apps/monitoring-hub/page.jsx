'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomChip from '@core/components/mui/Chip'

const MonitoringHub = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const theme = useTheme()

  useEffect(() => {
    fetch('/api/monitoring')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <Typography>Loading Hub...</Typography>

  const stats = [
    { title: 'Active Tasks', value: data?.stats?.activeTasks || 0, icon: 'tabler-clipboard-list', color: 'primary' },
    { title: 'Unread Chats', value: data?.stats?.chatRooms || 0, icon: 'tabler-message-2', color: 'success' },
    { title: 'Personal Notes', value: data?.stats?.notes || 0, icon: 'tabler-notes', color: 'warning' },
    { title: 'Urgent Alert', value: data?.urgentTasks?.length || 0, icon: 'tabler-alert-triangle', color: 'error' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Top statistics cards */}
      {stats.map((item, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent className='flex justify-between items-center'>
              <div className='flex flex-col'>
                <Typography variant='h4'>{item.value}</Typography>
                <Typography variant='body2'>{item.title}</Typography>
              </div>
              <CustomAvatar color={item.color} skin='light' variant='rounded' size={44}>
                <i className={`${item.icon} text-2xl`} />
              </CustomAvatar>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Main Monitoring Section */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Recent Activities' subheader='Real-time work monitor' action={
            <CustomChip label='Live' color='success' skin='light' size='small' />
          } />
          <CardContent>
            {data?.recentActivity?.map((activity, idx) => (
              <Box key={idx} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Avatar sx={{ width: 38, height: 38, fontSize: '1rem' }}>
                  {activity.mUser?.userName?.charAt(0) || 'U'}
                </Avatar>
                <div className='flex flex-col flex-grow'>
                  <div className='flex justify-between items-center'>
                    <Typography variant='body1' sx={{ fontWeight: 500 }}>{activity.mUser?.userName}</Typography>
                    <Typography variant='caption'>{new Date(activity.dtmInserted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                  </div>
                  <Typography variant='body2' color='text.secondary'>
                    {activity.actionType} <strong>{activity.task?.taskTitle}</strong>
                  </Typography>
                </div>
              </Box>
            ))}
            {(!data?.recentActivity || data?.recentActivity.length === 0) && (
              <Typography variant='body2' color='text.disabled' className='text-center py-10'>No recent activities recorded.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Sidebar Monitoring Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Urgent Tasks' subheader='Tasks needing immediate attention' />
          <CardContent>
            {data?.urgentTasks?.map((task, idx) => (
              <Box key={idx} sx={{ mb: 5 }}>
                <div className='flex justify-between items-center mbe-2'>
                  <Typography variant='body1' sx={{ fontWeight: 500 }} className='truncate max-is-[70%]'>
                    {task.taskTitle}
                  </Typography>
                  <Chip label={task.group?.groupName} size='small' variant='outlined' />
                </div>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                  Progress Monitoring
                </Typography>
                <LinearProgress variant='determinate' value={60} color='primary' sx={{ height: 6, borderRadius: 3 }} />
              </Box>
            ))}
             {(!data?.urgentTasks || data?.urgentTasks.length === 0) && (
              <Typography variant='body2' color='text.disabled' className='text-center py-10'>Everything is on track!</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}


const MonitoringHubPage = () => {
  return (
    <Box>
      <Typography variant='h3' sx={{ mb: 6 }}>Monitoring Hub</Typography>
      <MonitoringHub />
    </Box>
  )
}

export default MonitoringHubPage
