'use client'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'

import useSWR from 'swr'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

// Component Imports
import CreateWorkspaceModal from '@/components/dialogs/CreateWorkspaceModal'
import CreateBoardModal from '@/components/dialogs/CreateBoardModal'

// Impor state management modal
import { useModalStore } from '@/store/useModalStore'

const fetcher = url => fetch(url).then(res => res.json())

export default function ProjectDashboard() {
  const router = useRouter()
  const openModal = useModalStore(state => state.openModal)

  const { data: workspaces, error, isLoading, mutate } = useSWR('/api/workspaces', fetcher)

  const darkModeClasses = 'bg-backgroundPaper text-textPrimary'

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-96 ${darkModeClasses}`}>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-96 text-red-500 ${darkModeClasses}`}>
        Error: Gagal memuat workspace
      </div>
    )
  }

  const handleWorkspaceClick = workspaceId => {
    router.push(`/project-management/workspace/${workspaceId}`)
  }

  const handleBoardClick = boardId => {
    router.push(`/project-management/board/${boardId}`)
  }

  return (
    <div className={`min-h-screen ${darkModeClasses}`}>
      {/* Header */}
      <Box className='px-6 pt-6 pb-4 border-b border-divider'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <Typography variant='h4' className='!font-bold mb-2'>
              Project Management
            </Typography>
            <Typography variant='body1' className='text-textSecondary'>
              Kelola workspace dan board project Anda
            </Typography>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outlined'
              startIcon={<i className='tabler-folder-plus' />}
              onClick={() => openModal('CREATE_WORKSPACE')}
              className='!normal-case'
            >
              New Workspace
            </Button>
            <Button
              variant='contained'
              startIcon={<i className='tabler-layout-board' />}
              onClick={() => openModal('CREATE_BOARD')}
              className='!normal-case'
            >
              New Board
            </Button>
          </div>
        </div>
      </Box>

      {/* Content */}
      <Box className='p-6'>
        {!workspaces || workspaces.length === 0 ? (
          <div className='text-center py-12'>
            <i className='tabler-folder-off text-6xl text-textDisabled mb-4' />
            <Typography variant='h6' className='mb-2 text-textSecondary'>
              Belum ada workspace
            </Typography>
            <Typography variant='body2' className='text-textDisabled mb-4'>
              Buat workspace pertama Anda untuk memulai project management
            </Typography>
            <Button
              variant='contained'
              startIcon={<i className='tabler-folder-plus' />}
              onClick={() => openModal('CREATE_WORKSPACE')}
              className='!normal-case'
            >
              Buat Workspace Pertama
            </Button>
          </div>
        ) : (
          <Grid container spacing={3}>
            {workspaces.map(workspace => (
              <Grid item xs={12} md={6} lg={4} key={workspace.workspaceId}>
                <Card
                  className='hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={() => handleWorkspaceClick(workspace.workspaceId)}
                >
                  <CardContent className='pb-2'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        <i className='tabler-folder text-2xl text-primary-main' />
                        <Typography variant='h6' className='!font-semibold'>
                          {workspace.workspaceName}
                        </Typography>
                      </div>
                      <IconButton size='small' color='secondary'>
                        <i className='tabler-dots' />
                      </IconButton>
                    </div>

                    <Typography variant='body2' className='text-textSecondary mb-3'>
                      {workspace.boards?.length || 0} boards
                    </Typography>

                    {workspace.boards && workspace.boards.length > 0 && (
                      <div className='space-y-2'>
                        {workspace.boards.slice(0, 3).map(board => (
                          <div
                            key={board.boardId}
                            className='flex items-center gap-2 p-2 rounded-md hover:bg-actionHover transition-colors cursor-pointer'
                            onClick={e => {
                              e.stopPropagation()
                              handleBoardClick(board.boardId)
                            }}
                          >
                            <i className='tabler-layout-board text-sm text-textSecondary' />
                            <Typography variant='body2' className='flex-1'>
                              {board.boardName}
                            </Typography>
                            <Chip label={board.groups?.length || 0} size='small' color='primary' variant='outlined' />
                          </div>
                        ))}
                        {workspace.boards.length > 3 && (
                          <Typography variant='caption' className='text-textDisabled'>
                            +{workspace.boards.length - 3} boards lainnya
                          </Typography>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardActions className='pt-0 pb-3 px-3'>
                    <div className='flex items-center justify-between w-full'>
                      <div className='flex items-center gap-1'>
                        <AvatarGroup max={3} className='!h-6'>
                          {workspace.workspaceMember?.slice(0, 3).map(member => (
                            <Avatar key={member.workspaceMemberId} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {member.mUser?.userName?.charAt(0) || 'U'}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Typography variant='caption' className='text-textSecondary ml-1'>
                          {workspace.workspaceMember?.length || 0} members
                        </Typography>
                      </div>
                      <Tooltip title='Open workspace'>
                        <IconButton size='small' color='primary'>
                          <i className='tabler-arrow-right' />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Modals */}
      <CreateWorkspaceModal onSuccess={() => mutate()} />
      <CreateBoardModal onSuccess={() => mutate()} />
    </div>
  )
}
