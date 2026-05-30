import type { Message } from '../types'

export interface ChatResponse {
  type: 'chat' | 'analysis'
  content: string
}

export async function streamMessages(
  messages: Message[],
  onToken: (token: string) => void,
  onProgress?: (message: string) => void,
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

        // Live progress phase while the analysis runs
        if (json.type === 'progress') {
          onProgress?.(json.message)
          continue
        }
        // Final analysis result
        if (json.type === 'analysis') return { type: 'analysis', content: json.content }
        if (json.type === 'error') throw new Error(json.content)

        // Regular streamed chat text
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

  return { type: 'chat', content: fullContent }
}
