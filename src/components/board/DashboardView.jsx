'use client'

import React, { useState, useMemo } from 'react'
import { useSWRConfig } from 'swr'
import ReactECharts from 'echarts-for-react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, Card, CardContent, Typography, Grid, Select, InputLabel, FormControl, Alert, Tooltip, Divider, useTheme, useMediaQuery } from '@mui/material'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { format, isValid, parseISO } from 'date-fns'

// Use require with legacy path to find WidthProvider
const { Responsive, WidthProvider } = require('react-grid-layout/legacy')
const ResponsiveGridLayout = WidthProvider(Responsive)

const normalizeId = id => {
  return id ? String(id).toLowerCase().replace(/\s+/g, '_') : ''
}

// Helper to extract numeric value from various column types
const getNumericValue = (item, columnId) => {
  if (!item.values) return 0
  const valObj = item.values.find(v => normalizeId(v.columnId) === normalizeId(columnId))
  if (!valObj || !valObj.value) return 0

  // Try parsing
  const floatVal = parseFloat(valObj.value)
  return isNaN(floatVal) ? 0 : floatVal
}

// Helper to extract numeric value from various column types

const CHART_TYPES = [
  { type: 'bar', label: 'Bar Chart', icon: 'tabler-chart-bar' },
  { type: 'line', label: 'Line Chart', icon: 'tabler-chart-line' },
  { type: 'area', label: 'Area Chart', icon: 'tabler-chart-area-line' },
  { type: 'pie', label: 'Pie Chart', icon: 'tabler-chart-pie' },
  { type: 'donut', label: 'Donut Chart', icon: 'tabler-chart-donut' },
  { type: 'radar', label: 'Radar Chart', icon: 'tabler-chart-radar' },
  { type: 'scatter', label: 'Scatter Plot', icon: 'tabler-chart-dots' }
]

const AGGREGATIONS = [
  { value: 'count', label: 'Count of Items' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' }
]

const DashboardView = ({ board, searchQuery }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Responsive Dialog
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  
  // Widget Editing State
  const [editingWidgetId, setEditingWidgetId] = useState(null)
  const [currentWidgetConfig, setCurrentWidgetConfig] = useState({
    title: '',
    chartType: 'bar',
    groupByColumn: '', // X-Axis / Legend
    metricColumn: '', // Y-Axis (for aggregations)
    aggregation: 'count',
    width: 6,
    height: 400 
  })

  // Normalize/Flatten items
  const allItems = useMemo(() => {
    if (!board || !board.groups) return []
    const items = board.groups.flatMap(g => g.items || [])
    
    if (!searchQuery) return items
    
    const query = searchQuery.toLowerCase()
    return items.filter(item => (item.taskTitle || '').toLowerCase().includes(query))
  }, [board, searchQuery])

  const columns = board?.columns || []



  const handleOpenDialog = (widgetToEdit = null) => {
    if (widgetToEdit) {
      setEditingWidgetId(widgetToEdit.widgetId)
      setCurrentWidgetConfig({ ...widgetToEdit })
    } else {
      setEditingWidgetId(null)
      setCurrentWidgetConfig({
        title: '',
        chartType: 'bar',
        groupByColumn: columns.length > 0 ? columns[0].columnId : '',
        metricColumn: '',
        aggregation: 'count',
        width: 6,
        height: 400
      })
    }
    setIsDialogOpen(true)
  }

  const { mutate } = useSWRConfig()
  
  // Use widgets from board data instead of local state
  const widgets = board?.widgets || []

  const handleSaveWidget = async () => {
    if (!board || !board.boardId) {
      console.error('Board data missing')
      return
    }
    
    let optimisticData = []
    
    // Optimistic Update
    if (editingWidgetId) {
      optimisticData = widgets.map(w => w.widgetId === editingWidgetId ? { ...currentWidgetConfig, widgetId: editingWidgetId } : w)
    } else {
      optimisticData = [...widgets, { ...currentWidgetConfig, widgetId: 'temp-' + Date.now() }]
    }
    
    // We can't easily do optimistic updates for Create because we need real ID
    // So we just rely on loading state or SWR mutation
    setIsDialogOpen(false)

    try {
        if (editingWidgetId) {
            // UPDATE
            await fetch(`/api/widgets/${editingWidgetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentWidgetConfig)
            })
        } else {
            // CREATE
            await fetch(`/api/boards/${board.boardId}/widgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentWidgetConfig)
            })
        }
        mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
        console.error('Failed to save widget', error)
        alert('Failed to save widget')
    }
  }

  const handleDeleteWidget = async (id) => {
    if (!confirm('Delete this widget?')) return

    try {
        await fetch(`/api/widgets/${id}`, { method: 'DELETE' })
        mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
        console.error('Failed to delete widget', error)
    }
  }

  // Handle Layout Changes (Drag/Resize)
  const handleLayoutUpdate = async (layout) => {
    // 1. Identify what changed
    const updates = []
    
    layout.forEach(item => {
        const widgetId = parseInt(item.i)
        const widget = widgets.find(w => w.widgetId == widgetId)
        if (!widget) return

        // Calculate new height in px (approx) based on rows
        const newHeight = (item.h - 2) * 30 
        
        if (
            widget.x !== item.x || 
            widget.y !== item.y || 
            widget.width !== item.w || 
            Math.abs((widget.height || 400) - newHeight) > 30 // Threshold for height change
        ) {
            updates.push({
                widgetId,
                x: item.x,
                y: item.y,
                width: item.w,
                height: Math.max(newHeight, 300) // Min height constraint
            })
        }
    })

    if (updates.length === 0) return

    // 2. Optimistic Update (Optional but good for UX)
    // We can skip full optimistic update for drag/drop if it feels jerky, 
    // but RGL handles visual state. We just need to sync data.

    // 3. Save to Backend
    try {
        await fetch(`/api/widgets/batch`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        })
        // Silent revalidate
         mutate(`/api/boards/${board.boardId}`)
    } catch (error) {
        console.error('Failed to save layout', error)
    }
  }

  /* Live Preview & Enhanced Configuration Logic */

  const getChartOption = (widget, isPreview = false) => {
    const { chartType, groupByColumn, metricColumn, aggregation, title, dateGrouping, sortBy } = widget

    // 1. Bucketing Data
    const buckets = {} 
    
    // Helper to get formatted key
    const getKey = (item) => {
         let key = 'Unassigned'
         if (!groupByColumn) return key

         // Special handling for Status (often text)
         if (groupByColumn === 'status') {
             const valObj = item.values?.find(v => normalizeId(v.columnId) === normalizeId(groupByColumn))
             if (valObj && valObj.value) key = valObj.value
             return key
         }

         // Column lookup
         const colDef = columns.find(c => c.columnId === groupByColumn)
         const valObj = item.values?.find(v => normalizeId(v.columnId) === normalizeId(groupByColumn))
         
         if (!valObj || !valObj.value) return key
         
         // Date Handling
         if (colDef && colDef.columnType === 'date') {
             try {
                 const date = parseISO(valObj.value)
                 if (isValid(date)) {
                     if (dateGrouping === 'day') return format(date, 'MMM dd, yyyy')
                     if (dateGrouping === 'week') return `Week ${format(date, 'ww, yyyy')}`
                     if (dateGrouping === 'month') return format(date, 'MMM yyyy')
                     if (dateGrouping === 'year') return format(date, 'yyyy')
                     return format(date, 'MMM dd, yyyy') // default
                 }
             } catch (e) {
                 return 'Invalid Date'
             }
         }
         
         return (valObj.value === null || valObj.value === undefined || valObj.value === '') ? 'Unassigned' : valObj.value
    }

    allItems.forEach(item => {
      const key = getKey(item)
      if (!buckets[key]) buckets[key] = []
      buckets[key].push(item)
    })

    // 2. Aggregating Data & Prepare for Sorting
    let chartData = Object.keys(buckets).map(label => {
      const itemsInBucket = buckets[label]
      let value = 0

      if (aggregation === 'count') {
        value = itemsInBucket.length
      } else {
        // Numeric Aggregations
        if (!metricColumn) value = 0 
        else {
            const values = itemsInBucket.map(i => getNumericValue(i, metricColumn))
            if (aggregation === 'sum') value = values.reduce((a, b) => a + b, 0)
            else if (aggregation === 'max') value = Math.max(...values, 0)
            else if (aggregation === 'min') value = Math.min(...values, 0)
            else if (aggregation === 'avg') {
                const sum = values.reduce((a, b) => a + b, 0)
                value = values.length ? parseFloat((sum / values.length).toFixed(2)) : 0
            }
        }
      }
      return { label, value }
    })

    // 3. Sorting
    if (sortBy === 'value_desc') chartData.sort((a, b) => b.value - a.value)
    else if (sortBy === 'value_asc') chartData.sort((a, b) => a.value - b.value)
    else if (sortBy === 'label_asc') chartData.sort((a, b) => a.label.localeCompare(b.label))
    else if (sortBy === 'label_desc') chartData.sort((a, b) => b.label.localeCompare(a.label))

    const labels = chartData.map(d => d.label)
    const dataValues = chartData.map(d => d.value)

    // 4. Construct ECharts Option
    const activeColors = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      theme.palette.secondary.main,
      theme.palette.primary.dark,
      theme.palette.success.dark,
    ]
    
    const option = {
      backgroundColor: 'transparent',
      title: { text: isPreview ? undefined : title, left: 'center', textStyle: { fontSize: 16 } }, // Hide title in preview to save space or avoid redundancy
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      color: activeColors,
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    }

    if (['pie', 'donut', 'radar'].includes(chartType)) {
      if (chartType === 'radar') {
         option.radar = { indicator: labels.map(l => ({ name: l })) }
         option.series = [{
             type: 'radar',
             data: [{ value: dataValues, name: title }]
         }]
      } else {
        option.series = [{
            name: title,
            type: 'pie',
            radius: chartType === 'donut' ? ['40%', '70%'] : '50%',
            data: chartData.map(d => ({ value: d.value, name: d.label })),
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
            }
        }]
      }
    } else {
      // Cartesian Charts
      option.xAxis = { 
          type: 'category', 
          data: labels,
          axisLabel: { interval: 0, rotate: labels.length > 5 ? 30 : 0 }
      }
      option.yAxis = { type: 'value' }
      option.series = [{
          data: dataValues,
          type: chartType === 'area' ? 'line' : chartType,
          areaStyle: chartType === 'area' ? { opacity: 0.3 } : undefined,
          smooth: true,
          itemStyle: { borderRadius: chartType === 'bar' ? [4, 4, 0, 0] : 0 }
      }]
    }

    return option
  }
  
  // Helper to check if Group By column is a Date
  const isDateColumn = (colId) => {
      const col = columns.find(c => c.columnId === colId)
      return col && col.columnType === 'date'
  }

  return (
    <Box className='min-h-[500px] p-2'>
      {/* Empty State */}
      {widgets.length === 0 && (
        <Box className='flex flex-col items-center justify-center p-10 border-2 border-dashed border-divider rounded-lg bg-backgroundPaper'>
          <Typography variant='h5' className='mb-2 text-textPrimary'>Dashboard is Empty</Typography>
          <Typography variant='body2' className='mb-6 text-textSecondary'>Start visualizing your board data by adding widgets.</Typography>
          <Button variant='contained' startIcon={<i className='tabler-plus'/>} onClick={() => handleOpenDialog()}>
            Create First Widget
          </Button>
        </Box>
      )}

      {/* Widgets Grid */}
      {/* Widgets Grid - React Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        layouts={{
            lg: widgets.map(w => ({
                i: String(w.widgetId),
                x: (w.x !== undefined && w.x !== null) ? w.x : 0, 
                y: (w.y !== undefined && w.y !== null) ? w.y : Infinity, 
                w: w.width || 6,
                h: Math.ceil((w.height || 400) / 30) + 2, // Convert px height to rows (approx) + padding
                minW: 3,
                minH: 8
            }))
        }}
        onLayoutChange={(currentLayout) => {
             // We need to debounce this or handle it carefully
             // For now, let's just find what changed and save it
             // Actually, saving on every drag end is safe enough if we don't spam
        }}
        onDragStop={(layout) => handleLayoutUpdate(layout)}
        onResizeStop={(layout) => handleLayoutUpdate(layout)}
        draggableHandle=".drag-handle"
      >
        {widgets.map(widget => (
          <div key={widget.widgetId} className='relative group'>
            <Card className='h-full relative overflow-visible shadow-lg hover:shadow-xl transition-shadow'>
               {/* Drag Handle */}
               <div className='absolute top-0 left-0 right-10 h-10 drag-handle cursor-move z-10' title="Drag to move" />
               
               <div className='absolute top-2 right-2 z-20 flex gap-1'>
                    <IconButton size='small' onClick={() => handleOpenDialog(widget)}>
                       <i className='tabler-pencil text-textSecondary' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDeleteWidget(widget.widgetId)}>
                       <i className='tabler-trash text-textSecondary hover:text-error' />
                    </IconButton>
               </div>
               <CardContent className='h-full flex flex-col'>
                 <div className='flex-grow bg-transparent'>
                    <ReactECharts 
                        option={getChartOption(widget)} 
                        style={{ height: '100%', width: '100%' }} 
                        // Force resize when container changes
                        autoResize={true}
                        theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                    />
                 </div>
               </CardContent>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Add New Widget Button (Separate from Grid for now, or added as a fixed item if desired) */}
      <Box className='mt-8 flex justify-center'>
            <Button 
                variant='outlined' 
                startIcon={<i className='tabler-plus'/>} 
                onClick={() => handleOpenDialog()}
                className='border-dashed border-2 py-4 px-8'
            >
                Add New Widget
            </Button>
      </Box>

      {/* Configuration Dialog - UPDATED LAYOUT */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth='xl' fullWidth fullScreen={fullScreen}>
        <DialogTitle className='flex justify-between items-center'>
            <span>{editingWidgetId ? 'Edit Widget' : 'Create New Widget'}</span>
            <div className='text-sm font-normal text-textSecondary bg-actionHover px-3 py-1 rounded-full'>
                Live Preview Mode
            </div>
        </DialogTitle>
        <DialogContent dividers className='p-0'>
           {columns.length === 0 ? (
             <Box p={4}>
                <Alert severity="warning">Your board has no columns. Please add columns to create widgets.</Alert>
             </Box>
           ) : (
             <Grid container className='h-[calc(100vh-150px)] md:h-[70vh]'> 
                {/* LEFT PANEL: CONFIGURATION */}
                <Grid item xs={12} md={4} className='h-full overflow-y-auto border-r border-divider p-6 bg-backgroundPaper'>
                   <Typography variant='overline' color='textSecondary' className='mb-4 block'>Widget Settings</Typography>
                   
                   <Grid container spacing={3}>
                       <Grid item xs={12}>
                           <TextField 
                             label='Widget Title' 
                             fullWidth 
                             value={currentWidgetConfig.title} 
                             onChange={e => setCurrentWidgetConfig({...currentWidgetConfig, title: e.target.value})} 
                             placeholder='e.g. Sales Overview'
                           />
                       </Grid>

                       <Grid item xs={12}>
                           <Typography variant='subtitle2' className='mb-2'>Chart Type</Typography>
                           <div className='grid grid-cols-4 gap-2'>
                               {CHART_TYPES.map(c => {
                                   const isSelected = currentWidgetConfig.chartType === c.type
                                   return (
                                       <Tooltip title={c.label} key={c.type}>
                                           <div 
                                             className={`flex flex-col items-center justify-center p-2 border rounded cursor-pointer transition-all h-16 ${isSelected ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-divider hover:border-textSecondary'}`}
                                             onClick={() => setCurrentWidgetConfig({...currentWidgetConfig, chartType: c.type})}
                                           >
                                               <i className={`${c.icon} text-xl`} />
                                           </div>
                                       </Tooltip>
                                   )
                               })}
                           </div>
                       </Grid>

                       <Grid item xs={12}><Divider/></Grid>

                       <Grid item xs={12}>
                           <Typography variant='overline' color='textSecondary' className='mb-2 block'>Data Source</Typography>
                           <FormControl fullWidth className='mb-4'>
                               <InputLabel>Group By (X-Axis)</InputLabel>
                               <Select
                                 label="Group By (X-Axis)"
                                 value={currentWidgetConfig.groupByColumn}
                                 onChange={e => {
                                     const newCol = e.target.value
                                     // Reset date grouping if switching away from date
                                     const isDate = isDateColumn(newCol)
                                     setCurrentWidgetConfig({
                                         ...currentWidgetConfig, 
                                         groupByColumn: newCol,
                                         dateGrouping: isDate ? 'day' : undefined 
                                     })
                                 }}
                               >
                                  {columns.map(col => (
                                      <MenuItem key={col.columnId} value={col.columnId}>
                                          <div className='flex items-center gap-2 w-full'>
                                              <i className={`tabler-${col.columnType === 'date' ? 'calendar' : col.columnType === 'status' ? 'list-check' : 'text-caption'} text-textSecondary text-sm`} />
                                              {col.columnName || 'Untitled Column'}
                                          </div>
                                      </MenuItem>
                                  ))}
                               </Select>
                           </FormControl>

                           {/* Date Grouping Option */}
                           {isDateColumn(currentWidgetConfig.groupByColumn) && (
                               <FormControl fullWidth className='mb-4'>
                                   <InputLabel>Date Grouping</InputLabel>
                                   <Select
                                     label="Date Grouping"
                                     value={currentWidgetConfig.dateGrouping || 'day'}
                                     onChange={e => setCurrentWidgetConfig({...currentWidgetConfig, dateGrouping: e.target.value})}
                                   >
                                       <MenuItem value="day">Daily</MenuItem>
                                       <MenuItem value="week">Weekly</MenuItem>
                                       <MenuItem value="month">Monthly</MenuItem>
                                       <MenuItem value="year">Yearly</MenuItem>
                                   </Select>
                               </FormControl>
                           )}

                           <div className='flex gap-2'>
                               <FormControl fullWidth>
                                   <InputLabel>Aggregation</InputLabel>
                                   <Select
                                     label="Aggregation"
                                     value={currentWidgetConfig.aggregation}
                                     onChange={e => setCurrentWidgetConfig({...currentWidgetConfig, aggregation: e.target.value})}
                                   >
                                       {AGGREGATIONS.map(agg => (
                                           <MenuItem key={agg.value} value={agg.value}>{agg.label}</MenuItem>
                                       ))}
                                   </Select>
                               </FormControl>

                               {currentWidgetConfig.aggregation !== 'count' && (
                                   <FormControl fullWidth>
                                       <InputLabel>Value Column</InputLabel>
                                       <Select
                                           label="Value Column"
                                           value={currentWidgetConfig.metricColumn}
                                           onChange={e => setCurrentWidgetConfig({ ...currentWidgetConfig, metricColumn: e.target.value })}
                                       >
                                           <MenuItem value=""><em>Select Column</em></MenuItem>
                                           {columns.filter(c => c.columnType === 'number' || c.columnType === 'currency').map(col => (
                                               <MenuItem key={col.columnId} value={col.columnId}>
                                                   <span className='text-textPrimary'>{col.columnName || 'Untitled Column'}</span>
                                               </MenuItem>
                                           ))}
                                            {/* Fallback for other columns if needed */}
                                           {columns.filter(c => c.columnType !== 'number' && c.columnType !== 'currency').map(col => (
                                               <MenuItem key={col.columnId} value={col.columnId}>
                                                   <span className='text-textSecondary opacity-80'>{col.columnName || 'Untitled Column'}</span>
                                               </MenuItem>
                                           ))}
                                       </Select>
                                   </FormControl>
                               )}
                           </div>
                       </Grid>

                       <Grid item xs={12}><Divider/></Grid>

                       <Grid item xs={12}>
                           <Typography variant='overline' color='textSecondary' className='mb-2 block'>Display Options</Typography>
                           <div className='grid grid-cols-2 gap-4'>
                                <FormControl fullWidth>
                                    <InputLabel>Sort Order</InputLabel>
                                    <Select
                                      label="Sort Order"
                                      value={currentWidgetConfig.sortBy || 'value_desc'}
                                      onChange={e => setCurrentWidgetConfig({...currentWidgetConfig, sortBy: e.target.value})}
                                    >
                                        <MenuItem value="value_desc">Values (High to Low)</MenuItem>
                                        <MenuItem value="value_asc">Values (Low to High)</MenuItem>
                                        <MenuItem value="label_asc">Label (A-Z)</MenuItem>
                                        <MenuItem value="label_desc">Label (Z-A)</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                <FormControl fullWidth>
                                     <InputLabel>Chart Height</InputLabel>
                                     <Select
                                         label="Chart Height"
                                         value={currentWidgetConfig.height || 400}
                                         onChange={e => setCurrentWidgetConfig({...currentWidgetConfig, height: e.target.value})}
                                     >
                                         <MenuItem value={300}>Small (300px)</MenuItem>
                                         <MenuItem value={400}>Medium (400px)</MenuItem>
                                         <MenuItem value={500}>Large (500px)</MenuItem>
                                         <MenuItem value={600}>Extra Large (600px)</MenuItem>
                                     </Select>
                                </FormControl>

                                <FormControl fullWidth className='col-span-2'>
                                     <InputLabel>Widget Width</InputLabel>
                                     <Select
                                         label="Widget Width"
                                         value={currentWidgetConfig.width !== undefined ? currentWidgetConfig.width : 6}
                                         onChange={e => setCurrentWidgetConfig({...currentWidgetConfig, width: e.target.value})}
                                     >
                                         <MenuItem value={3}>25% Width</MenuItem>
                                         <MenuItem value={4}>33% Width</MenuItem>
                                         <MenuItem value={6}>50% Width (Half)</MenuItem>
                                         <MenuItem value={8}>66% Width</MenuItem>
                                         <MenuItem value={12}>100% Width (Full)</MenuItem>
                                     </Select>
                                </FormControl>
                           </div>
                       </Grid>
                   </Grid>
                </Grid>

                {/* RIGHT PANEL: LIVE PREVIEW */}
                <Grid item xs={12} md={8} className='h-full bg-backgroundDefault flex flex-col'>
                    <div className='flex-grow flex items-center justify-center p-8 overflow-hidden'>
                        {!currentWidgetConfig.groupByColumn ? (
                            <div className='text-center text-textSecondary opacity-50'>
                                <i className='tabler-chart-bar text-6xl mb-4 block' />
                                <Typography variant='h6'>Select 'Group By' to generate preview</Typography>
                            </div>
                        ) : (
                            <div className='w-full h-full bg-backgroundPaper rounded-lg shadow-sm p-4 border border-divider flex flex-col'>
                                <Typography variant='h6' align='center' className='mb-4 font-semibold'>
                                    {currentWidgetConfig.title || 'Untitled Widget'}
                                </Typography>
                                <div className='flex-grow relative'>
                                     {/* We use a key to force re-render animation on config change for better feel */}
                                     {/* or just let ReactECharts handle updates */}
                                     <ReactECharts 
                                        key={JSON.stringify(currentWidgetConfig) + theme.palette.mode}
                                        option={getChartOption(currentWidgetConfig, true)} 
                                        style={{ height: '100%', width: '100%', minHeight: '400px' }} 
                                        opts={{ renderer: 'canvas' }}
                                        theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                                     />
                                </div>
                            </div>
                        )}
                    </div>
                </Grid>
             </Grid>
           )}
        </DialogContent>
        <DialogActions className='px-6 py-4 border-t border-divider'>
           <Button onClick={() => setIsDialogOpen(false)} color='inherit' size='large'>Cancel</Button>
            <Button 
              onClick={handleSaveWidget} 
              variant='contained' 
              size='large'
              startIcon={<i className='tabler-device-floppy'/>}
              disabled={!currentWidgetConfig.title || !currentWidgetConfig.groupByColumn}
            >
             {editingWidgetId ? 'Update Widget' : 'Create Widget'}
           </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DashboardView
