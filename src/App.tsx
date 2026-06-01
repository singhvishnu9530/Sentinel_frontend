import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import type { Message, User, ChatSession } from './types'
import { streamMessages, extractFile } from './utils/api'
import { getUser, clearSession } from './utils/auth'
import AuthPage from './components/AuthPage'
import ChatMessage from './components/ChatMessage'
import TypingIndicator from './components/TypingIndicator'
import Sidebar from './components/Sidebar'

function generateId() {
  return Math.random().toString(36).slice(2)
}

// Sessions are scoped per user so one account never sees another's history.
function sessionsKey(userId: number) {
  return `sentinel_sessions_${userId}`
}

function loadSessions(userId: number): ChatSession[] {
  try {
    const raw = localStorage.getItem(sessionsKey(userId))
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

function saveSessions(userId: number, sessions: ChatSession[]) {
  localStorage.setItem(sessionsKey(userId), JSON.stringify(sessions))
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
  // key on user.id so switching accounts fully re-initialises Chat state (no stale sessions)
  return <Chat key={user.id} user={user} onLogout={() => { clearSession(); setUser(null) }} />
}

function Chat({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const s = loadSessions(user.id)
    return s.length ? s : [newSession()]
  })
  const [activeId, setActiveId] = useState<string>(() => {
    const s = loadSessions(user.id)
    return s.length ? s[0].id : sessions[0]?.id ?? ''
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [sessionCost, setSessionCost] = useState({ tokens: 0, usd: 0 })
  const [locked, setLocked] = useState(!!user.locked)
  const [lockedUntil, setLockedUntil] = useState<string | null>(user.locked_until ?? null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [attachedFile, setAttachedFile] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setExtracting(true)
    try {
      const { text, filename } = await extractFile(file)
      setInput(prev => (prev ? prev + '\n\n' : '') + text)
      setAttachedFile(filename)
      requestAnimationFrame(autoResize)
    } catch (err) {
      setAttachedFile(`⚠ ${err instanceof Error ? err.message : 'Could not read file'}`)
    } finally {
      setExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0]
  const messages = activeSession?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    saveSessions(user.id, sessions)
  }, [sessions, user.id])

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
        user.id,
        info => { setLocked(info.locked); setLockedUntil(info.locked_until ?? null) },
      )

      if (result.type === 'limit') {
        // Remove the empty placeholder — the lock banner conveys the state
        setSessions(prev => prev.map(s => s.id === activeId
          ? { ...s, messages: s.messages.filter(m => m.id !== assistantId) }
          : s
        ))
      } else if (result.type === 'analysis') {
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
      {/* Upgrade modal — pricing teaser, no real upgrade (coming soon) */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowUpgrade(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#0b1322', border: '1px solid rgba(6,182,212,0.25)' }}>
            <div className="px-6 py-5 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(14,165,233,0.1))' }}>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="text-lg font-bold text-white">Sentinel Pro</h3>
              <p className="text-xs text-slate-400 mt-1">Unlimited analyses & priority processing</p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span className="text-3xl font-bold text-white">$19</span>
                <span className="text-sm text-slate-500">/ month</span>
              </div>
              <ul className="space-y-2 mb-5 text-sm text-slate-300">
                <li className="flex gap-2"><span className="text-cyan-400">✓</span> Unlimited build guides</li>
                <li className="flex gap-2"><span className="text-cyan-400">✓</span> No token limits</li>
                <li className="flex gap-2"><span className="text-cyan-400">✓</span> Priority analysis speed</li>
                <li className="flex gap-2"><span className="text-cyan-400">✓</span> Team sharing & history</li>
              </ul>
              <div className="rounded-xl px-4 py-3 text-center mb-3"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                <p className="text-sm font-semibold text-yellow-300">🚧 Coming soon</p>
                <p className="text-xs text-slate-500 mt-0.5">Paid plans aren't live yet — your limit resets automatically.</p>
              </div>
              <button onClick={() => setShowUpgrade(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
            {/* Usage-limit / upgrade banner */}
            {locked && (
              <div className="mb-3 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span className="text-lg">🚫</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-300">You've used your 10,000 free tokens</p>
                  <p className="text-xs text-slate-400">
                    {lockedUntil
                      ? `Free access returns on ${new Date(lockedUntil).toLocaleDateString([], { month: 'short', day: 'numeric' })}, or upgrade to keep going.`
                      : 'Upgrade to Pro to continue.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                  ⚡ Upgrade to Pro
                </button>
              </div>
            )}
            {/* Attached file indicator */}
            {(attachedFile || extracting) && (
              <div className="mb-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-fit"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <span>{extracting ? '⏳' : '📄'}</span>
                <span className="text-slate-300">{extracting ? 'Reading file…' : attachedFile}</span>
                {!extracting && (
                  <button onClick={() => setAttachedFile(null)} className="text-slate-500 hover:text-slate-300">✕</button>
                )}
              </div>
            )}
            <div className="flex gap-3 items-end p-2 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Hidden file input + attach button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || extracting || locked}
                title="Attach a PDF, Word doc, text file, or image"
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 text-slate-400 hover:text-cyan-400"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                placeholder={locked ? 'Upgrade to Pro to continue…' : 'Describe your project, paste a brief, or attach a file…'}
                rows={1}
                disabled={loading || locked}
                className="flex-1 resize-none bg-transparent text-slate-100 placeholder-slate-600 px-3 py-2 text-sm outline-none leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading || locked}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-600">
              Describe your project, paste a brief, or attach a PDF / Word / text / image file
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
