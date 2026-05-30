import { useState, useEffect, ReactNode } from 'react'
import type { AnalysisResult, BlueprintLayer } from '../types'
import { exportBlueprintDocx } from '../utils/exportDocx'

/** A document section: heading + content, reads top to bottom, collapsible. */
function Section({ n, title, children, open = false }: { n: string; title: string; children: ReactNode; open?: boolean }) {
  const [isOpen, setIsOpen] = useState(open)

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  return (
    <section className="py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group py-1.5 select-none focus:outline-none"
      >
        <h3 className="flex items-center gap-2.5 text-sm font-bold text-white transition-colors group-hover:text-cyan-300">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold text-cyan-300 transition-all duration-300 group-hover:bg-cyan-500/25"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
            {n}
          </span>
          {title}
        </h3>
        <span className={`text-slate-500 transition-all duration-300 group-hover:text-cyan-400 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg className="w-4 h-4 transform transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        {children}
      </div>
    </section>
  )
}

function StackRow({ layer }: { layer: BlueprintLayer }) {
  const fromBrief = layer.basis?.toLowerCase().includes('brief')
  return (
    <div className="rounded-xl p-5 mb-4 transition-all duration-300 hover:bg-slate-900/30 border border-slate-800/40 hover:border-cyan-500/20 shadow-lg shadow-black/20"
      style={{ background: 'rgba(10,18,35,0.45)', backdropFilter: 'blur(8px)' }}>

      {/* Header Area */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{layer.layer}</p>
          <h4 className="text-base font-bold text-white leading-snug tracking-tight">{layer.choice}</h4>
        </div>
        
        {/* Recommended Badge */}
        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase shrink-0 border"
          style={fromBrief
            ? { background: 'rgba(6,182,212,0.06)', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.15)' }
            : { background: 'rgba(16,185,129,0.06)', color: '#34d399', borderColor: 'rgba(16,185,129,0.15)' }}>
          {fromBrief ? 'From brief' : 'Recommended'}
        </span>
      </div>

      {/* Why description */}
      <p className="text-xs text-slate-350 leading-relaxed mb-4">{layer.why}</p>

      {/* Meta Specs (Cost / Basis) */}
      {(layer.cost || layer.basis) && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-950/45 border border-slate-900/60 mb-4">
          {layer.cost && (
            <div className="flex items-start gap-3 text-[11px]">
              <span className="text-slate-500 shrink-0 font-medium select-none w-10">Cost:</span>
              <span className="text-cyan-400 font-medium leading-normal">{layer.cost}</span>
            </div>
          )}
          {layer.basis && (
            <div className="flex items-start gap-3 text-[11px]">
              <span className="text-slate-500 shrink-0 font-medium select-none w-10">Basis:</span>
              <span className="text-slate-300 leading-normal">{layer.basis}</span>
            </div>
          )}
        </div>
      )}

      {/* Alternatives */}
      {layer.alternatives?.length > 0 && (
        <div className="space-y-2.5 border-t border-slate-800/35 pt-4">
          <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Alternative Options</h5>
          <div className="grid grid-cols-1 gap-2">
            {layer.alternatives.map((alt, i) => (
              <div key={i} className="rounded-lg p-3 bg-slate-950/20 border border-slate-900/60 hover:bg-slate-950/40 transition-colors">
                <div className="flex items-baseline justify-between gap-3 mb-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-200">{alt.name}</span>
                  {alt.cost && (
                    <span className="text-[10px] font-medium text-cyan-400/90 bg-cyan-950/10 px-1.5 py-0.5 rounded border border-cyan-800/15">{alt.cost}</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{alt.tradeoff}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisReport({ result }: { result: AnalysisResult }) {
  const [allOpen, setAllOpen] = useState(false)

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
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Document header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(14,165,233,0.08))', borderBottom: '1px solid rgba(6,182,212,0.2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">🛠️ Build Guide</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-cyan-300 font-medium"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
            {bp.project_type}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAllOpen(prev => !prev)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-350 hover:text-white transition-all bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08]"
          >
            <span>{allOpen ? 'Collapse All' : 'Expand All'}</span>
          </button>
          <button
            onClick={() => exportBlueprintDocx(bp)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .docx
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">

        {/* 1. Problem */}
        <Section open={allOpen} n="1" title="Problem Statement">
          <p className="text-sm text-slate-300 leading-relaxed">{bp.problem_statement}</p>
        </Section>

        {/* 2. Overview */}
        <Section open={allOpen} n="2" title="Overview">
          <p className="text-sm text-slate-300 leading-relaxed">{bp.overview}</p>
        </Section>

        {/* 3. Budget tiers — pick by wallet */}
        {bp.budget_tiers?.length > 0 && (
          <Section open={allOpen} n="3" title="Pick Your Budget">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bp.budget_tiers.map((t, i) => {
                const tierIndex = i % 3;
                let bgStyle = {};
                let borderClass = "";
                let badgeClass = "";
                let labelText = "";
                let labelStyle = {};

                if (tierIndex === 0) {
                  // Low / Starter tier
                  bgStyle = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)' };
                  borderClass = "border-slate-800/50 hover:border-slate-700/50";
                  badgeClass = "text-slate-300 bg-slate-900/60 border border-slate-700/40";
                  labelText = "Starter";
                  labelStyle = { color: '#94a3b8', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.15)' };
                } else if (tierIndex === 1) {
                  // Mid / Growth tier (Primary Highlighted Tier!)
                  bgStyle = { background: 'rgba(10,30,45,0.45)', backdropFilter: 'blur(8px)' };
                  borderClass = "border-cyan-500/30 hover:border-cyan-400/40 glow-cyan";
                  badgeClass = "text-cyan-300 bg-cyan-950/50 border border-cyan-800/50";
                  labelText = "Most Popular";
                  labelStyle = { color: '#22d3ee', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' };
                } else {
                  // High / scale tier
                  bgStyle = { background: 'rgba(25,15,45,0.45)', backdropFilter: 'blur(8px)' };
                  borderClass = "border-violet-800/40 hover:border-violet-500/30";
                  badgeClass = "text-violet-300 bg-violet-950/50 border border-violet-800/50";
                  labelText = "Enterprise";
                  labelStyle = { color: '#c084fc', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' };
                }

                return (
                  <div key={i} className={`rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] border ${borderClass}`}
                    style={bgStyle}>
                    <div>
                      {/* Tier Label */}
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={labelStyle}>
                          {labelText}
                        </span>
                      </div>
                      
                      {/* Name & Cost */}
                      <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white tracking-tight">{t.name}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md leading-none ${badgeClass}`}>{t.monthly_cost}</span>
                      </div>
                      
                      {/* Summary */}
                      <p className="text-xs text-slate-350 leading-relaxed mb-4">{t.summary}</p>
                    </div>

                    {/* Best for */}
                    <div className="text-[10px] text-slate-500 border-t border-white/[0.04] pt-3 mt-auto">
                      <span className="font-semibold text-slate-400">Best for:</span> {t.best_for}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 4. Stack */}
        <Section open={allOpen} n="4" title="Recommended Technology">
          <div>{bp.stack.map((l, i) => <StackRow key={i} layer={l} />)}</div>
        </Section>

        {/* 5. Implementation techniques — the expert middle layer */}
        {bp.implementation_techniques?.length > 0 && (
          <Section open={allOpen} n="5" title="Implementation Techniques & Patterns">
            <div className="space-y-3">
              {bp.implementation_techniques.map((t, i) => (
                <div key={i} className="rounded-xl p-4 transition-all hover:bg-white/[0.03]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded">{t.area}</span>
                    <span className="text-sm font-bold text-white">{t.recommendation}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{t.details}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 6. Tools & Services */}
        {bp.tools_and_services?.length > 0 && (
          <Section open={allOpen} n="6" title="Tools & Services to Set Up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bp.tools_and_services.map((t, i) => (
                <div key={i} className="flex flex-col justify-between p-3.5 rounded-xl transition-all hover:bg-white/[0.03]"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    {t.cost && (
                      <span className="text-[10px] font-medium text-cyan-300 bg-cyan-950/30 border border-cyan-800/30 px-1.5 py-0.5 rounded">{t.cost}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{t.purpose}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 7. How to build */}
        <Section open={allOpen} n="7" title="How to Build It">
          <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-cyan-500/40 before:to-transparent">
            {bp.build_order.map((phase, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10 glow-cyan"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>{i + 1}</div>
                <div className="min-w-0 flex-1 bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 transition-all hover:bg-white/[0.03]">
                  <p className="text-sm font-bold text-white mb-0.5">{phase.phase}</p>
                  <p className="text-xs text-cyan-400/80 mb-3">{phase.goal}</p>
                  <ul className="space-y-2">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-cyan-500 mt-0.5 shrink-0">→</span>
                        <span className="leading-relaxed">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 8. Deployment */}
        {bp.deployment && (
          <Section open={allOpen} n="8" title="Deployment">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm text-slate-300 leading-relaxed">{bp.deployment}</p>
            </div>
          </Section>
        )}

        {/* 9. Cost */}
        <Section open={allOpen} n="9" title="Estimated Cost">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <span className="text-xs text-slate-400">Monthly Est.</span>
            <span className="text-sm font-bold text-cyan-300">{bp.estimated_monthly_cost}</span>
          </div>
          {bp.cost_breakdown?.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ul className="space-y-2">
                {bp.cost_breakdown.map((c, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                    <span className="text-cyan-500">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* 10. Decisions */}
        {bp.decisions_to_make?.length > 0 && (
          <Section open={allOpen} n="10" title="Decisions That Would Change This Plan">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ul className="space-y-2.5">
                {bp.decisions_to_make.map((d, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-slate-300">
                    <span className="text-cyan-500 mt-0.5">⚡</span>
                    <span className="leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {/* 11. Assumptions */}
        {bp.assumptions?.length > 0 && (
          <Section open={allOpen} n="11" title="Assumptions We Made">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ul className="space-y-2">
                {bp.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                    <span className="text-slate-500">•</span>
                    <span className="leading-relaxed">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        {/* 12. Risks */}
        {bp.key_risks?.length > 0 && (
          <Section open={allOpen} n="12" title="Things to Watch Out For">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bp.key_risks.map((r, i) => (
                <div key={i} className="rounded-xl p-4 flex flex-col justify-between"
                  style={{ background: 'rgba(234,179,8,0.02)', border: '1px solid rgba(234,179,8,0.1)' }}>
                  <div>
                    <span className="text-[9px] font-bold text-yellow-400 bg-yellow-950/20 border border-yellow-800/20 px-1.5 py-0.5 rounded tracking-wide uppercase">Risk</span>
                    <p className="text-xs font-semibold text-yellow-200 mt-2 mb-3 leading-relaxed">{r.risk}</p>
                  </div>
                  <div className="border-t border-yellow-800/10 pt-2.5 mt-auto">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <span className="text-yellow-400 font-semibold">Mitigation:</span> {r.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 13. Security */}
        {bp.security_checklist?.length > 0 && (
          <Section open={allOpen} n="13" title="Security Checklist">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ul className="space-y-2.5">
                {bp.security_checklist.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-slate-300">
                    <span className="text-cyan-500 mt-0.5">🔒</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
