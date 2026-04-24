'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useParams, useRouter, usePathname } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { Title, Description } from '@radix-ui/react-dialog'
import { toast } from 'react-toastify'

// Component Imports
import DefaultSuggestions from './DefaultSuggestions'
import NoResult from './NoResult'

// Hook Imports
import useSWR from 'swr'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const fetcher = url => fetch(url).then(res => res.json())

// Style Imports
import './styles.css'

// Data Imports
import data from '@/data/searchData'

// Transform the data to group items by their sections
const transformedData = data.reduce((acc, item) => {
  const existingSection = acc.find(section => section.title === item.section)

  const newItem = {
    id: item.id,
    name: item.name,
    url: item.url,
    excludeLang: item.excludeLang,
    icon: item.icon,
    shortcut: item.shortcut
  }

  if (existingSection) {
    existingSection.items.push(newItem)
  } else {
    acc.push({ title: item.section, items: [newItem] })
  }

  return acc
}, [])

// SearchItem Component for introduce the shortcut keys
const SearchItem = ({ children, shortcut, value, currentPath, url, onSelect = () => {} }) => {
  return (
    <CommandItem
      onSelect={onSelect}
      value={value}
      className={classnames('mli-2 mbe-px last:mbe-0 rounded', {
        'active-searchItem': currentPath === url
      })}
    >
      {children}
      {shortcut && (
        <div cmdk-vercel-shortcuts=''>
          {shortcut.split(' ').map(key => {
            return <kbd key={key}>{key}</kbd>
          })}
        </div>
      )}
    </CommandItem>
  )
}

// Helper function to filter and limit results per section based on the number of sections
const getFilteredResults = sections => {
  const limit = sections.length > 1 ? 3 : 5

  return sections.map(section => ({
    ...section,
    items: section.items.slice(0, limit)
  }))
}

// Footer component for the search menu
const CommandFooter = () => {
  return (
    <div cmdk-footer=''>
      <div className='flex items-center gap-1'>
        <kbd>
          <i className='tabler-arrow-up text-base' />
        </kbd>
        <kbd>
          <i className='tabler-arrow-down text-base' />
        </kbd>
        <span>to navigate</span>
      </div>
      <div className='flex items-center gap-1'>
        <kbd>
          <i className='tabler-corner-down-left text-base' />
        </kbd>
        <span>to open</span>
      </div>
      <div className='flex items-center gap-1'>
        <kbd>esc</kbd>
        <span>to close</span>
      </div>
    </div>
  )
}

const NavSearch = () => {
  // States
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Hooks
  const router = useRouter()
  const pathName = usePathname()
  const { settings } = useSettings()
  const { lang: locale } = useParams()
  const { isBreakpointReached } = useVerticalNav()

  // Debounce search value
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Fetch dynamic results
  const { data: dynamicData, isLoading } = useSWR(
    debouncedSearch.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedSearch)}` : null,
    fetcher
  )

  // When an item is selected from the search results
  const onSearchItemSelect = item => {
    if (item.url) {
        item.url.startsWith('http')
        ? window.open(item.url, '_blank')
        : router.push(item.excludeLang ? item.url : getLocalizedUrl(item.url, locale))
    }
    setOpen(false)
  }

  // Filter the data based on the search query
  const filteredData = (sections, query) => {
    const searchQuery = query.trim().toLowerCase()

    return sections
      .filter(section => {
        const sectionMatches = section.title.toLowerCase().includes(searchQuery)

        const itemsMatch = section.items.some(
          item =>
            item.name.toLowerCase().includes(searchQuery) ||
            (item.shortcut && item.shortcut.toLowerCase().includes(searchQuery))
        )

        return sectionMatches || itemsMatch
      })
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            section.title.toLowerCase().includes(searchQuery) ||
            item.name.toLowerCase().includes(searchQuery) ||
            (item.shortcut && item.shortcut.toLowerCase().includes(searchQuery))
        )
      }))
  }

  const limitedData = getFilteredResults(filteredData(transformedData, searchValue))

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = e => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener('keydown', down)

    return () => document.removeEventListener('keydown', down)
  }, [])

  // Reset the search value when the menu is closed
  useEffect(() => {
    if (!open && searchValue !== '') {
      setSearchValue('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      {isBreakpointReached || settings.layout === 'horizontal' ? (
        <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
          <i className='tabler-search text-2xl' />
        </IconButton>
      ) : (
        <div className='flex items-center gap-2 cursor-pointer' onClick={() => setOpen(true)}>
          <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
            <i className='tabler-search text-2xl' />
          </IconButton>
          <div className='whitespace-nowrap select-none text-textDisabled'>Search ⌘K</div>
        </div>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className='flex items-center justify-between border-be pli-4 plb-3 gap-2'>
          <Title hidden />
          <Description hidden />
          <i className='tabler-search' />
          <CommandInput value={searchValue} onValueChange={setSearchValue} />
          <span className='text-textDisabled'>[esc]</span>
          <i className='tabler-x cursor-pointer' onClick={() => setOpen(false)} />
        </div>
        <CommandList>
          {searchValue ? (
            <>
              {isLoading && (
                  <div className='p-4 text-center text-textDisabled flex items-center justify-center gap-2'>
                       <i className='tabler-loader animate-spin' /> Searching...
                  </div>
              )}

              {/* Dynamic Results: Boards */}
              {dynamicData?.boards?.length > 0 && (
                <CommandGroup heading='BOARDS'>
                  {dynamicData.boards.map((board) => (
                    <SearchItem
                      key={`board-${board.boardId}`}
                      currentPath={pathName}
                      url={`/apps/kanban`} // Or a specific board URL if available
                      value={`${board.boardName} board`}
                      onSelect={() => onSearchItemSelect({ url: '/apps/kanban' })}
                    >
                      <i className='tabler-layout-board text-xl text-info' />
                      <Typography variant='body2' color='text.primary'>{board.boardName}</Typography>
                    </SearchItem>
                  ))}
                </CommandGroup>
              )}

              {/* Dynamic Results: Tasks */}
              {dynamicData?.tasks?.length > 0 && (
                <CommandGroup heading='TASKS'>
                  {dynamicData.tasks.map((task) => (
                    <SearchItem
                      key={`task-${task.taskId}`}
                      currentPath={pathName}
                      url={`/apps/kanban`}
                      value={`${task.taskTitle} task`}
                      onSelect={() => onSearchItemSelect({ url: '/apps/kanban' })}
                    >
                      <i className='tabler-square-check text-xl text-primary' />
                      <div className='flex flex-col'>
                        <Typography variant='body2' color='text.primary'>{task.taskTitle}</Typography>
                        <Typography variant='caption'>{task.group?.board?.boardName} > {task.group?.groupName}</Typography>
                      </div>
                    </SearchItem>
                  ))}
                </CommandGroup>
              )}

              {/* Dynamic Results: Notes */}
              {dynamicData?.notes?.length > 0 && (
                <CommandGroup heading='NOTES'>
                  {dynamicData.notes.map((note) => (
                    <SearchItem
                      key={`note-${note.noteId}`}
                      currentPath={pathName}
                      url='#'
                      value={`${note.content} note`}
                      onSelect={() => {
                        // Custom logic to open notes widget could go here
                        toast.info('Quick Note found. Open the widget to view.')
                        setOpen(false)
                      }}
                    >
                      <i className='tabler-notes text-xl text-warning' />
                      <Typography variant='body2' noWrap>{note.content.replace(/<[^>]*>/g, '')}</Typography>
                    </SearchItem>
                  ))}
                </CommandGroup>
              )}

              {/* Static Nav Results */}
              {limitedData.length > 0 ? (
                limitedData.map((section, index) => (
                  <CommandGroup key={index} heading={section.title.toUpperCase()} className='text-xs'>
                    {section.items.map((item, index) => {
                      return (
                        <SearchItem
                          shortcut={item.shortcut}
                          key={index}
                          currentPath={pathName}
                          url={getLocalizedUrl(item.url, locale)}
                          value={`${item.name} ${section.title} ${item.shortcut}`}
                          onSelect={() => onSearchItemSelect(item)}
                        >
                          {item.icon && <i className={classnames('text-xl', item.icon)} />}
                          {item.name}
                        </SearchItem>
                      )
                    })}
                  </CommandGroup>
                ))
              ) : (
                !isLoading && !dynamicData?.tasks?.length && !dynamicData?.notes?.length && (
                  <CommandEmpty>
                    <NoResult searchValue={searchValue} setOpen={setOpen} />
                  </CommandEmpty>
                )
              )}
            </>
          ) : (
            <DefaultSuggestions setOpen={setOpen} />
          )}
        </CommandList>
        <CommandFooter />
      </CommandDialog>
    </>
  )
}

export default NavSearch
