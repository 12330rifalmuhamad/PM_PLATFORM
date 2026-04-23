'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

// MUI Imports
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment,
  Chip,
  Tab,
  Divider,
  useTheme
} from '@mui/material'

import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// Third-party imports
import { Controller, useForm } from 'react-hook-form'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Helper function for glassmorphism
const hexToRGBA = (hex, alpha) => {
  if (!hex) return `rgba(0,0,0,${alpha})`
  
  // Handle shorthand hex colors (#abc)
  let fullHex = hex
  if (hex.length === 4) {
    fullHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }

  const r = parseInt(fullHex.slice(1, 3), 16)
  const g = parseInt(fullHex.slice(3, 5), 16)
  const b = parseInt(fullHex.slice(5, 7), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const UserProfilePage = () => {
  const { data: session, update } = useSession()
  const theme = useTheme()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [profileImage, setProfileImage] = useState('')
  const [activeTab, setActiveTab] = useState('personal-info')

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      company: '',
      website: '',
      location: '',
      jobTitle: ''
    }
  })

  // Fetch initial data
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const { user } = await response.json()
        setProfileImage(user.image || '')
        reset({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.bio || '',
          company: user.company || '',
          location: user.location || '',
          jobTitle: user.jobTitle || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setFetching(false)
    }
  }, [reset])

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session, fetchProfile])

  // Handle form submission
  const onSubmit = async data => {
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image: profileImage })
      })

      if (!response.ok) throw new Error('Failed to update profile')

      const result = await response.json()

      setSnackbar({
        open: true,
        message: result.message || 'Profile updated successfully!',
        severity: 'success'
      })

      await update({
        ...session,
        user: {
          ...session.user,
          name: data.name,
          email: data.email,
          image: '/api/user/image' // Just a placeholder, the JWT callback will handle it
        }
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update profile. Please try again.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle profile image change
  const handleImageChange = event => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        setProfileImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = async event => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.target)
    const currentPassword = formData.get('currentPassword')
    const newPassword = formData.get('newPassword')
    const confirmPassword = formData.get('confirmPassword')

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Failed to change password')

      setSnackbar({ open: true, message: result.message || 'Password changed successfully!', severity: 'success' })
      event.target.reset()
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to change password.', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  if (fetching) {
    return (
        <Box className='flex items-center justify-center min-h-[400px]'>
            <CircularProgress />
        </Box>
    )
  }

  return (
    <Box className='relative'>
      {/* Decorative Background */}
      <Box 
        sx={{ 
            height: 250, 
            width: '100%', 
            borderRadius: 3, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            position: 'relative',
            overflow: 'hidden',
            mb: -12,
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
      >
        <Box sx={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.1 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100" fill="white" />
            </svg>
        </Box>
        <Typography variant='h2' sx={{ color: 'white', fontWeight: 'bold', letterSpacing: 2, opacity: 0.2 }}>
            MY PROFILE
        </Typography>
      </Box>

      <Grid container spacing={6}>
        <Grid item xs={12}>
            <TabContext value={activeTab}>
                <Box className='flex justify-center'>
                    <Card sx={{ 
                        display: 'inline-flex', 
                        mt: 0, 
                        p: 1.5, 
                        borderRadius: 10, 
                        backgroundColor: hexToRGBA(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <TabList onChange={handleTabChange} sx={{ border: 'none', minHeight: 'auto' }}>
                            <Tab value='personal-info' label='Profile' icon={<i className='tabler-user mr-1' />} iconPosition='start' sx={{ borderRadius: 10, minHeight: 40 }} />
                            <Tab value='password' label='Security' icon={<i className='tabler-shield-lock mr-1' />} iconPosition='start' sx={{ borderRadius: 10, minHeight: 40 }} />
                            <Tab value='notifications' label='Settings' icon={<i className='tabler-settings mr-1' />} iconPosition='start' sx={{ borderRadius: 10, minHeight: 40 }} />
                        </TabList>
                    </Card>
                </Box>
                
                <Box className='mt-8'>
                    <TabPanel value='personal-info' className='p-0'>
                    <Grid container spacing={6}>
                        <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            height: '100%', 
                            backgroundColor: hexToRGBA(theme.palette.background.paper, 0.8),
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <CardContent className='flex flex-col items-center gap-6 py-10'>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={profileImage}
                                        alt={session?.user?.name || 'User'}
                                        sx={{ 
                                            width: 140, 
                                            height: 140, 
                                            borderRadius: 4, 
                                            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                                            border: `4px solid ${theme.palette.background.paper}`
                                        }}
                                    />
                                    <Box
                                        component='label'
                                        sx={{
                                            position: 'absolute',
                                            bottom: -10,
                                            right: -10,
                                            backgroundColor: 'primary.main',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: theme.shadows[4],
                                            '&:hover': { backgroundColor: 'primary.dark' }
                                        }}
                                    >
                                        <i className='tabler-camera text-xl' />
                                        <input hidden type='file' accept='image/*' onChange={handleImageChange} />
                                    </Box>
                                </Box>

                                <Box className='text-center'>
                                    <Typography variant='h4' fontWeight='bold'>{session?.user?.name || 'User'}</Typography>
                                    <Typography variant='body1' sx={{ color: 'text.secondary', mt: 1 }}>{session?.user?.email}</Typography>
                                    <Chip label='Active Member' size='small' color='primary' variant='tonal' sx={{ mt: 2 }} />
                                </Box>

                                <Divider className='w-full opacity-50' />

                                <Box className='w-full'>
                                    <Typography variant='overline' color='text.disabled' fontWeight='bold'>Short Bio</Typography>
                                    <Typography variant='body2' sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                                        {control._defaultValues.bio || "No bio added yet. Write something about yourself!"}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        </Grid>

                        <Grid item xs={12} md={8}>
                            <Card sx={{ 
                                backgroundColor: hexToRGBA(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <CardContent sx={{ p: { xs: 4, sm: 8 } }}>
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <Grid container spacing={6}>
                                            <Grid item xs={12}>
                                                <Typography variant='h5' fontWeight='600' className='flex items-center gap-2'>
                                                    <i className='tabler-user-edit text-primary' /> General Information
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='name'
                                                    control={control}
                                                    rules={{ required: true }}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth label='Full Name' placeholder='John Doe' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='email'
                                                    control={control}
                                                    rules={{ required: true }}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth type='email' label='Email' placeholder='john.doe@example.com' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='jobTitle'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth label='Job Title' placeholder='Product Designer' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='company'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth label='Company' placeholder='Apple Inc.' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='phone'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth label='Phone Number' placeholder='+1 (234) 567-8901' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Controller
                                                    name='location'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth label='Location' placeholder='California, USA' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Controller
                                                    name='bio'
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomTextField fullWidth multiline rows={4} label='Bio' placeholder='Tell us something about yourself...' {...field} />
                                                    )}
                                                />
                                            </Grid>
                                            
                                            <Grid item xs={12} className='flex gap-4 mt-2'>
                                                <Button variant='contained' type='submit' disabled={loading} size='large' sx={{ borderRadius: 2, px: 8 }}>
                                                    {loading ? <CircularProgress size={24} /> : 'Save Profile'}
                                                </Button>
                                                <Button variant='tonal' color='secondary' onClick={() => reset()} size='large' sx={{ borderRadius: 2 }}>Reset</Button>
                                            </Grid>
                                        </Grid>
                                    </form>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    </TabPanel>
                    
                    <TabPanel value='password' className='p-0'>
                        <Card sx={{ 
                            maxWidth: 800, 
                            mx: 'auto',
                            backgroundColor: hexToRGBA(theme.palette.background.paper, 0.8),
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <CardContent sx={{ p: { xs: 4, sm: 8 } }}>
                                <Typography variant='h5' fontWeight='600' className='mb-6 flex items-center gap-2'>
                                    <i className='tabler-shield-lock text-primary' /> Change Password
                                </Typography>
                                <form onSubmit={handlePasswordChange}>
                                    <Grid container spacing={6}>
                                        <Grid item xs={12}>
                                            <CustomTextField
                                                fullWidth
                                                name='currentPassword'
                                                label='Current Password'
                                                type='password'
                                                placeholder='············'
                                                InputProps={{
                                                    startAdornment: <InputAdornment position='start'><i className='tabler-lock' /></InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <CustomTextField
                                                fullWidth
                                                name='newPassword'
                                                label='New Password'
                                                type='password'
                                                placeholder='············'
                                                InputProps={{
                                                    startAdornment: <InputAdornment position='start'><i className='tabler-key' /></InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <CustomTextField
                                                fullWidth
                                                name='confirmPassword'
                                                label='Confirm New Password'
                                                type='password'
                                                placeholder='············'
                                                InputProps={{
                                                    startAdornment: <InputAdornment position='start'><i className='tabler-key' /></InputAdornment>
                                                }}
                                            />
                                        </Grid>
                                        
                                        <Grid item xs={12} className='mt-2'>
                                                <Button variant='contained' type='submit' disabled={loading} size='large' sx={{ borderRadius: 2, px: 8 }}>
                                                    {loading ? <CircularProgress size={24} /> : 'Update Password'}
                                                </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>
                    </TabPanel>
                    
                    <TabPanel value='notifications' className='p-0'>
                        <Card sx={{ 
                            maxWidth: 800, 
                            mx: 'auto',
                            backgroundColor: hexToRGBA(theme.palette.background.paper, 0.8),
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <CardContent sx={{ p: { xs: 4, sm: 8 } }}>
                                <Typography variant='h5' fontWeight='600' className='flex items-center gap-2'>
                                    <i className='tabler-settings text-primary' /> Account Settings
                                </Typography>
                                <Typography variant='body2' className='mt-2 text-textSecondary'>Notification and account preferences will appear here.</Typography>
                                <Box className='mt-10 p-10 border border-dashed border-divider rounded-lg text-center'>
                                    <i className='tabler-clock text-4xl text-textDisabled mb-4' />
                                    <Typography variant='body1' color='text.disabled'>Advanced settings are coming soon.</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </TabPanel>
                </Box>
            </TabContext>
        </Grid>
        
        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ borderRadius: 2, boxShadow: theme.shadows[4], width: '100%' }}>
            {snackbar.message}
            </Alert>
        </Snackbar>
      </Grid>
    </Box>
  )
}

export default UserProfilePage
