'use client'

import React from 'react'
import { Typography, useTheme, keyframes } from '@mui/material'
import useMediaQuery from '@menu/hooks/useMediaQuery'

const RotateOverlay = () => {
  // Logic: Show only if max-width is small (mobile/tablet) AND orientation is portrait
  // We use standard CSS media queries for orientation
  const isMobile = useMediaQuery('768px') 
  
  // Custom hook usage for orientation might be tricky with the existing hook if it only takes width.
  // The existing useMediaQuery hook uses window.matchMedia.
  // We can pass a complex query to it if it supports it, or standard CSS.
  
  // Let's use a CSS-in-JS approach for the orientation visibility to be safe and performant
  // effectively hiding it via CSS when not matching.
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-backgroundPaper flex-col items-center justify-center text-center p-8 hidden portrait:flex md:portrait:hidden"
      style={{
          // We only want this to appear on small screens (< 768px) that are portrait.
          // Tailwind's 'portrait:' prefix works, but we also need to constrain by width.
          // The 'md:hidden' ensures it doesn't show on tablets/desktops even if portrait (like an iPad usually effectively landscape-ish or enough space).
          // Actually iPad portrait is often > 768px width depending on model. 
          // Let's rely on the specific requirement: "Mobile device like handphone". 
          // Use CSS media query logic directly in style/className for robustness.
      }}
    >
        <style jsx global>{`
          @media screen and (max-width: 600px) and (orientation: portrait) {
            .rotate-overlay {
              display: flex !important;
            }
          }
        `}</style>
      
        <div className="rotate-overlay hidden flex-col items-center justify-center h-full w-full fixed inset-0 bg-[#0f111c] text-white z-[9999] p-6">
            <div className="animate-spin-slow mb-6">
                <i className="tabler-device-mobile-rotary text-6xl text-primary" />
            </div>
            <Typography variant="h4" className="mb-2 font-bold text-white">
                Please Rotate Device
            </Typography>
            <Typography className="text-gray-400 max-w-xs mx-auto">
                We recommend using landscape mode for the best experience on this device.
            </Typography>
        </div>
    </div>
  )
}

export default RotateOverlay
