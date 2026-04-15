'use client'

import Typography from '@mui/material/Typography'

const UnderMaintenance = () => {
  return (
    <div className='flex flex-col gap-4 items-center'>
      <Typography variant='h4'>Under Maintenance</Typography>
      <Typography>This page is currently under maintenance. Please check back later.</Typography>
    </div>
  )
}

export default UnderMaintenance
