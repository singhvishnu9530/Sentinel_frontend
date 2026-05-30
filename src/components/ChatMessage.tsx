import type { Message } from '../types'
import AnalysisReport from './AnalysisReport'

export interface Props {
  message: Message
  isStreaming?: boolean
}

export default function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  if (message.type === 'analysis' && message.role === 'assistant') {
    return (
      <div className="w-full">
        <AnalysisReport result={JSON.parse(message.content)} />
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
          S
        </div>
      )}

      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
          style={isUser
            ? { background: 'linear-gradient(135deg, #0891b2, #0284c7)', color: 'white' }
            : { background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.12)', color: '#e2e8f0' }
          }>
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
        {message.content && (
          <span className="text-[10px] px-1 text-slate-500">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
          U
        </div>
      )}
    </div>
  )
}
