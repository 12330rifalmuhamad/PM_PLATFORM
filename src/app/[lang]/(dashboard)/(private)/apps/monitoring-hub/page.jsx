'use client'

// React Imports
import { useEffect, useState, useCallback, useMemo } from 'react'

// Next Imports
import { useSession } from 'next-auth/react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import Skeleton from '@mui/material/Skeleton'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'
import StatsCard from './components/StatsCard'
import ActivityTimeline from './components/ActivityTimeline'
import PerformanceChart from './components/PerformanceChart'

const MonitoringHub = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(null)
  
  const theme = useTheme()
  const { data: session } = useSession()

  const fetchData = useCallback(() => {
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
  }, [])

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    fetchData()
    return () => clearInterval(timer)
  }, [fetchData])

  const statusDonutConfig = useMemo(() => ({
    labels: data?.charts?.statusDistribution?.labels || [],
    colors: [
      theme.palette.success?.main || '#28C76F', 
      theme.palette.primary?.main || '#7367F0', 
      theme.palette.warning?.main || '#FF9F43', 
      theme.palette.info?.main || '#00CFE8', 
      theme.palette.error?.main || '#EA5455'
    ],
    chart: { type: 'donut' },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', labels: { colors: theme.palette.text.secondary } },
    plotOptions: {
        pie: {
            donut: {
                size: '75%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: 'Tasks',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        formatter: () => data?.stats?.activeTasks?.value || 0
                    },
                    name: { fontSize: '0.875rem' },
                    value: { fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary }
                }
            }
        }
    }
  }), [data, theme])

  if (loading && !data) return (
    <Box sx={{ p: 4 }}>
      <Skeleton variant="text" sx={{ fontSize: '3rem', width: '40%', mb: 4 }} />
      <Skeleton variant="rounded" height={220} sx={{ mb: 6, borderRadius: 4 }} />
      <Grid container spacing={6}>
        {[1, 2, 3, 4].map(idx => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}><Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} /></Grid>
        ))}
      </Grid>
    </Box>
  )

  if (!data) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
        <Typography variant='h5' color='text.secondary' sx={{ mb: 4 }}>Initializing Command Center...</Typography>
        <LinearProgress sx={{ maxWidth: '400px', mx: 'auto', borderRadius: 2 }} />
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
      {/* Premium Hero Card with Glassmorphism Overlay */}
      <Grid size={{ xs: 12 }}>
        <Card sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'common.white',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 5,
          boxShadow: '0 12px 40px rgba(115, 103, 240, 0.35)'
        }}>
          {/* Animated Background Decoration */}
          <Box sx={{ 
            position: 'absolute', top: -100, right: -100, 
            width: 400, height: 400, 
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          
          <CardContent sx={{ p: { xs: 6, md: 12 }, position: 'relative' }}>
            <Grid container spacing={6} alignItems='center'>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant='h2' color='inherit' sx={{ mb: 2, fontWeight: 800, letterSpacing: '-1.5px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        Good {!currentTime ? 'Day' : currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {session?.user?.name || 'Rifal'}!
                    </Typography>
                    <Typography variant='h6' color='inherit' sx={{ opacity: 0.85, mb: 8, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 400 }}>
                        <i className='tabler-calendar-event text-2xl' />
                        {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <Box sx={{ 
                            background: 'rgba(255, 255, 255, 0.12)', 
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '16px',
                            px: 5, py: 2.5,
                            display: 'flex', alignItems: 'center', gap: 3,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            <Box sx={{ 
                                width: 12, height: 12, bgcolor: '#28C76F', borderRadius: '50%', 
                                boxShadow: '0 0 15px #28C76F',
                                animation: 'pulse 2s infinite'
                            }} />
                            <Typography color='inherit' variant='body1' sx={{ fontWeight: 600 }}>Command Center: Active</Typography>
                        </Box>
                        
                        <Box sx={{ 
                            background: 'rgba(255, 255, 255, 0.12)', 
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            borderRadius: '16px',
                            px: 5, py: 2.5,
                            display: 'flex', alignItems: 'center', gap: 3,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            <i className='tabler-clock text-xl' />
                            <Typography color='inherit' variant='h5' sx={{ fontWeight: 700, letterSpacing: '1px' }}>
                                {currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid size={{ xs: 0, md: 4 }} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                    <Box sx={{ 
                        width: 180, height: 180, 
                        background: 'rgba(255, 255, 255, 0.15)', 
                        backdropFilter: 'blur(25px)',
                        borderRadius: '35%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.1)',
                        transform: 'rotate(5deg)'
                    }}>
                        <i className='tabler-rocket text-[90px] text-white' style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }} />
                    </Box>
                </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Sparkline Stats Grid */}
      {statsCards.map((card, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard {...card} />
        </Grid>
      ))}

      {/* Main Analytical Section */}
      <Grid size={{ xs: 12 }}>
        <PerformanceChart data={data?.charts?.activityTimeline} onRefresh={fetchData} />
      </Grid>

      {/* Detailed Activity & Performance Feed */}
      <Grid size={{ xs: 12, md: 7 }}>
        <ActivityTimeline activities={data?.recentActivity} />
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Grid container spacing={6}>
            <Grid size={12}>
                <Card sx={{ 
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <CardHeader title='Member Performance' subheader='Contribution Index' />
                    <CardContent>
                        {data?.charts?.workload?.map((member, idx) => (
                            <Box key={idx} sx={{ mb: 6 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5, alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <CustomAvatar skin='light' color={idx === 0 ? 'primary' : 'secondary'} size={32} sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                                            {member.name?.charAt(0)}
                                        </CustomAvatar>
                                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>{member.name}</Typography>
                                    </Box>
                                    <Typography variant='caption' sx={{ fontWeight: 700, color: 'text.primary' }}>{member.activity} pts</Typography>
                                </Box>
                                <LinearProgress 
                                    variant='determinate' 
                                    value={Math.min((member.activity / 15) * 100, 100)} 
                                    color={member.activity > 10 ? 'success' : member.activity > 5 ? 'primary' : 'warning'}
                                    sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
                                />
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </Grid>
            
            <Grid size={12}>
                <Card sx={{ 
                    background: theme.palette.mode === 'light' 
                        ? 'linear-gradient(135deg, #FF4D4D 0%, #B30000 100%)' 
                        : 'linear-gradient(135deg, #B30000 0%, #660000 100%)',
                    color: 'white', 
                    borderRadius: 4,
                    boxShadow: '0 8px 25px rgba(234, 84, 85, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                        <i className='tabler-alert-triangle text-[120px]' />
                    </Box>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 6, py: 6 }}>
                        <CustomAvatar skin='filled' color='white' variant='rounded' size={58} sx={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)', bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                            <i className='tabler-flame text-3xl text-white' />
                        </CustomAvatar>
                        <Box>
                            <Typography variant='h4' color='inherit' sx={{ fontWeight: 800 }}>{data?.stats?.urgentCount?.value}</Typography>
                            <Typography variant='h6' color='inherit' sx={{ fontWeight: 600, opacity: 0.9 }}>Critical Alerts</Typography>
                            <Typography variant='body2' color='inherit' sx={{ opacity: 0.7 }}>Immediate intervention required</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
      </Grid>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(40, 199, 111, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(40, 199, 111, 0); }
            100% { box-shadow: 0 0 0 0 rgba(40, 199, 111, 0); }
        }
      `}</style>
    </Grid>
  )
}

const MonitoringHubPage = () => {
  return (
    <Box sx={{ maxWidth: '1600px', margin: '0 auto', p: { xs: 0, sm: 2, md: 4 } }}>
        <MonitoringHub />
    </Box>
  )
}

export default MonitoringHubPage
