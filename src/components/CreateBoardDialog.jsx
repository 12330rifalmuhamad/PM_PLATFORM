'use client'

import { useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import useSWR from 'swr'
import * as XLSX from 'xlsx'

const fetcher = url => fetch(url).then(res => res.json())

export default function CreateBoardDialog({ open, onClose, workspaceId, onBoardCreated }) {
  const [boardTitle, setBoardTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch daftar template
  const { data: templates, isLoading } = useSWR(open ? '/api/templates' : null, fetcher)

  const handleSubmit = async () => {
    if (!boardTitle.trim()) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardName: boardTitle,
          workspaceId: workspaceId,
          templateId: selectedTemplate || null,
          isImporting: !!importFile
        })
      })

      if (!res.ok) {
        const errorData = await res.json()

        throw new Error(errorData.message || 'Failed')
      }

      const newBoard = await res.json()

      // --- IMPORT PROCESS ---
      if (importFile) {
        try {
          const data = await importFile.arrayBuffer()
          const workbook = XLSX.read(data)
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length > 0) {
              await fetch(`/api/boards/${newBoard.boardId}/import`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: jsonData })
            })
          }
        } catch (importErr) {
          console.error('Import failed during creation:', importErr)
          alert('Board created, but import failed: ' + importErr.message)
        }
      }

      if (onBoardCreated) onBoardCreated(newBoard)

      handleClose()
    } catch (error) {
      console.error(error)
      alert(`Gagal membuat board: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setBoardTitle('')
    setSelectedTemplate('')
    setImportFile(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Create New Board</DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 mt-2'>
          <TextField
            autoFocus
            label='Board Name'
            fullWidth
            size='small'
            value={boardTitle}
            onChange={e => setBoardTitle(e.target.value)}
          />

          <FormControl fullWidth size='small'>
            <InputLabel>Select Template (Optional)</InputLabel>
            <Select
              value={selectedTemplate}
              label='Select Template (Optional)'
              onChange={e => setSelectedTemplate(e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value=''>
                <em>None (Start from scratch)</em>
              </MenuItem>
              {templates?.map(tpl => (
                <MenuItem key={tpl.templateId} value={tpl.templateId}>
                  {tpl.templateName}
                </MenuItem>
              ))}
            </Select>
            {isLoading && <p className='text-xs text-textSecondary mt-1'>Loading templates...</p>}

          </FormControl>

          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outlined" 
              component="label" 
              fullWidth 
              size="small"
              color={importFile ? 'success' : 'primary'}
            >
              {importFile ? `File: ${importFile.name}` : 'Import from Excel (Optional)'}
              <input
                type="file"
                hidden
                accept=".xlsx, .xls"
                onChange={(e) => {
                  const file = e.target.files[0]

                  setImportFile(file)
                  if (file) setSelectedTemplate('') // Clear template if file selected
                }}
              />
            </Button>
            {importFile && (
               <Button 
                size="small" 
                color="error" 
                onClick={() => setImportFile(null)}
                className="!min-w-0 px-2"
               >
                 <i className="tabler-x" />
               </Button>
            )}
          </div>
          {importFile && <p className="text-xs text-textSecondary">Note: Template selection is disabled when importing.</p>}

        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='inherit'>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={!boardTitle || isSubmitting}>
          {isSubmitting ? <CircularProgress size={20} /> : 'Create Board'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
