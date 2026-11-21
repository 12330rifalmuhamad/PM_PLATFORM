'use client'

import { useState, useEffect, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useSWR from 'swr'

const fetcher = url => fetch(url).then(res => res.json())

// NavItem kembali ke bentuk sederhana karena konten akan di-hide total
const NavItem = ({ href, icon, text, active = false, isBoard = false }) => (
  <li>
    <Link href={href} title={text}>
      <div
        className={`flex items-center p-2 text-sm rounded-md transition-colors duration-150
        ${isBoard ? 'pl-8' : ''}
        ${active ? 'bg-actionHover text-primary-main font-semibold' : 'text-textSecondary hover:bg-actionHover hover:text-textPrimary'}`}
      >
        <span className='text-lg'>{icon}</span>
        <span className='ml-3 truncate whitespace-nowrap'>{text}</span>
      </div>
    </Link>
  </li>
)

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isWorkspacesSectionOpen, setIsWorkspacesSectionOpen] = useState(false)
  const [openWorkspaces, setOpenWorkspaces] = useState({})
  const pathname = usePathname()

  const { data: workspaces } = useSWR('/api/workspaces', fetcher)
  const { data: boards, error } = useSWR('/api/boards', fetcher)

  const boardsByWorkspace = useMemo(() => {
    if (!boards || !workspaces) return {}
    const grouped = {}

    workspaces.forEach(ws => {
      grouped[ws.workspaceId] = boards.filter(
        board => board.workspaceId === ws.workspaceId || board.workspace?.workspaceId === ws.workspaceId
      )
    })

    return grouped
  }, [boards, workspaces])

  // Auto-expand dinonaktifkan agar ketika awal membuka aplikasi, semua workspace dan folder tetap collapsed
  // useEffect(() => {
  //   if (boards && pathname.includes('/board/')) {
  //     const boardId = pathname.split('/board/')[1]
  //     const currentBoard = boards.find(b => b.boardId.toString() === boardId)
  //
  //     if (currentBoard) {
  //       const workspaceId = currentBoard.workspaceId || currentBoard.workspace?.workspaceId
  //
  //       if (workspaceId) {
  //         setOpenWorkspaces(prev => ({ ...prev, [workspaceId]: true }))
  //       }
  //     }
  //   }
  // }, [boards, pathname])

  const toggleWorkspace = workspaceId => {
    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceId]: !prev[workspaceId]
    }))
  }

  return (
    <aside
      className={`h-screen bg-backgroundPaper text-textPrimary flex flex-col relative transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-0 border-none' : 'w-64 border-r border-divider'}`}
    >
      {/* TOMBOL TOGGLE
        - Saat Buka: right-[-12px] (menempel di border)
        - Saat Tutup: right-[-40px] (mengambang di luar sidebar yang lebarnya 0)
      */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute top-6 z-50 flex items-center justify-center w-8 h-8 rounded-full shadow-md border border-divider focus:outline-none transition-all duration-300 bg-backgroundPaper text-textPrimary hover:bg-actionHover
        ${
          isCollapsed
            ? '-right-12' // Gaya saat tertutup (floating icon)
            : '-right-4' // Gaya saat terbuka (border button)
        }`}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <i
          className={`tabler-chevron-left text-xs transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>

      {/* WRAPPER KONTEN
        Menggunakan w-64 fix di dalam agar layout tidak berantakan saat transisi width parent.
        Opacity & Visibility mengatur efek menghilang.
      */}
      <div
        className={`flex flex-col h-full w-64 overflow-hidden transition-all duration-200
        ${isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
      >
        {/* Navigasi Atas */}
        <nav className='px-2 py-4'>
          <ul className='space-y-2'>
            <NavItem
              href='/dashboards/crm'
              icon={<i className='tabler-home' />}
              text='Home'
              active={pathname.includes('/dashboards/crm')}
            />
            <NavItem href='#' icon={<i className='tabler-calendar-check' />} text='My work' />
          </ul>
        </nav>

        <hr className='border-divider mx-2' />

        {/* Bagian Workspaces */}
        <div className='px-2 py-4 overflow-y-auto custom-scrollbar flex-1'>
          <div className='flex justify-between items-center mb-2'>
            <button
              onClick={() => setIsWorkspacesSectionOpen(!isWorkspacesSectionOpen)}
              className='flex items-center w-full text-textSecondary hover:text-textPrimary'
            >
              <i
                className={`tabler-chevron-down transition-transform duration-200 ${
                  isWorkspacesSectionOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
              <span className='ml-2 font-semibold'>Workspaces</span>
            </button>
          </div>

          {isWorkspacesSectionOpen && (
            <div className='flex flex-col space-y-2 mt-2'>
              {!workspaces && !error && <div className='text-textDisabled px-2 text-xs'>Loading...</div>}

              {Array.isArray(workspaces) &&
                workspaces.map(workspace => {
                  const workspaceBoards = boardsByWorkspace[workspace.workspaceId] || []
                  const isWorkspaceOpen = openWorkspaces[workspace.workspaceId] ?? false

                  return (
                    <div key={workspace.workspaceId} className='space-y-1'>
                      <div className='group flex items-center justify-between'>
                        <button
                          onClick={() => toggleWorkspace(workspace.workspaceId)}
                          className='flex items-center flex-1 text-left py-1 hover:bg-actionHover rounded px-1'
                        >
                          <i
                            className={`tabler-chevron-right text-textDisabled text-xs transition-transform duration-200 ${
                              isWorkspaceOpen ? 'rotate-90' : ''
                            }`}
                          />
                          <i className='tabler-folder text-base text-primary-main ml-1' />
                          <span className='ml-2 text-sm font-medium text-textPrimary truncate w-32'>
                            {workspace.workspaceName}
                          </span>
                        </button>
                      </div>

                      {isWorkspaceOpen && (
                        <ul className='ml-6 space-y-1'>
                          {workspaceBoards.map(board => (
                            <NavItem
                              key={board.boardId}
                              href={`/board/${board.boardId}`}
                              icon={<i className='tabler-table' />}
                              text={board.boardName}
                              active={pathname === `/board/${board.boardId}`}
                              isBoard={true}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Footer Guest */}
        <div className='mt-auto p-4 text-center'>
          <div className='bg-white rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-3'>
            <svg width='28' height='28' viewBox='0 0 125 125' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M62.5 125C97.0178 125 125 97.0178 125 62.5C125 27.9822 97.0178 0 62.5 0C27.9822 0 0 27.9822 0 62.5C0 97.0178 27.9822 125 62.5 125Z'
                fill='#5034FF'
              />
              <path
                d='M96.3533 58.7407C92.2067 58.7407 88.7533 62.1941 88.7533 66.3407V80.0941C88.7533 84.2407 85.3 87.6941 81.1533 87.6941C77.0067 87.6941 73.5533 84.2407 73.5533 80.0941V44.9059C73.5533 40.7593 70.1 37.3059 65.9533 37.3059C61.8067 37.3059 58.3533 40.7593 58.3533 44.9059V80.0941C58.3533 84.2407 54.9 87.6941 50.7533 87.6941C46.6067 87.6941 43.1533 84.2407 43.1533 80.0941V66.3407C43.1533 62.1941 39.7 58.7407 35.5533 58.7407C31.4067 58.7407 27.9533 62.1941 27.9533 66.3407V80.0941C27.9533 91.3807 36.8733 100.3 47.9533 100.3C59.0333 100.3 67.9533 91.3807 67.9533 80.0941V44.9059C67.9533 33.6193 76.8733 24.7059 87.9533 24.7059C99.0333 24.7059 107.953 33.6193 107.953 44.9059V66.3407C107.953 70.4874 104.5 73.9407 100.353 73.9407C96.2067 73.9407 92.7533 70.4874 92.7533 66.3407C92.7533 62.1941 92.7533 58.7407 96.3533 58.7407Z'
                fill='white'
              />
            </svg>
          </div>
          <p className='font-semibold text-sm'>Youre a Guest here</p>
          <p className='text-xs text-textSecondary mt-1'>Get monday.coms full power</p>
          <Link href='/register'>
            <span className='text-blue-400 hover:underline text-sm font-semibold mt-2 block'>Create your account</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
