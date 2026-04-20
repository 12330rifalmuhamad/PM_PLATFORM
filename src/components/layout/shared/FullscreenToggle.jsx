'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

const FullscreenToggle = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Check if fullscreen is supported
  if (typeof document !== 'undefined' && !document.fullscreenEnabled) {
    return null
  }

  return (
    <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
      <IconButton 
        color='inherit' 
        onClick={toggleFullscreen}
        sx={{ color: 'text.secondary' }}
      >
        <i className={isFullscreen ? 'tabler-arrows-minimize' : 'tabler-arrows-maximize'} />
      </IconButton>
    </Tooltip>
  )
}

export default FullscreenToggle
