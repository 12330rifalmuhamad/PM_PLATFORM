'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useSession } from 'next-auth/react'

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
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Button from '@mui/material/Button'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomChip from '@core/components/mui/Chip'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'

const MonitoringHub = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(null) // Init as null for hydration safety
  
  const theme = useTheme()
  const { data: session } = useSession()

  useEffect(() => {
    setCurrentTime(new Date()) // Set on mount
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = () => {
    setLoading(true)
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
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getSparklineConfig = (color) => ({
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: { width: 2.5, curve: 'smooth' },
    grid: { show: false, padding: { bottom: 10 } },
    fill: {
      type: 'gradient',
      gradient: {
        opacityTo: 0,
        opacityFrom: 0.5,
        shadeIntensity: 1,
        stops: [0, 100],
        colorStops: [
          [{ offset: 0, opacity: 0.5, color: color === 'primary' ? '#7367F0' : color === 'success' ? '#28C76F' : color === 'warning' ? '#FF9F43' : '#EA5455' },
           { offset: 100, opacity: 0, color: '#ffffff' }]
        ]
      }
    },
    xaxis: { labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
    yaxis: { show: false }
  })

  const activityChartConfig = {
    chart: {
      type: 'area',
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#7367F0'],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] }
    },
    xaxis: {
      categories: data?.charts?.activityTimeline?.labels || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#a8aaae' } }
    },
    yaxis: {
        labels: { style: { colors: '#a8aaae' } }
    },
    grid: { strokeDashArray: 8, borderColor: '#e6e6e8' }
  }

  const statusDonutConfig = {
    labels: data?.charts?.statusDistribution?.labels || [],
    colors: [
      '#28C76F', // success
      '#7367F0', // primary
      '#FF9F43', // warning
      '#00CFE8', // info
      '#EA5455'  // error
    ],
    chart: { type: 'donut' },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', labels: { colors: theme.palette.text.secondary } },
    plotOptions: {
        pie: {
            donut: {
                size: '80%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: 'Tasks',
                        fontSize: '1.25rem',
                        color: '#6d6f77',
                        formatter: () => data?.stats?.activeTasks?.value || 0
                    }
                }
            }
        }
    }
  }

  if (loading && !data) return (
    <Box sx={{ p: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '3rem', width: '40%', mb: 4 }} />
      <Skeleton variant="rounded" height={200} sx={{ mb: 6 }} />
      <Grid container spacing={6}>
        {[1, 2, 3, 4].map(idx => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}><Skeleton variant="rounded" height={150} /></Grid>
        ))}
      </Grid>
    </Box>
  )

  const statsCards = [
    { title: 'Active Tasks', data: data?.stats?.activeTasks, icon: 'tabler-clipboard-list', color: 'primary' },
    { title: 'Unread Chats', data: data?.stats?.chatRooms, icon: 'tabler-message-2', color: 'success' },
    { title: 'Quick Notes', data: data?.stats?.notes, icon: 'tabler-notes', color: 'warning' },
    { title: 'Urgent Action', data: data?.stats?.urgentCount, icon: 'tabler-alert-triangle', color: 'error' }
  ]

  return (
    <Grid container spacing={6}>
      {/* Premium Hero Card */}
      <Grid size={{ xs: 12 }}>
        <Card sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'common.white',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(115, 103, 240, 0.3)'
        }}>
          <Box sx={{ position: 'absolute', bottom: -50, right: -50, opacity: 0.15 }}>
            <i className='tabler-chart-pie text-[250px]' />
          </Box>
          <CardContent sx={{ p: { xs: 6, md: 10 }, position: 'relative' }}>
            <Grid container spacing={6} alignItems='center'>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant='h3' color='inherit' sx={{ mb: 2, fontWeight: 700, letterSpacing: '-0.5px' }}>
                        Good {!currentTime ? 'Day' : currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {session?.user?.name || 'Rifal'}!
                    </Typography>
                    <Typography variant='h6' color='inherit' sx={{ opacity: 0.9, mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <i className='tabler-calendar-event' />
                        {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <Box sx={{ 
                            background: 'rgba(255, 255, 255, 0.15)', 
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 2,
                            px: 4, py: 2,
                            display: 'flex', alignItems: 'center', gap: 3
                        }}>
                            <Box sx={{ width: 10, height: 10, bgcolor: theme.palette.success.main, borderRadius: '50%', boxShadow: `0 0 10px ${theme.palette.success.main}` }} />
                            <Typography color='inherit' variant='body2' sx={{ fontWeight: 500 }}>System Monitoring: Active</Typography>
                        </Box>
                        <Box sx={{ 
                            background: 'rgba(255, 255, 255, 0.15)', 
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: 2,
                            px: 4, py: 2,
                            display: 'flex', alignItems: 'center', gap: 3
                        }}>
                            <i className='tabler-clock' />
                            <Typography color='inherit' variant='body2' sx={{ fontWeight: 500 }}>{currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 0, md: 4 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                    <Box sx={{ 
                        width: 160, height: 160, 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <i className='tabler-rocket text-[80px] text-white animate-bounce' />
                    </Box>
                </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Interactive Stats Cards with Sparklines */}
      {statsCards.map((card, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
             overflow: 'hidden', 
             transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
             '&:hover': { transform: 'translateY(-8px)', boxShadow: theme.shadows[8] }
          }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <CustomAvatar color={card.color} skin='light' variant='rounded' size={46}>
                        <i className={`${card.icon} text-2xl`} />
                    </CustomAvatar>
                    <Typography variant='caption' sx={{ bgcolor: `${theme.palette[card.color].main}15`, color: `${card.color}.main`, px: 2, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                        {card.data?.trend ? 'Trending Up' : 'Active'}
                    </Typography>
              </Box>
              <Typography variant='h4' sx={{ mb: 0.5, fontWeight: 700 }}>{card.data?.value || 0}</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>{card.title}</Typography>
            </CardContent>
            <AppReactApexCharts 
                type='area'
                height={80}
                options={getSparklineConfig(card.color)}
                series={[{ data: card.data?.trend || [0,0,0,0,0,0,0] }]}
            />
          </Card>
        </Grid>
      ))}

      {/* Middle Section: Main Chart & Status */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader 
                title='Productivity Velocity' 
                subheader='Cumulative team record (last 7 days)' 
                action={
                    <IconButton onClick={fetchData}><i className='tabler-refresh text-secondary' /></IconButton>
                }
            />
            <CardContent sx={{ height: 'calc(100% - 70px)' }}>
                <AppReactApexCharts 
                    type='area'
                    height={320}
                    options={activityChartConfig}
                    series={data?.charts?.activityTimeline?.series || []}
                />
            </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader title='Status Health' subheader='Current distribution' />
            <CardContent sx={{ height: 'calc(100% - 70px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AppReactApexCharts 
                    type='donut'
                    height={300}
                    options={statusDonutConfig}
                    series={data?.charts?.statusDistribution?.series || []}
                />
                {!data?.charts?.statusDistribution?.series?.length && (
                    <Typography color='text.disabled' align='center' sx={{ my: 10 }}>No status data available yet.</Typography>
                )}
            </CardContent>
        </Card>
      </Grid>

      {/* Bottom Section: Activity Feed & Workload */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader title='Activity Timeline' subheader='Latest events from your workspace' />
          <CardContent>
            {data?.recentActivity?.map((activity, idx) => (
                <Box key={idx} sx={{ 
                    display: 'flex', gap: 4, mb: 6, 
                    position: 'relative',
                    '&:not(:last-child):after': {
                        content: '""',
                        position: 'absolute',
                        left: 19, top: 40, bottom: -20,
                        width: 2, bgcolor: theme.palette.divider
                    }
                }}>
                    <Avatar sx={{ 
                        width: 40, height: 40, 
                        border: `2px solid ${theme.palette.background.paper}`,
                        boxShadow: theme.shadows[2],
                        bgcolor: theme.palette.primary.light,
                        color: 'primary.contrastText',
                        zIndex: 1
                    }}>
                        {activity.mUser?.userName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, bgcolor: 'action.hover', p: 4, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>{activity.mUser?.userName}</Typography>
                            <Typography variant='caption'>{new Date(activity.dtmInserted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </Box>
                        <Typography variant='body2' color='text.secondary'>
                            {activity.actionType.replace('_', ' ')}: <strong>{activity.task?.taskTitle}</strong>
                        </Typography>
                    </Box>
                </Box>
            ))}
            {!data?.recentActivity?.length && (
                <Typography variant='body2' color='text.disabled' className='text-center py-10'>No recent activities recorded.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Grid container spacing={6}>
            <Grid size={12}>
                <Card sx={{ borderRadius: 3 }}>
                    <CardHeader title='Team Performance' subheader='Member intensity index' />
                    <CardContent>
                        {data?.charts?.workload?.map((member, idx) => (
                            <Box key={idx} sx={{ mb: 6 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant='subtitle2'>{member.name}</Typography>
                                    <Typography variant='body2' color='text.secondary'>{member.activity} activities</Typography>
                                </Box>
                                <LinearProgress 
                                    variant='determinate' 
                                    value={Math.min((member.activity / 15) * 100, 100)} 
                                    color={member.activity > 10 ? 'success' : member.activity > 5 ? 'primary' : 'warning'}
                                    sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }}
                                />
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={12}>
                <Card sx={{ 
                    bgcolor: 'error.light', 
                    color: 'error.contrastText', 
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.error.main}40`
                }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CustomAvatar skin='filled' color='error' variant='rounded' size={54} sx={{ boxShadow: theme.shadows[4] }}>
                            <i className='tabler-alert-triangle text-3xl' />
                        </CustomAvatar>
                        <Box>
                            <Typography variant='h6' color='inherit' sx={{ fontWeight: 600 }}>{data?.stats?.urgentCount?.value} Urgent Priorities</Typography>
                            <Typography variant='body2' color='inherit' sx={{ opacity: 0.85 }}>Critical items require your immediate oversight</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

const MonitoringHubPage = () => {
  return (
    <Box sx={{ maxWidth: '1600px', margin: '0 auto', p: { xs: 0, sm: 2 } }}>
        <MonitoringHub />
    </Box>
  )
}

export default MonitoringHubPage
