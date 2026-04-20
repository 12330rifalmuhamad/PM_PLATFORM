'use client'

import { useState, useMemo, useEffect } from 'react'

import { 
  Box, Card, CardHeader, CardContent, Typography, 
  TextField, InputAdornment, IconButton, Chip, 
  Avatar, LinearProgress, Tooltip, Button,
  Menu, MenuItem, Divider
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'
import * as XLSX from 'xlsx'

import CustomAvatar from '@core/components/mui/Avatar'
import CustomChip from '@core/components/mui/Chip'
import TablePaginationComponent from '@components/TablePaginationComponent'

const columnHelper = createColumnHelper()

const TablesOverview = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const theme = useTheme()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tables/overview')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch table data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExport = (type) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Task Overview")
    XLSX.writeFile(wb, `Workspace_Tasks_${new Date().toISOString().split('T')[0]}.${type}`)
    setExportAnchorEl(null)
  }

  const columns = useMemo(() => [
    columnHelper.accessor('taskTitle', {
      header: 'Task / Item',
      cell: info => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ 
            width: 8, height: 32, 
            borderRadius: 1, 
            bgcolor: info.row.original.status === 'Selesai' ? 'success.main' : 'primary.main' 
          }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {info.getValue()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {info.row.original.taskId}
            </Typography>
          </Box>
        </Box>
      )
    }),
    columnHelper.accessor('boardName', {
      header: 'Project / Board',
      cell: info => (
        <Chip 
          label={info.getValue()} 
          size="small" 
          variant="tonal" 
          color="secondary"
          sx={{ fontWeight: 500, borderRadius: '6px' }}
        />
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const val = info.getValue()
        let color = 'default'
        if (val === 'Selesai' || val === 'Done') color = 'success'
        if (val === 'Sedang Dikerjakan' || val === 'Working') color = 'warning'
        if (val === 'Buntu' || val === 'Stuck') color = 'error'
        
        return (
          <CustomChip 
            label={val || 'No Status'} 
            skin="light" 
            color={color} 
            size="small"
            sx={{ fontWeight: 600, minWidth: 100 }}
          />
        )
      }
    }),
    columnHelper.accessor('prioritas', {
      header: 'Priority',
      cell: info => {
        const val = info.getValue()
        let color = 'primary'
        if (val === 'Tinggi' || val === 'High') color = 'error'
        if (val === 'Rendah' || val === 'Low') color = 'info'
        
        return (
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <i className={`tabler-flag-filled text-sm text-${color}-600`} style={{ color: theme.palette[color].main }} />
             <Typography variant="body2">{val || '-'}</Typography>
           </Box>
        )
      }
    }),
    columnHelper.accessor('dtmInserted', {
      header: 'Created Date',
      cell: info => new Date(info.getValue()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    })
  ], [theme])

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Premium Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Smart Tables Unified Center</Typography>
            <Typography variant="body2" color="text.secondary">Monitor and manage all tasks across your entire workspace workspace</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3 }}>
            <Button 
                variant="tonal" 
                startIcon={<i className='tabler-download' />}
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
            >
                Export
            </Button>
            <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => setExportAnchorEl(null)}
            >
                <MenuItem onClick={() => handleExport('xlsx')}>Excel (.xlsx)</MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>CSV (.csv)</MenuItem>
            </Menu>
            <Button variant="contained" startIcon={<i className='tabler-plus' />} onClick={fetchData}>
                Refresh Data
            </Button>
        </Box>
      </Box>

      {/* Advanced Filter Bar */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ py: 3, '&:last-child': { pb: 3 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search in all projects..."
                    value={globalFilter ?? ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <i className="tabler-search text-secondary" />
                            </InputAdornment>
                        )
                    }}
                />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                 <Tooltip title="View Stats">
                    <IconButton variant="tonal" color="primary"><i className="tabler-chart-bar" /></IconButton>
                 </Tooltip>
                 <Tooltip title="Filter Settings">
                    <IconButton variant="tonal"><i className="tabler-filter" /></IconButton>
                 </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Master Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: theme.palette.action.hover }}>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} style={{ 
                        padding: '16px 24px', 
                        textAlign: 'left', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        color: theme.palette.text.secondary,
                        borderBottom: `1px solid ${theme.palette.divider}`
                    }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                    <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <Box sx={{ width: '100%', maxWidth: 400 }}><LinearProgress /></Box>
                            <Typography variant="body2" color="text.secondary">Aggregating workspace intelligence...</Typography>
                        </Box>
                    </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                    <td colSpan={columns.length} style={{ padding: '60px', textAlign: 'center' }}>
                        <i className="tabler-search-off text-6xl text-textDisabled mb-4" />
                        <Typography variant="h6" color="text.secondary">No tasks found matching your criteria</Typography>
                    </td>
                </tr>
              ) : table.getRowModel().rows.map(row => (
                <tr key={row.id} style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: theme.palette.action.hover }
                }} className="hover:bg-gray-50/50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ 
                        padding: '16px 24px', 
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        fontSize: '0.875rem'
                    }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePaginationComponent
            table={table}
        />
      </Card>
    </Box>
  )
}

const TablesOverviewPage = () => {
    return (
        <Box sx={{ p: { xs: 0, sm: 2 } }}>
            <TablesOverview />
        </Box>
    )
}

export default TablesOverviewPage
