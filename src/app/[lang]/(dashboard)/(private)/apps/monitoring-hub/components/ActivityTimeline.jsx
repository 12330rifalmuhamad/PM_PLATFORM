'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

const ActivityTimeline = ({ activities }) => {
  const theme = useTheme()

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
        title='Activity Feed' 
        subheader='Live updates from members'
        action={
            <Tooltip title='View Full History'>
                <IconButton size='small'><i className='tabler-external-link text-textSecondary' /></IconButton>
            </Tooltip>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {activities?.map((activity, idx) => (
            <Box key={idx} sx={{ 
                display: 'flex', gap: 4, mb: 6, 
                position: 'relative',
                '&:not(:last-child):after': {
                    content: '""',
                    position: 'absolute',
                    left: 20, top: 44, bottom: -24,
                    width: 2, 
                    background: `linear-gradient(to bottom, ${theme.palette.primary.main}40, transparent)`
                }
            }}>
                <Avatar sx={{ 
                    width: 42, height: 42, 
                    border: `3px solid ${theme.palette.background.paper}`,
                    boxShadow: theme.shadows[3],
                    bgcolor: theme.palette.primary.light,
                    color: 'white',
                    zIndex: 1,
                    fontWeight: 700
                }}>
                    {activity.mUser?.userName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ 
                    flexGrow: 1, 
                    bgcolor: 'rgba(255, 255, 255, 0.5)', 
                    p: 4, 
                    borderRadius: 3,
                    border: '1px solid rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        transform: 'translateX(4px)'
                    }
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {activity.mUser?.userName}
                        </Typography>
                        <Typography variant='caption' sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <i className='tabler-clock text-[14px]' />
                            {new Date(activity.dtmInserted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Box>
                    <Typography variant='body2' sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {activity.actionType.replace(/_/g, ' ').toLowerCase()}
                        <Box component='span' sx={{ fontWeight: 600, color: 'primary.main', ml: 1 }}>
                            "{activity.task?.taskTitle}"
                        </Box>
                    </Typography>
                </Box>
            </Box>
        ))}
        {!activities?.length && (
            <Box sx={{ textAlign: 'center', py: 12, opacity: 0.5 }}>
                <i className='tabler-ghost text-5xl mb-4' />
                <Typography variant='body2' color='text.disabled'>No recent activities recorded.</Typography>
            </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline
