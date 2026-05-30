export default function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
        S
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5"
        style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.12)' }}>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        <span className="text-xs text-slate-400 transition-all">{label ?? 'Thinking…'}</span>
      </div>
    </div>
  )
}
