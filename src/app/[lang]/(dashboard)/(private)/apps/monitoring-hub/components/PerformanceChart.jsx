'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'

// Component Imports
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'

const PerformanceChart = ({ data, onRefresh }) => {
  const theme = useTheme()

  const activityChartConfig = {
    chart: {
      type: 'area',
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 4 },
    colors: [theme.palette.primary.main],
    fill: {
      type: 'gradient',
      gradient: { 
        shadeIntensity: 1, 
        opacityFrom: 0.5, 
        opacityTo: 0.05, 
        stops: [0, 90, 100]
      }
    },
    markers: {
        size: 5,
        colors: [theme.palette.primary.main],
        strokeColors: '#fff',
        strokeWidth: 3,
        hover: { size: 7 }
    },
    xaxis: {
      categories: data?.labels || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: theme.palette.text.disabled, fontWeight: 500 } }
    },
    yaxis: {
        labels: { style: { colors: theme.palette.text.disabled, fontWeight: 500 } }
    },
    grid: { 
        strokeDashArray: 8, 
        borderColor: theme.palette.divider,
        padding: { right: 20 }
    },
    tooltip: {
        theme: 'dark',
        x: { show: true },
        marker: { show: false }
    }
  }

  return (
    <Card sx={{ 
        height: '100%', 
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
    }}>
        <CardHeader 
            title='Productivity Velocity' 
            subheader='Team intensity trends (last 7 days)' 
            action={
                <IconButton onClick={onRefresh} sx={{ bgcolor: 'action.hover' }}>
                    <i className='tabler-refresh text-secondary' />
                </IconButton>
            }
        />
        <CardContent sx={{ height: 'calc(100% - 70px)', pt: 0 }}>
            {/* <AppReactApexCharts 
                type='area'
                height={340}
                options={activityChartConfig}
                series={data?.series || []}
            /> */}
        </CardContent>
    </Card>
  )
}

export default PerformanceChart
