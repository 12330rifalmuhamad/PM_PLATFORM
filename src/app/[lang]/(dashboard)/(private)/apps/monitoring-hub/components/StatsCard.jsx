'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'

const StatsCard = ({ title, data, icon, color }) => {
  const theme = useTheme()

  const sparklineConfig = {
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
        opacityFrom: 0.6,
        shadeIntensity: 1,
        stops: [0, 90, 100]
      }
    },
    xaxis: { labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
    yaxis: { show: false }
  }

  return (
    <Card sx={{ 
       overflow: 'hidden', 
       transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
       background: 'rgba(255, 255, 255, 0.6)',
       backdropFilter: 'blur(15px)',
       border: '1px solid rgba(255, 255, 255, 0.2)',
       boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
       '&:hover': { 
          transform: 'translateY(-8px)', 
          boxShadow: `0 12px 30px ${theme.palette[color]?.main || theme.palette.primary.main}20`,
          borderColor: `${theme.palette[color]?.main || theme.palette.primary.main}40`
       }
    }}>
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
              <CustomAvatar color={color} skin='light' variant='rounded' size={48} sx={{ borderRadius: 2 }}>
                  <i className={`${icon} text-2xl`} />
              </CustomAvatar>
               <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant='caption' sx={{ bgcolor: `${theme.palette[color]?.main || theme.palette.primary.main}15`, color: `${color}.main`, px: 2, py: 0.5, borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    {data?.trend ? 'Trending Up' : 'Active'}
                </Typography>
              </Box>
        </Box>
        <Typography variant='h3' sx={{ mb: 1, fontWeight: 800, letterSpacing: '-1px' }}>{data?.value || 0}</Typography>
        <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 4, fontWeight: 500, opacity: 0.8 }}>{title}</Typography>
      </CardContent>
      {/* <AppReactApexCharts 
          type='area'
          height={90}
          options={sparklineConfig}
          series={[{ name: title, data: data?.trend || [0,0,0,0,0,0,0] }]}
      /> */}
    </Card>
  )
}

export default StatsCard
