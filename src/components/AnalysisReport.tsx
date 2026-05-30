import { useState } from 'react'
import type { AnalysisResult, BlueprintLayer } from '../types'

function BasisTag({ basis }: { basis: string }) {
  const fromBrief = basis?.toLowerCase().includes('brief')
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
      style={fromBrief
        ? { background: 'rgba(6,182,212,0.12)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.25)' }
        : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}
    >
      {fromBrief ? 'From brief' : 'Assumption'}
    </span>
  )
}

function CollapsibleSection({ title, count, defaultOpen, children }: {
  title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          {title}
          {count != null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-slate-500"
              style={{ background: 'rgba(255,255,255,0.06)' }}>{count}</span>
          )}
        </span>
        <span className="text-slate-700 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

function StackRow({ layer }: { layer: BlueprintLayer }) {
  const [open, setOpen] = useState(false)
  const hasDetail = layer.why || layer.alternatives?.length > 0
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={() => hasDetail && setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-28 shrink-0">{layer.layer}</span>
        <span className="text-sm font-bold text-white flex-1 min-w-0 truncate">{layer.choice}</span>
        <BasisTag basis={layer.basis} />
        {layer.cost && <span className="text-xs text-cyan-400 font-medium shrink-0 hidden sm:inline">{layer.cost}</span>}
        {hasDetail && <span className="text-slate-700 text-xs shrink-0">{open ? '▲' : '▼'}</span>}
      </button>
      {open && (
        <div className="px-4 pb-3 pl-32 space-y-2">
          {layer.why && <p className="text-xs text-slate-400 leading-relaxed">{layer.why}</p>}
          {layer.cost && <p className="text-xs text-cyan-400 sm:hidden">{layer.cost}</p>}
          {layer.alternatives?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-600">Or swap to:</span>
              {layer.alternatives.map((alt, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {alt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AnalysisReport({ result }: { result: AnalysisResult }) {
  if (result.errors?.length) {
    return (
      <div className="rounded-2xl p-4 text-sm text-red-300"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        {result.errors.join(', ')}
      </div>
    )
  }

  const bp = result.build_blueprint_report
  if (!bp) {
    return (
      <div className="rounded-2xl p-4 text-sm text-slate-400"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        No blueprint generated.
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">

      {/* ── LEVEL 1: At a glance ─────────────────────────────── */}
      <div className="rounded-2xl px-5 py-4"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(14,165,233,0.08))', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🛠️ Build Blueprint</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-cyan-300 font-medium"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
            {bp.project_type}
          </span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{bp.summary}</p>

        {/* Stack chips — instant glance */}
        {bp.stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {bp.stack.map((l, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg font-medium text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {l.choice}
              </span>
            ))}
          </div>
        )}

        {bp.estimated_monthly_cost && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <span className="text-xs text-slate-500">Est. monthly cost</span>
            <span className="text-sm font-bold text-cyan-300">{bp.estimated_monthly_cost}</span>
          </div>
        )}
      </div>

      {/* ── LEVEL 2: The stack with options ──────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(6,182,212,0.08)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">📦 The Stack</p>
          <p className="text-[10px] text-slate-500">tap a row for why + alternatives</p>
        </div>
        <div style={{ background: 'rgba(5,10,20,0.4)' }}>
          {bp.stack.map((layer, i) => <StackRow key={i} layer={layer} />)}
        </div>
      </div>

      {/* Assumptions — honesty about what wasn't in the brief */}
      {bp.assumptions?.length > 0 && (
        <CollapsibleSection title="🧭 Assumptions We Made" count={bp.assumptions.length} defaultOpen>
          <ul className="space-y-1.5 pt-1">
            {bp.assumptions.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-400">
                <span className="text-slate-600 mt-0.5">•</span>{a}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Key questions — what would change the blueprint */}
      {bp.key_questions?.length > 0 && (
        <CollapsibleSection title="❓ Questions That Would Change This" count={bp.key_questions.length} defaultOpen>
          <ul className="space-y-1.5 pt-1">
            {bp.key_questions.map((q, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-300">
                <span className="text-cyan-600 mt-0.5">→</span>{q}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── LEVEL 3: Build it (collapsed by default) ─────────── */}
      {bp.build_order?.length > 0 && (
        <CollapsibleSection title="🗺️ Build Order" count={bp.build_order.length}>
          <div className="space-y-3 pt-2">
            {bp.build_order.map((phase, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{phase.phase}</p>
                  <p className="text-xs text-slate-500 mb-1.5">{phase.goal}</p>
                  <ul className="space-y-1">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="flex gap-2 text-xs text-slate-400">
                        <span className="text-cyan-600 mt-0.5">→</span>{task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {bp.key_risks?.length > 0 && (
        <CollapsibleSection title="⚠️ Key Risks & Mitigations" count={bp.key_risks.length}>
          <div className="space-y-2 pt-2">
            {bp.key_risks.map((r, i) => (
              <div key={i} className="rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.12)' }}>
                <p className="text-xs font-medium text-yellow-300">{r.risk}</p>
                <p className="text-xs text-slate-500 mt-1">↳ {r.mitigation}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {bp.security_checklist?.length > 0 && (
        <CollapsibleSection title="🛡️ Security Checklist" count={bp.security_checklist.length}>
          <ul className="space-y-1.5 pt-2">
            {bp.security_checklist.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-400">
                <span className="text-cyan-600 mt-0.5">☐</span>{s}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {bp.cost_breakdown?.length > 0 && (
        <CollapsibleSection title="💰 Cost Breakdown" count={bp.cost_breakdown.length}>
          <ul className="space-y-1.5 pt-2">
            {bp.cost_breakdown.map((c, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-400">
                <span className="text-cyan-600 mt-0.5">•</span>{c}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </div>
  )
}
