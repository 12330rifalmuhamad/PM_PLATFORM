'use client'

import React, { useState, useMemo } from 'react'
import { useSWRConfig } from 'swr'
import ReactECharts from 'echarts-for-react'
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, Card, CardContent, Typography, Grid, Select, InputLabel, FormControl, Alert, Tooltip, Divider, useTheme, useMediaQuery, Checkbox, ListItemText } from '@mui/material'
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
  { type: 'scatter', label: 'Scatter Plot', icon: 'tabler-chart-dots' },
  { type: 'summary', label: 'Summary List', icon: 'tabler-list-numbers' }
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
  const [loading, setLoading] = useState(false)
  const [currentWidgetConfig, setCurrentWidgetConfig] = useState({
    title: '',
    chartType: 'bar',
    groupByColumn: '', // X-Axis / Legend
    metricColumn: '', // Y-Axis (for aggregations)
    aggregation: 'count',
    width: 6,
    height: 400,
    filterGroupId: '',
    settings: {
        metrics: [], // Array of columnIds
        yAxisMin: null,
        yAxisMax: null,
        yAxisAuto: true,
        showSecondaryAxis: false,
        secondaryMetrics: [] // Which metrics go to the right axis
    }
  })

  // Normalize/Flatten items
  const allItems = useMemo(() => {
    if (!board || !board.groups) return []
    const items = board.groups.flatMap(g => 
      (g.items || []).map(item => ({
        ...item, 
        groupId: String(g.groupId), 
        groupName: g.groupName
      }))
    )
    
    if (!searchQuery) return items
    
    const query = searchQuery.toLowerCase()
    return items.filter(item => (item.taskTitle || '').toLowerCase().includes(query))
  }, [board, searchQuery])

  const columns = board?.columns || []



  const handleOpenDialog = (widgetToEdit = null) => {
    const defaultSettings = {
        metrics: [],
        breakdownColumnId: '',
        filterGroupIds: [],
        yAxisMin: null,
        yAxisMax: null,
        yAxisAuto: true,
        showSecondaryAxis: false,
        secondaryMetrics: []
    }

    if (widgetToEdit) {
      setEditingWidgetId(widgetToEdit.widgetId)
      setCurrentWidgetConfig({ 
          ...widgetToEdit, 
          settings: { ...defaultSettings, ...(widgetToEdit.settings || {}) } 
      })
    } else {
      setEditingWidgetId(null)
      setCurrentWidgetConfig({
        title: '',
        chartType: 'bar',
        groupByColumn: columns.length > 0 ? columns[0].columnId : '',
        metricColumn: '',
        aggregation: 'count',
        width: 6,
        height: 400,
        filterGroupId: '',
        settings: defaultSettings
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
    
    setLoading(true)
    try {
        const payload = {
            ...currentWidgetConfig,
            // Ensure BigInt-like IDs are strings for JSON compatibility
            boardId: String(board.boardId),
            filterGroupId: currentWidgetConfig.filterGroupId ? String(currentWidgetConfig.filterGroupId) : null
        }

        if (editingWidgetId) {
            await fetch(`/api/widgets/${editingWidgetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        } else {
            await fetch(`/api/boards/${board.boardId}/widgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        }
        mutate(`/api/boards/${board.boardId}`)
        setIsDialogOpen(false)
    } catch (error) {
        console.error('Failed to save widget', error)
        alert('Failed to save widget. Please try again.')
    } finally {
        setLoading(false)
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

  const processWidgetData = (widget) => {
    const { groupByColumn, aggregation, dateGrouping, sortBy } = widget
    const breakdownColumnId = widget.settings?.breakdownColumnId

    // 1. Bucketing Data (Two-Level: Primary -> Breakdown)
    const buckets = {} // { label: { breakdownVal: [items] } }
    const breakdownLabels = new Set()
    
    const getLabel = (item, colId) => {
          let key = 'Unassigned'
          if (!colId) return key

          if (colId === 'group') return item.groupName || 'No Group'

          if (colId === 'status') {
              const valObj = item.values?.find(v => normalizeId(v.columnId) === normalizeId(colId))
              if (valObj && valObj.value) key = valObj.value
              return key
          }

          const colDef = columns.find(c => c.columnId === colId)
          const valObj = item.values?.find(v => normalizeId(v.columnId) === normalizeId(colId))
          
          if (!valObj || !valObj.value) return key
          
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

    const filterGroupIds = widget.settings?.filterGroupIds || (widget.filterGroupId ? [String(widget.filterGroupId)] : [])
    const filteredItems = filterGroupIds.length > 0
      ? allItems.filter(item => filterGroupIds.includes(String(item.groupId)))
      : allItems

    filteredItems.forEach(item => {
      const primaryKey = getLabel(item, groupByColumn)
      const secondaryKey = breakdownColumnId ? getLabel(item, breakdownColumnId) : '_none_'
      
      if (!buckets[primaryKey]) buckets[primaryKey] = {}
      if (!buckets[primaryKey][secondaryKey]) buckets[primaryKey][secondaryKey] = []
      buckets[primaryKey][secondaryKey].push(item)
      
      if (secondaryKey !== '_none_') breakdownLabels.add(secondaryKey)
    })

    // 2. Aggregating Data
    let selectedMetrics = widget.settings?.metrics || []
    if (selectedMetrics.length === 0 && widget.metricColumn) selectedMetrics = [widget.metricColumn]
    
    // Ensure 'count' aggregation works even when no metric columns are selected
    if (aggregation === 'count' && selectedMetrics.length === 0) {
        selectedMetrics = ['_count_']
    }
    
    const primaryLabels = Object.keys(buckets)
    const finalSeries = []

    // If no breakdown, use standard metric-based series
    if (!breakdownColumnId || breakdownLabels.size === 0) {
        selectedMetrics.forEach(metricId => {
            let metricName = 'Jumlah Data' // Default label for count
            if (metricId !== '_count_') {
                 const colDef = columns.find(c => c.columnId === metricId)
                 metricName = colDef ? (colDef.columnName || 'Untitled') : 'Unknown'
            }
            
            const data = primaryLabels.map(label => {
                const itemsInBucket = buckets[label]['_none_'] || []
                let value = 0
                
                if (aggregation === 'count') {
                    value = itemsInBucket.length
                } else {
                    const values = itemsInBucket.map(i => getNumericValue(i, metricId))
                    if (aggregation === 'sum') value = values.reduce((a, b) => a + b, 0)
                    else if (aggregation === 'max') value = Math.max(...values, 0)
                    else if (aggregation === 'min') value = Math.min(...values, 0)
                    else if (aggregation === 'avg') {
                        const sum = values.reduce((a, b) => a + b, 0)
                        value = values.length ? parseFloat((sum / values.length).toFixed(2)) : 0
                    }
                }
                return value
            })
            
            finalSeries.push({ metricId, name: metricName, metricName, data })
        })
    } else {
        // Multi-Group logic: One series for each unique breakdown label
        // Usually focus on the first selected metric if multiple are present with breakdown
        const metricId = selectedMetrics.length > 0 ? selectedMetrics[0] : '_count_'
        let metricBaseName = 'Jumlah Data'
        if (metricId !== '_count_') {
            const colDef = columns.find(c => c.columnId === metricId)
            metricBaseName = colDef ? (colDef.columnName || '') : ''
        }
        
        const sortedBreakdownLabels = Array.from(breakdownLabels).sort()

        sortedBreakdownLabels.forEach(bLabel => {
            const data = primaryLabels.map(pLabel => {
                const itemsInBucket = buckets[pLabel][bLabel] || []
                let value = 0
                
                if (aggregation === 'count') {
                    value = itemsInBucket.length
                } else {
                    const values = itemsInBucket.map(i => getNumericValue(i, metricId))
                    if (aggregation === 'sum') value = values.reduce((a, b) => a + b, 0)
                    else if (aggregation === 'max') value = Math.max(...values, 0)
                    else if (aggregation === 'min') value = Math.min(...values, 0)
                    else if (aggregation === 'avg') {
                        const sum = values.reduce((a, b) => a + b, 0)
                        value = values.length ? parseFloat((sum / values.length).toFixed(2)) : 0
                    }
                }
                return value
            })
            
            finalSeries.push({ 
                metricId, 
                name: bLabel, // Use breakdown label as series name
                breakdownValue: bLabel,
                metricName: metricBaseName,
                data 
            })
        })
    }

    // 3. Sorting (based on X-axis labels)
    const sortData = primaryLabels.map((label, index) => {
        const firstVal = finalSeries.length > 0 ? finalSeries[0].data[index] : 0
        return { label, index, firstVal }
    })

    if (sortBy === 'value_desc') sortData.sort((a, b) => b.firstVal - a.firstVal)
    else if (sortBy === 'value_asc') sortData.sort((a, b) => a.firstVal - b.firstVal)
    else if (sortBy === 'label_asc') sortData.sort((a, b) => a.label.localeCompare(b.label))
    else if (sortBy === 'label_desc') sortData.sort((a, b) => b.label.localeCompare(a.label))
    else if (groupByColumn === 'group' && board?.groups) {
        const groupOrder = board.groups.map(g => g.groupName)
        sortData.sort((a, b) => groupOrder.indexOf(a.label) - groupOrder.indexOf(b.label))
    }

    const sortedLabels = sortData.map(d => d.label)
    const sortedSeries = finalSeries.map(s => ({
        ...s,
        data: sortData.map(d => s.data[d.index])
    }))

    const totals = sortedSeries.map(s => s.data.reduce((a, b) => a + b, 0))

    return { labels: sortedLabels, series: sortedSeries, totals, isBreakdown: !!breakdownColumnId }
  }

  const getChartOption = (widget, isPreview = false) => {
    const { chartType, title, settings } = widget
    const { labels, series } = processWidgetData(widget)
    
    // Formatting Helpers
    const getFormatter = (metricId) => {
        if (metricId === '_count_') return (val) => new Intl.NumberFormat('id-ID').format(val)
        
        const colDef = columns.find(c => c.columnId === metricId)
        const isCurrency = colDef?.columnType === 'currency' || colDef?.columnName?.toLowerCase().includes('pemasukan') || colDef?.columnName?.toLowerCase().includes('nominal')
        
        if (isCurrency) {
            return (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
        }
        
        // Standard number formatting for everything else
        return (val) => new Intl.NumberFormat('id-ID').format(val)
    }

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
      title: { text: isPreview ? undefined : title, left: 'center', textStyle: { fontSize: 16 } }, 
      tooltip: { 
          trigger: ['pie', 'donut', 'radar'].includes(chartType) ? 'item' : 'axis',
          formatter: (params) => {
              if (['pie', 'donut'].includes(chartType)) {
                  // For pie, params is an object
                  const mId = params.data?.metricId || series[0]?.metricId || '_count_'
                  return `${params.marker} ${params.name}: <b>${getFormatter(mId)(params.value)}</b>`
              }
              if (chartType === 'radar') {
                  let res = `${params.marker} <b>${params.name}</b><br/>`
                  const sInfo = series.find(s => (s.name || s.metricName) === params.name) || series[0]
                  const formatter = getFormatter(sInfo?.metricId || '_count_')
                  if (Array.isArray(params.value)) {
                      params.value.forEach((val, idx) => {
                          res += `${labels[idx]}: <b>${formatter(val)}</b><br/>`
                      })
                  }
                  return res
              }
              // For axis trigger (bar, line, area), params is array
              let res = `${params[0].name}<br/>`
              params.forEach(p => {
                  const sInfo = series[p.seriesIndex]
                  if (!sInfo) return
                  const formatter = getFormatter(sInfo.metricId)
                  res += `${p.marker} ${p.seriesName}: <b>${formatter(p.value)}</b><br/>`
              })
              return res
          }
      },
      legend: { bottom: 0, type: 'scroll' },
      color: activeColors,
      // Removed grid from default option (it will be added only for cartesian charts)
    }

    if (['pie', 'donut', 'radar'].includes(chartType)) {
      if (chartType === 'radar') {
         option.radar = { indicator: labels.map(l => ({ name: String(l) || 'Unknown' })) }
         option.series = [{
             type: 'radar',
             data: series.map(s => ({
                 value: s.data,
                 name: s.name || s.metricName
             }))
         }]
      } else {
        // Flatten series for Pie/Donut to support multi-group/breakdown
        const pieData = labels.flatMap((l, i) => 
            series.map(s => ({
                value: s.data[i] || 0,
                name: series.length > 1 ? `${l} - ${s.name || s.metricName}` : l,
                metricId: s.metricId
            }))
        ).filter(d => d.value > 0) // Hide zero values for cleaner pie
        
        option.series = [{
            name: title,
            type: 'pie',
            radius: chartType === 'donut' ? ['40%', '70%'] : '50%',
            data: pieData,
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
            }
        }]
      }
    } else {
      // Cartesian Charts Configuration (Bar, Line, Area)
      option.grid = { left: '3%', right: '4%', bottom: '15%', containLabel: true }
      
      const yAxisBase = {
          type: 'value',
          min: settings?.yAxisAuto ? undefined : (settings?.yAxisMin || undefined),
          max: settings?.yAxisAuto ? undefined : (settings?.yAxisMax || undefined),
          axisLabel: {
              formatter: (val) => {
                  if (series && series.length > 0 && series[0]) return getFormatter(series[0].metricId)(val)
                  return val
              }
          }
      }

      if (settings?.showSecondaryAxis) {
          option.yAxis = [
              { ...yAxisBase },
              { 
                  type: 'value', 
                  name: 'Secondary',
                  axisLabel: {
                      formatter: (val) => {
                          const secId = settings.secondaryMetrics?.[0]
                          if (secId) return getFormatter(secId)(val)
                          return val
                      }
                  }
              }
          ]
      } else {
          option.yAxis = yAxisBase
      }

      option.xAxis = { 
          type: 'category', 
          data: labels,
          axisLabel: { interval: 0, rotate: labels.length > 5 ? 30 : 0 }
      }
      option.series = series.map(s => {
          const isSecondary = settings?.secondaryMetrics?.includes(s.metricId)
          return {
              name: s.name || s.metricName,
              data: s.data,
              type: chartType === 'area' ? 'line' : chartType,
              yAxisIndex: isSecondary ? 1 : 0,
              areaStyle: chartType === 'area' ? { opacity: 0.3 } : undefined,
              smooth: true,
              itemStyle: { borderRadius: chartType === 'bar' ? [4, 4, 0, 0] : 0 }
          }
      })
    }

    return option
  }

  const SummaryWidget = ({ widget, isPreview = false }) => {
    const { labels, series, totals } = processWidgetData(widget)
    
    // Find filtered group names
    const filterGroupIds = widget.settings?.filterGroupIds || (widget.filterGroupId ? [String(widget.filterGroupId)] : [])
    const filteredGroups = filterGroupIds.map(id => board.groups?.find(g => String(g.groupId) === String(id))).filter(Boolean)

    // Helper to find color of a label if it's a group
    const getLabelColor = (label) => {
        if (widget.groupByColumn !== 'group') return null
        const group = board.groups?.find(g => g.groupName === label)
        return group?.groupColor || null
    }

    const formatValue = (val, metricId) => {
        if (metricId === '_count_') return new Intl.NumberFormat('id-ID').format(val)
        
        const colDef = columns.find(c => c.columnId === metricId)
        const isCurrency = colDef?.columnType === 'currency' || colDef?.columnName?.toLowerCase().includes('pemasukan') || colDef?.columnName?.toLowerCase().includes('nominal')
        
        if (isCurrency) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
        }
        
        return new Intl.NumberFormat('id-ID').format(val)
    }

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {!isPreview && (
                <>
                    <Typography variant='h6' align='center' sx={{ mb: 1, fontWeight: 600 }}>
                        {widget.title}
                    </Typography>
                    {filteredGroups.length > 0 && (
                        <Typography variant='caption' align='center' display='block' sx={{ mb: 3, opacity: 0.7 }}>
                           Filtered Groups: {filteredGroups.map(g => g.groupName).join(', ')}
                        </Typography>
                    )}
                </>
            )}
            
            <Box sx={{ overflowX: 'auto', flexGrow: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px', opacity: 0.5 }}>
                                <Typography variant='overline'>
                                    {widget.groupByColumn === 'group' ? 'Grup Papan' : 'Sumbu X'}
                                </Typography>
                                {widget.settings?.breakdownColumnId && (
                                    <Typography variant='caption' display='block' sx={{ mt: -0.5, fontStyle: 'italic' }}>
                                        Broken down by: {columns.find(c => c.columnId === widget.settings.breakdownColumnId)?.columnName || 'Category'}
                                    </Typography>
                                )}
                            </th>
                            {series.map(s => (
                                <th key={`${s.metricId}-${s.name}`} style={{ textAlign: 'right', padding: '8px', opacity: 0.5 }}>
                                    <Typography variant='overline'>{s.name || s.metricName}</Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {labels.map((label, lIdx) => {
                            const groupColor = getLabelColor(label)
                            return (
                                <tr key={label} style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                                    <td style={{ padding: '8px', borderLeft: groupColor ? `4px solid ${groupColor}` : 'none' }}>
                                        <Typography variant='body1' sx={{ fontWeight: 500 }}>{label}</Typography>
                                    </td>
                                    {series.map(s => (
                                        <td key={`${s.metricId}-${s.name}`} style={{ textAlign: 'right', padding: '8px' }}>
                                            <Typography variant='body1' color='primary' sx={{ fontWeight: 600 }}>
                                                {formatValue(s.data[lIdx], s.metricId)}
                                            </Typography>
                                        </td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: '2px solid var(--mui-palette-primary-main)' }}>
                            <td style={{ padding: '8px' }}>
                                <Typography variant='h6' sx={{ fontWeight: 700 }}>TOTAL</Typography>
                            </td>
                            {series.map((s, sIdx) => (
                                <td key={`${s.metricId}-${s.name}`} style={{ textAlign: 'right', padding: '8px' }}>
                                    <Typography variant='h6' color='primary' sx={{ fontWeight: 800 }}>
                                        {formatValue(totals[sIdx], s.metricId)}
                                    </Typography>
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </Box>
        </Box>
    )
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
                   {widget.chartType === 'summary' ? (
                       <SummaryWidget widget={widget} />
                   ) : (
                       <ReactECharts 
                           option={getChartOption(widget)} 
                           style={{ height: '100%', width: '100%' }} 
                           // Force resize when container changes
                           autoResize={true}
                           theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                       />
                   )}
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
                           <FormControl fullWidth>
                                   <InputLabel>Sumbu X (Kategori Utama)</InputLabel>
                                   <Select
                                       label="Sumbu X (Kategori Utama)"
                                       value={currentWidgetConfig.groupByColumn}
                                       onChange={e => {
                                           const newCol = e.target.value
                                           const isDate = isDateColumn(newCol)
                                           setCurrentWidgetConfig({ 
                                               ...currentWidgetConfig, 
                                               groupByColumn: newCol,
                                               dateGrouping: isDate ? 'day' : undefined 
                                           })
                                       }}
                                   >
                                       <MenuItem value=""><em>Select Column</em></MenuItem>
                                       <MenuItem value="group">Board Group (Default)</MenuItem>
                                       {columns.map(col => (
                                           <MenuItem key={col.columnId} value={col.columnId}>
                                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                   <i className={`tabler-${col.columnType === 'status' ? 'list-details' : col.columnType === 'date' ? 'calendar' : 'text-color'}`} />
                                                   <span>{col.columnName || 'Untitled Column'}</span>
                                               </Box>
                                           </MenuItem>
                                       ))}
                                   </Select>
                               </FormControl>

                               <FormControl fullWidth className='mt-4'>
                                   <InputLabel>Breakdown By (Sumbu X Kedua)</InputLabel>
                                   <Select
                                       label="Breakdown By (Sumbu X Kedua)"
                                       value={currentWidgetConfig.settings?.breakdownColumnId || ''}
                                       onChange={e => setCurrentWidgetConfig({ 
                                           ...currentWidgetConfig, 
                                           settings: { ...currentWidgetConfig.settings, breakdownColumnId: e.target.value } 
                                       })}
                                   >
                                       <MenuItem value=""><em>No Breakdown (Single Group)</em></MenuItem>
                                       <MenuItem value="group">Board Group</MenuItem>
                                       {columns.map(col => (
                                           <MenuItem key={col.columnId} value={col.columnId}>
                                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                   <i className={`tabler-${col.columnType === 'status' ? 'list-details' : col.columnType === 'date' ? 'calendar' : 'text-color'}`} />
                                                   <span>{col.columnName || 'Untitled Column'}</span>
                                               </Box>
                                           </MenuItem>
                                       ))}
                                   </Select>
                               </FormControl>

                           {/* Date Grouping Option */}
                           {isDateColumn(currentWidgetConfig.groupByColumn) && (
                               <FormControl fullWidth className='mt-4'>
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

                           <FormControl fullWidth className='mt-4'>
                                <InputLabel>Filter by Group</InputLabel>
                                <Select
                                    multiple
                                    label="Filter by Group"
                                    value={currentWidgetConfig.settings?.filterGroupIds || (currentWidgetConfig.filterGroupId ? [String(currentWidgetConfig.filterGroupId)] : [])}
                                    onChange={e => {
                                        const vals = e.target.value
                                        setCurrentWidgetConfig({ 
                                            ...currentWidgetConfig, 
                                            settings: { ...currentWidgetConfig.settings, filterGroupIds: vals } 
                                        })
                                    }}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) return <em>All Groups (Default)</em>
                                        return selected.map(id => board.groups?.find(g => String(g.groupId) === String(id))?.groupName || `Group ${id}`).join(', ')
                                    }}
                                >
                                    {(board?.groups || []).map(g => {
                                        const isChecked = (currentWidgetConfig.settings?.filterGroupIds || (currentWidgetConfig.filterGroupId ? [String(currentWidgetConfig.filterGroupId)] : [])).includes(String(g.groupId))
                                        return (
                                            <MenuItem key={g.groupId} value={String(g.groupId)}>
                                                <Checkbox checked={isChecked} />
                                                <ListItemText primary={g.groupName} />
                                            </MenuItem>
                                        )
                                    })}
                                </Select>
                           </FormControl>

                           <div className='flex gap-2 mt-4'>
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
                                       <InputLabel>Value Columns (Flexible Y-Axis)</InputLabel>
                                       <Select
                                           multiple
                                           label="Value Columns (Flexible Y-Axis)"
                                           value={currentWidgetConfig.settings?.metrics || []}
                                           onChange={e => {
                                               const val = e.target.value
                                               setCurrentWidgetConfig({ 
                                                   ...currentWidgetConfig, 
                                                   settings: { ...currentWidgetConfig.settings, metrics: val },
                                                   metricColumn: val[0] || '' // Sync primary for compatibility
                                               })
                                           }}
                                           renderValue={(selected) => (
                                               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                   {selected.map((val) => (
                                                       <div key={val} className='bg-primary/20 text-primary text-xs px-2 py-0.5 rounded'>
                                                           {columns.find(c => c.columnId === val)?.columnName || val}
                                                       </div>
                                                   ))}
                                               </Box>
                                           )}
                                       >
                                           {columns.map(col => {
                                               const isNumeric = col.columnType === 'number' || col.columnType === '货币' || col.columnType === 'currency' || col.columnName?.toLowerCase().includes('pemasukan') || col.columnName?.toLowerCase().includes('nominal')
                                               return (
                                                   <MenuItem key={col.columnId} value={col.columnId}>
                                                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                           <i className={`tabler-${isNumeric ? 'hash' : 'text-color'} ${isNumeric ? 'text-primary' : 'text-textSecondary opacity-50'}`} />
                                                           <span>{col.columnName || 'Untitled Column'}</span>
                                                       </Box>
                                                   </MenuItem>
                                               )
                                           })}
                                       </Select>
                                   </FormControl>
                               )}
                            </div>
                        </Grid>

                        {/* Y-Axis Advanced Settings */}
                        <Grid item xs={12}>
                            <Divider>
                                <Typography variant='caption' sx={{ fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5 }}>
                                    Y-Axis Advanced
                                </Typography>
                            </Divider>
                        </Grid>
                        
                        <Grid item xs={12}>
                             <div className='flex items-center gap-4 mb-4'>
                                 <FormControl fullWidth>
                                     <InputLabel>Scale Min</InputLabel>
                                     <TextField 
                                         type='number' 
                                         size='small' 
                                         disabled={currentWidgetConfig.settings?.yAxisAuto}
                                         value={currentWidgetConfig.settings?.yAxisMin || ''}
                                         onChange={e => setCurrentWidgetConfig({
                                             ...currentWidgetConfig,
                                             settings: { ...currentWidgetConfig.settings, yAxisMin: e.target.value ? parseFloat(e.target.value) : null }
                                         })}
                                     />
                                 </FormControl>
                                 <FormControl fullWidth>
                                     <InputLabel>Scale Max</InputLabel>
                                     <TextField 
                                         type='number' 
                                         size='small' 
                                         disabled={currentWidgetConfig.settings?.yAxisAuto}
                                         value={currentWidgetConfig.settings?.yAxisMax || ''}
                                         onChange={e => setCurrentWidgetConfig({
                                             ...currentWidgetConfig,
                                             settings: { ...currentWidgetConfig.settings, yAxisMax: e.target.value ? parseFloat(e.target.value) : null }
                                         })}
                                     />
                                 </FormControl>
                             </div>
                             <div className='flex gap-4'>
                                 <Button 
                                     size='small' 
                                     variant={currentWidgetConfig.settings?.yAxisAuto ? 'contained' : 'outlined'}
                                     onClick={() => setCurrentWidgetConfig({
                                         ...currentWidgetConfig,
                                         settings: { ...currentWidgetConfig.settings, yAxisAuto: true }
                                     })}
                                 >
                                     Auto Scale
                                 </Button>
                                 <Button 
                                     size='small' 
                                     variant={!currentWidgetConfig.settings?.yAxisAuto ? 'contained' : 'outlined'}
                                     onClick={() => setCurrentWidgetConfig({
                                         ...currentWidgetConfig,
                                         settings: { ...currentWidgetConfig.settings, yAxisAuto: false }
                                     })}
                                 >
                                     Manual Scale
                                 </Button>
                             </div>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                 <InputLabel>Secondary Y-Axis Metrics</InputLabel>
                                 <Select
                                     multiple
                                     label="Secondary Y-Axis Metrics"
                                     value={currentWidgetConfig.settings?.secondaryMetrics || []}
                                     onChange={e => setCurrentWidgetConfig({
                                         ...currentWidgetConfig,
                                         settings: { ...currentWidgetConfig.settings, secondaryMetrics: e.target.value, showSecondaryAxis: e.target.value.length > 0 }
                                     })}
                                     renderValue={(selected) => `On Right Axis: ${selected.length} items`}
                                 >
                                     {(currentWidgetConfig.settings?.metrics || []).map(mId => (
                                         <MenuItem key={mId} value={mId}>
                                             {columns.find(c => c.columnId === mId)?.columnName || mId}
                                         </MenuItem>
                                     ))}
                                 </Select>
                            </FormControl>
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
                                     {currentWidgetConfig.chartType === 'summary' ? (
                                        <SummaryWidget widget={currentWidgetConfig} isPreview={true} />
                                     ) : (
                                        <ReactECharts 
                                            key={JSON.stringify(currentWidgetConfig) + theme.palette.mode}
                                            option={getChartOption(currentWidgetConfig, true)} 
                                            style={{ height: '100%', width: '100%', minHeight: '400px' }} 
                                            opts={{ renderer: 'canvas' }}
                                            theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
                                        />
                                     )}
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
              disabled={!currentWidgetConfig.title || !currentWidgetConfig.groupByColumn || loading}
            >
             {editingWidgetId ? 'Update Widget' : 'Create Widget'}
           </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DashboardView
