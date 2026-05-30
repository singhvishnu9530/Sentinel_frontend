import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import type { Message, User, ChatSession } from './types'
import { streamMessages } from './utils/api'
import { getUser, clearSession } from './utils/auth'
import AuthPage from './components/AuthPage'
import ChatMessage from './components/ChatMessage'
import TypingIndicator from './components/TypingIndicator'
import Sidebar from './components/Sidebar'

const SESSIONS_KEY = 'sentinel_sessions'

function generateId() {
  return Math.random().toString(36).slice(2)
}


function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (!raw) return []
    const sessions = JSON.parse(raw) as ChatSession[]
    return sessions.map(s => ({
      ...s,
      messages: s.messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function newSession(): ChatSession {
  return {
    id: generateId(),
    title: 'New Analysis',
    messages: [],
    updatedAt: new Date().toISOString(),
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => getUser())
  if (!user) return <AuthPage onAuth={setUser} />
  return <Chat user={user} onLogout={() => { clearSession(); setUser(null) }} />
}

function Chat({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const s = loadSessions()
    return s.length ? s : [newSession()]
  })
  const [activeId, setActiveId] = useState<string>(() => {
    const s = loadSessions()
    return s.length ? s[0].id : sessions[0]?.id ?? ''
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [sessionCost, setSessionCost] = useState({ tokens: 0, usd: 0 })
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0]
  const messages = activeSession?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  const updateSession = (id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
  }

  const handleNew = () => {
    const session = newSession()
    setSessions(prev => [session, ...prev])
    setActiveId(session.id)
    setInput('')
  }

  const handleDelete = (id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (next.length === 0) {
        const fresh = newSession()
        setActiveId(fresh.id)
        return [fresh]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !activeSession) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: Message = { id: generateId(), role: 'user', content: text, type: 'chat', timestamp: new Date() }
    const historyWithUser = [...messages, userMsg]

    // Set title from first user message
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0
    const title = isFirstMessage ? text.slice(0, 40) + (text.length > 40 ? '…' : '') : activeSession.title

    updateSession(activeId, { messages: historyWithUser, title })
    setLoading(true)

    const assistantId = generateId()
    setStreamingId(assistantId)
    const placeholder: Message = { id: assistantId, role: 'assistant', content: '', type: 'chat', timestamp: new Date() }
    const withPlaceholder = [...historyWithUser, placeholder]
    updateSession(activeId, { messages: withPlaceholder, title })

    try {
      const result = await streamMessages(
        historyWithUser,
        token => {
          setProgress(null)
          setSessions(prev => prev.map(s => s.id === activeId
            ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: m.content + token } : m) }
            : s
          ))
        },
        message => setProgress(message),
        cost => setSessionCost(prev => ({
          tokens: prev.tokens + cost.total_tokens,
          usd: prev.usd + cost.usd,
        })),
      )

      if (result.type === 'analysis') {
        setSessions(prev => prev.map(s => s.id === activeId
          ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: result.content, type: 'analysis' } : m) }
          : s
        ))
      }
    } catch (err) {
      setSessions(prev => prev.map(s => s.id === activeId
        ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}` } : m) }
        : s
      ))
    } finally {
      setLoading(false)
      setStreamingId(null)
      setProgress(null)
    }
  }, [input, loading, messages, activeSession, activeId])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  return (
    <div className="flex h-screen" style={{ background: '#050a14' }}>
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={id => { setActiveId(id); setInput('') }}
        onNew={handleNew}
        onDelete={handleDelete}
        userName={user.name}
        onLogout={onLogout}
      />

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(7,7,15,0.8)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h2 className="text-sm font-semibold text-white truncate">{activeSession?.title ?? 'New Analysis'}</h2>
            <p className="text-xs text-slate-600">Requirement Autopsy Engine</p>
          </div>
          <div className="flex items-center gap-3">
            {sessionCost.tokens > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}
                title={`${sessionCost.tokens.toLocaleString()} tokens this session`}>
                <span className="text-xs text-slate-500">💰</span>
                <span className="text-xs font-medium text-cyan-300">${sessionCost.usd.toFixed(4)}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">{(sessionCost.tokens / 1000).toFixed(1)}k tok</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Live</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-5"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', boxShadow: '0 0 30px rgba(6,182,212,0.25)' }}>
                S
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Build Guide Generator</h2>
              <p className="text-sm text-slate-500 max-w-sm mb-8">
                Describe your project and get a clear build guide — what technology to use, how to start, and what it will cost.
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-lg w-full">
                {[
                  { icon: '🧱', label: 'Tech Stack' },
                  { icon: '🗺️', label: 'Build Plan' },
                  { icon: '💰', label: 'Cost Estimate' },
                  { icon: '🛡️', label: 'Security' },
                  { icon: '⚙️', label: 'Risks' },
                  { icon: '🚀', label: 'Deployment' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-slate-400"
                    style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}>
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
              {messages.map(msg => {
                // Hide the empty streaming placeholder — show the typing/progress indicator instead
                if (msg.id === streamingId && !msg.content) return null
                return <ChatMessage key={msg.id} message={msg} isStreaming={msg.id === streamingId} />
              })}
              {loading && (() => {
                const streamingMsg = messages.find(m => m.id === streamingId)
                if (streamingMsg && streamingMsg.content) return null
                return <TypingIndicator label={progress ?? undefined} />
              })()}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t px-6 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(7,7,15,0.9)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end p-2 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                placeholder="Describe your project or paste a brief… (Shift+Enter for new line)"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-slate-100 placeholder-slate-600 px-3 py-2 text-sm outline-none leading-relaxed"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-600">
              Sentinel will generate a full build guide once it understands your project
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
