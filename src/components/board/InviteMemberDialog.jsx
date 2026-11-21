'use client'

import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Avatar,
  Box,
  Typography
} from '@mui/material'

const InviteMemberDialog = ({ open, onClose, boardId, onMemberAdded }) => {
  const [openSearch, setOpenSearch] = useState(false)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [inviting, setInviting] = useState(false)

  // Debounced search could be implemented here, but simplistic useEffect for now
  const handleSearch = async (event, value) => {
      if (value.length < 2) return

      setLoading(true)

      try {
          const res = await fetch(`/api/users/search?q=${value}`)

          if (res.ok) {
              const users = await res.json()

              setOptions(users)
          }
      } catch (error) {
          console.error("Search failed", error)
      } finally {
          setLoading(false)
      }
  }

  // --- MEMBER MANAGEMENT ---
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const loadMembers = async () => {
    if (!boardId) return
    setLoadingMembers(true)

    try {
        const res = await fetch(`/api/boards/${boardId}/members`)
        const data = await res.json()

        setMembers(Array.isArray(data) ? data : [])
    } catch (e) {
        console.error("Failed to load members", e)
    } finally {
        setLoadingMembers(false)
    }
  }

  useEffect(() => {
    if (open) {
        setOpenSearch(false)
        setOptions([]) 
        setSelectedUser(null)
        loadMembers()
    }
  }, [open, boardId])

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    
    try {
        const res = await fetch(`/api/boards/${boardId}/members/${userId}`, { method: 'DELETE' })

        if (!res.ok) {
            const err = await res.json()

            alert(err.message || 'Failed to remove member')
            
return
        }

        loadMembers() // Refresh list
    } catch (e) {
        console.error("Failed to remove member", e)
        alert('Error removing member')
    }
  }

  const handleInvite = async () => {
      if (!selectedUser) return
 
      setInviting(true)

      try {
          const res = await fetch(`/api/boards/${boardId}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: selectedUser.email })
          })
 
          if (!res.ok) {
              const err = await res.json()

              alert(err.message || 'Failed to invite')
              
return
          }
 
          const newMember = await res.json()

          if (onMemberAdded) onMemberAdded(newMember)
          
          // Clear selection but keep dialog open to show updated list
          setSelectedUser(null)
          setOptions([])
          loadMembers()
          
      } catch (error) {
          console.error("Invite failed", error)
          alert('Invite failed')
      } finally {
          setInviting(false)
      }
  }
 
  const handleClose = () => {
      setSelectedUser(null)
      setOptions([])
      onClose()
  }
 
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='xs'>
      <DialogTitle>Invite to Board</DialogTitle>
      <DialogContent className='pt-4'>
        <Autocomplete
            open={openSearch}
            onOpen={() => setOpenSearch(true)}
            onClose={() => setOpenSearch(false)}
            isOptionEqualToValue={(option, value) => option.userId === value.userId}
            getOptionLabel={(option) => option.userName || option.email}
            options={options}
            loading={loading}
            onInputChange={(e, value) => handleSearch(e, value)}
            onChange={(e, value) => setSelectedUser(value)}
            renderOption={(props, option) => (
                <li {...props} key={option.userId}>
                    <Box className='flex items-center gap-2'>
                        <Avatar className='w-8 h-8' alt={option.userName}>
                            {option.userName?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant='body2' className='font-medium'>{option.userName}</Typography>
                            <Typography variant='caption' color='textSecondary'>{option.email}</Typography>
                        </Box>
                    </Box>
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search by name or email"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
        {selectedUser && (
            <Box className='mt-4 p-3 bg-actionHover rounded flex items-center gap-3'>
                 <Avatar alt={selectedUser.userName}>{selectedUser.userName?.charAt(0)}</Avatar>
                 <Box>
                    <Typography className='font-medium'>Selected: {selectedUser.userName}</Typography>
                    <Typography variant='caption'>{selectedUser.email}</Typography>
                 </Box>
            </Box>
        )}

        {/* --- MEMBER LIST SECTION --- */}
        <Box className='mt-6'>
            <Typography variant='subtitle2' className='mb-2 text-textSecondary uppercase text-xs font-bold'>
                Current Members ({members.length})
            </Typography>
            <div className='max-h-[200px] overflow-y-auto space-y-2 pr-1'>
                {loadingMembers ? (
                    <Typography variant='caption' className='text-textSecondary'>Loading...</Typography>
                ) : members.length === 0 ? (
                    <Typography variant='caption' className='text-textSecondary italic'>No members yet</Typography>
                ) : (
                    members.map(m => {
                        const u = m.mUser || m.user || {}
                        const name = u.userName || 'Unknown'
                        const isOwner = m.role?.toLowerCase() === 'owner'
                        
                        return (
                            <div key={String(m.boardMemberId)} className='flex items-center justify-between p-2 rounded-lg border border-divider hover:bg-actionHover transition-colors group'>
                                <div className='flex items-center gap-3'>
                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>{name.charAt(0)}</Avatar>
                                    <div>
                                        <div className='text-sm font-medium flex items-center gap-1 text-textPrimary'>
                                            {name}
                                            {isOwner && <i className='tabler-crown text-amber-500 text-[10px]' />}
                                        </div>
                                        <div className='text-xs text-textSecondary capitalize'>{m.role}</div>
                                    </div>
                                </div>
                                <Button 
                                    className='opacity-0 group-hover:opacity-100 min-w-0 p-1 text-textDisabled hover:text-error-main transition-opacity'
                                    onClick={() => handleRemoveMember(m.userId)}
                                >
                                    <i className='tabler-trash' />
                                </Button>
                            </div>
                        )
                    })
                )}
            </div>
        </Box>

      </DialogContent>
      <DialogActions className='px-6 pb-4 pt-2'>
        <Button onClick={handleClose} color='inherit'>Back</Button>
        <Button onClick={handleInvite} variant='contained' disabled={!selectedUser || inviting}>
            {inviting ? <CircularProgress size={20} /> : 'Invite'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default InviteMemberDialog
