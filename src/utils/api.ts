import type { Message, ChatSession } from '../types'
import { API_BASE, authHeader, clearSession } from './auth'

// ── Server-side chat session persistence (user_id comes from the JWT) ─────────

export async function fetchSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/api/sessions`, { headers: authHeader() })
  if (!res.ok) throw new Error('Could not load sessions')
  const data = await res.json()
  // revive timestamps (stored as ISO strings)
  return (data.sessions as ChatSession[]).map(s => ({
    ...s,
    messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
  }))
}

export async function saveSession(session: ChatSession): Promise<void> {
  await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      id: session.id,
      title: session.title,
      messages: session.messages,
      updatedAt: session.updatedAt,
    }),
  })
}

export async function deleteSessionRemote(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE', headers: authHeader() })
}

export interface TokenCost {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  usd: number
}

export interface ChatResponse {
  type: 'chat' | 'analysis' | 'limit'
  content: string
}

export interface LimitInfo {
  locked: boolean
  locked_until?: string | null
  tokens_used?: number
  token_limit?: number | null
}

export async function streamMessages(
  messages: Message[],
  onToken: (token: string) => void,
  onProgress?: (message: string) => void,
  onCost?: (cost: TokenCost) => void,
  onLimit?: (info: LimitInfo) => void,
): Promise<ChatResponse> {
  const payload = messages.map(m => ({ role: m.role, content: m.content }))

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ messages: payload }),
  })

  if (res.status === 401) {
    // token missing/expired — force re-login
    clearSession()
    window.location.reload()
    throw new Error('Session expired — please sign in again')
  }
  if (!res.ok) throw new Error(`Server error: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let analysisContent: string | null = null
  let limitHit = false
  let buffer = '' // holds a partial trailing line between reads — SSE lines can span network chunks

  // Process one complete "data: ..." line. Returns false when [DONE] is seen.
  const handleLine = (line: string): boolean => {
    if (!line.startsWith('data: ')) return true
    const data = line.slice(6).trim()
    if (data === '[DONE]') return false
    try {
      const json = JSON.parse(data)
      if (json.type === 'limit') { limitHit = true; onLimit?.(json as LimitInfo); return true }
      if (json.type === 'progress') { onProgress?.(json.message); return true }
      if (json.type === 'cost') {
        onCost?.(json as TokenCost)
        // a turn can push the user over the limit — surface it
        if (json.locked) onLimit?.(json as LimitInfo)
        return true
      }
      if (json.type === 'analysis') { analysisContent = json.content; return true }
      if (json.type === 'error') throw new Error(json.content)
      const token = json.choices?.[0]?.delta?.content
      if (token) { fullContent += token; onToken(token) }
    } catch (e) {
      if (e instanceof SyntaxError) return true // partial/garbled JSON — skip safely
      throw e
    }
    return true
  }

  let done = false
  while (!done) {
    const { done: streamDone, value } = await reader.read()
    if (streamDone) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // last element is a possibly-incomplete line — keep buffering it

    for (const line of lines) {
      if (!handleLine(line)) { done = true; break }
    }
  }
  // flush any complete line left in the buffer at stream end
  if (buffer) handleLine(buffer)

  if (limitHit && !fullContent && analysisContent === null) {
    return { type: 'limit', content: '' }
  }
  if (analysisContent !== null) return { type: 'analysis', content: analysisContent }
  return { type: 'chat', content: fullContent }
}

export interface ExtractResult {
  filename: string
  text: string
  chars: number
}

export async function extractFile(file: File): Promise<ExtractResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/extract`, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Could not read file')
  return data as ExtractResult
}
