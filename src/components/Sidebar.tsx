import { useState, useRef, useEffect } from 'react'
import type { ChatSession } from '../types'

interface Props {
  sessions: ChatSession[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  userName: string
  onLogout: () => void
}

export default function Sidebar({ sessions, activeId, onSelect, onNew, onDelete, userName, onLogout }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="flex flex-col w-60 shrink-0 h-screen"
      style={{ background: 'rgba(6,182,212,0.03)', borderRight: '1px solid rgba(6,182,212,0.08)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: 'rgba(6,182,212,0.08)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>S</div>
        <span className="text-sm font-semibold text-white">Sentinel AI</span>
      </div>

      {/* New chat */}
      <div className="px-3 py-3">
        <button onClick={onNew}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white transition-all"
          style={{ border: '1px solid rgba(6,182,212,0.15)', background: 'rgba(6,182,212,0.05)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.05)')}>
          <span className="text-cyan-400 text-base font-light">+</span>
          <span>New Analysis</span>
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin">
        {sessions.length === 0 && (
          <p className="text-xs text-slate-600 text-center mt-4">No previous sessions</p>
        )}
        {sessions.map(session => (
          <div key={session.id} className="group relative">
            <button onClick={() => onSelect(session.id)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all"
              style={{
                background: session.id === activeId ? 'rgba(6,182,212,0.12)' : 'transparent',
                border: session.id === activeId ? '1px solid rgba(6,182,212,0.25)' : '1px solid transparent',
                color: session.id === activeId ? '#67e8f9' : '#94a3b8',
              }}
              onMouseEnter={e => { if (session.id !== activeId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (session.id !== activeId) e.currentTarget.style.background = 'transparent' }}>
              <p className="truncate font-medium">{session.title}</p>
              <p className="text-slate-600 text-xs mt-0.5">
                {new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(session.id) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-xs px-1">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* User with popup */}
      <div className="px-3 py-3 border-t relative" style={{ borderColor: 'rgba(6,182,212,0.08)' }} ref={menuRef}>

        {/* Popup menu */}
        {showMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl overflow-hidden"
            style={{ background: '#0a1628', border: '1px solid rgba(6,182,212,0.15)', boxShadow: '0 -8px 24px rgba(0,0,0,0.4)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(6,182,212,0.08)' }}>
              <p className="text-xs font-semibold text-white">{userName}</p>
            </div>
            <button
              onClick={() => { setShowMenu(false); onLogout() }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-red-400 hover:bg-red-500/10 transition-all text-left">
              <span>⎋</span>
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* User row — click to toggle popup */}
        <button
          onClick={() => setShowMenu(v => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
          style={{
            background: showMenu ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.05)',
            border: `1px solid ${showMenu ? 'rgba(6,182,212,0.25)' : 'rgba(6,182,212,0.1)'}`,
          }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-400 truncate flex-1 text-left">{userName}</span>
          <span className="text-slate-600 text-xs">{showMenu ? '▲' : '▼'}</span>
        </button>
      </div>
    </div>
  )
}
