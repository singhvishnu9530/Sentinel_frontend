import type { Message } from '../types'

export interface TokenCost {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  usd: number
}

export interface ChatResponse {
  type: 'chat' | 'analysis'
  content: string
}

export async function streamMessages(
  messages: Message[],
  onToken: (token: string) => void,
  onProgress?: (message: string) => void,
  onCost?: (cost: TokenCost) => void,
): Promise<ChatResponse> {
  const payload = messages.map(m => ({ role: m.role, content: m.content }))

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: payload }),
  })

  if (!res.ok) throw new Error(`Server error: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let analysisContent: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') break

      try {
        const json = JSON.parse(data)

        if (json.type === 'progress') {
          onProgress?.(json.message)
          continue
        }
        if (json.type === 'cost') {
          onCost?.(json as TokenCost)
          continue
        }
        if (json.type === 'analysis') {
          // capture but keep reading so the trailing cost event arrives
          analysisContent = json.content
          continue
        }
        if (json.type === 'error') throw new Error(json.content)

        const token = json.choices?.[0]?.delta?.content
        if (token) {
          fullContent += token
          onToken(token)
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }

  if (analysisContent !== null) return { type: 'analysis', content: analysisContent }
  return { type: 'chat', content: fullContent }
}
