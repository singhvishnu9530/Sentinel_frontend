import {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Table, Header, Footer, PageNumber
} from 'docx'
import { saveAs } from 'file-saver'
import type { BuildBlueprint } from '../types'

const ACCENT = '0891B2'      // Cyan-600 (primary headers/actions)
const MUTED = '64748B'       // Slate-500 (muted metadata labels)
const DARK = '0F172A'        // Slate-900 (bold titles)
const GREEN = '10B981'       // Emerald-500 (recommended badge / mitigations)
const AMBER = 'B45309'       // Amber-700 (risks)

function heading(text: string) {
  return new Paragraph({
    spacing: { before: 380, after: 120 },
    keepNext: true,
    children: [
      new TextRun({ text, bold: true, color: ACCENT, size: 28 }) // 14pt Heading
    ],
  })
}

function para(text: string, opts: { italic?: boolean; bold?: boolean; color?: string; size?: number } = {}) {
  return new Paragraph({
    spacing: { after: 140 },
    children: [
      new TextRun({
        text,
        italics: opts.italic,
        bold: opts.bold,
        color: opts.color ?? '334155', // Slate-700
        size: opts.size ?? 22          // 11pt default body
      })
    ],
  })
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [
      new TextRun({ text, size: 22, color: '334155' }) // 11pt default body
    ],
  })
}

// Add a decorative horizontal divider line
function sectionDivider() {
  return new Paragraph({
    spacing: { before: 180, after: 180 },
    border: {
      bottom: { color: 'E2E8F0', size: 6, space: 1, style: BorderStyle.SINGLE }
    },
  })
}

export async function exportBlueprintDocx(bp: BuildBlueprint) {
  const children: (Paragraph | Table)[] = []

  // Document Title Page / Header Block
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 60 },
    children: [
      new TextRun({ text: 'SENTINEL AI  ·  PROJECT BRIEFING REPORT', bold: true, size: 18, color: ACCENT })
    ],
  }))
  
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 100 },
    children: [
      new TextRun({ text: bp.project_type, bold: true, size: 38, color: DARK })
    ],
  }))

  // Decorative Bottom Accent Border (Divider Line)
  children.push(new Paragraph({
    spacing: { after: 280 },
    border: {
      bottom: { color: ACCENT, size: 12, space: 1, style: BorderStyle.SINGLE }
    },
  }))

  // 1. Problem
  children.push(heading('1. Problem Statement'))
  children.push(para(bp.problem_statement))

  // 2. Overview
  children.push(heading('2. Overview'))
  if (bp.overview?.what_it_is) {
    children.push(para('What it is', { bold: true }))
    children.push(para(bp.overview.what_it_is))
  }
  if (bp.overview?.how_it_works) {
    children.push(para('How it works', { bold: true }))
    children.push(para(bp.overview.how_it_works))
  }
  if (bp.overview?.why_this_approach) {
    children.push(para('Why this approach', { bold: true }))
    children.push(para(bp.overview.why_this_approach))
  }

  // 3. Budget tiers
  if (bp.budget_tiers?.length) {
    children.push(heading('3. Pick Your Budget'))
    bp.budget_tiers.forEach((t, idx) => {
      children.push(new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: `${idx + 1}. ${t.name}  `, bold: true, size: 24, color: DARK }),        // 12pt title
          new TextRun({ text: `(${t.monthly_cost})`, bold: true, size: 24, color: ACCENT }), // 12pt cost
        ]
      }))
      children.push(para(t.summary, { size: 22 }))
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: 'Best for: ', bold: true, size: 20, color: MUTED }),
          new TextRun({ text: t.best_for, size: 20, color: '475569', italics: true })
        ]
      }))
    })
  }

  // 4. Recommended Technology Stack
  children.push(heading('4. Recommended Technology Stack'))
  
  bp.stack.forEach((l, index) => {
    const fromBrief = l.basis?.toLowerCase().includes('brief')
    const badgeText = fromBrief ? 'From brief' : 'Recommended'
    const badgeColor = fromBrief ? ACCENT : GREEN
    
    // Layer Title & Choice Header
    children.push(new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({ text: `${l.layer}:  `, bold: true, color: MUTED, size: 20 }),
        new TextRun({ text: l.choice, bold: true, size: 24, color: DARK }),
        new TextRun({ text: `  [${badgeText}]`, bold: true, color: badgeColor, size: 18 }),
      ],
    }))

    // Cost & Basis Metadata (if present)
    if (l.cost || l.basis) {
      const metaRuns: TextRun[] = []
      if (l.cost) {
        metaRuns.push(new TextRun({ text: 'Cost Estimate: ', bold: true, size: 18, color: MUTED }))
        metaRuns.push(new TextRun({ text: `${l.cost}     `, size: 18, color: ACCENT, bold: true }))
      }
      if (l.basis) {
        metaRuns.push(new TextRun({ text: 'Selection Basis: ', bold: true, size: 18, color: MUTED }))
        metaRuns.push(new TextRun({ text: l.basis, size: 18, color: '334155' }))
      }
      children.push(new Paragraph({
        spacing: { after: 80 },
        children: metaRuns,
      }))
    }

    // Why Explanation
    children.push(para(l.why, { size: 22 }))

    // Alternatives
    if (l.alternatives?.length) {
      children.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: 'Alternative Options You Can Choose:', bold: true, size: 18, color: MUTED, italics: true })
        ],
      }))
      l.alternatives.forEach(alt => {
        children.push(bullet(`${alt.name}${alt.cost ? ` (${alt.cost})` : ''} — ${alt.tradeoff}`))
      })
    }
    
    // Separator line
    if (index < bp.stack.length - 1) {
      children.push(sectionDivider())
    }
  })

  // 5. Implementation Techniques & Patterns
  if (bp.implementation_techniques?.length) {
    children.push(heading('5. Implementation Techniques & Patterns'))
    bp.implementation_techniques.forEach(t => {
      children.push(new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: `[${t.area}] `, bold: true, color: ACCENT, size: 22 }),
          new TextRun({ text: t.recommendation, bold: true, size: 22, color: DARK }),
        ]
      }))
      children.push(para(t.details, { size: 22 }))
    })
  }

  // 6. Tools & Services to Set Up
  if (bp.tools_and_services?.length) {
    children.push(heading('6. Tools & Services to Set Up'))
    bp.tools_and_services.forEach(t => {
      children.push(new Paragraph({
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: `•  ${t.name} `, bold: true, size: 22, color: DARK }),
          t.cost ? new TextRun({ text: `(${t.cost}) `, bold: true, color: ACCENT, size: 22 }) : new TextRun({ text: '' }),
          new TextRun({ text: `— ${t.purpose}`, size: 22, color: '334155' }),
        ]
      }))
    })
  }

  // 7. How to Build It
  children.push(heading('7. How to Build It'))
  bp.build_order.forEach((phase, i) => {
    children.push(new Paragraph({
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({ text: `Step ${i + 1}: ${phase.phase}`, bold: true, size: 24, color: DARK })
      ],
    }))
    children.push(para(phase.goal, { italic: true, color: MUTED, size: 20 }))
    phase.tasks.forEach(t => children.push(bullet(t)))
  })

  // 8. Deployment
  if (bp.deployment?.length) {
    children.push(heading('8. Deployment'))
    bp.deployment.forEach(group => {
      children.push(para(group.area, { bold: true }))
      group.points.forEach(pt => children.push(bullet(pt)))
    })
  }

  // 9. Cost
  children.push(heading('9. Estimated Cost'))
  children.push(new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: 'Monthly Total: ', bold: true, size: 22, color: '0F172A' }),
      new TextRun({ text: bp.estimated_monthly_cost, bold: true, size: 22, color: ACCENT }),
    ],
  }))
  bp.cost_breakdown?.forEach(c => children.push(bullet(c)))

  // 10. Decisions That Would Change This Plan
  if (bp.decisions_to_make?.length) {
    children.push(heading('10. Decisions That Would Change This Plan'))
    bp.decisions_to_make.forEach(d => children.push(bullet(d)))
  }

  // 11. Assumptions We Made
  if (bp.assumptions?.length) {
    children.push(heading('11. Assumptions We Made'))
    bp.assumptions.forEach(a => children.push(bullet(a)))
  }

  // 12. Things to Watch Out For
  if (bp.key_risks?.length) {
    children.push(heading('12. Things to Watch Out For'))
    bp.key_risks.forEach(r => {
      children.push(new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: '⚠️  Risk: ', bold: true, color: AMBER, size: 22 }), 
          new TextRun({ text: r.risk, bold: true, size: 22, color: DARK }),
        ]
      }))
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: '     Mitigation Strategy: ', bold: true, color: GREEN, size: 22 }),
          new TextRun({ text: r.mitigation, size: 22, color: '334155' }),
        ]
      }))
    })
  }

  // 13. Security Checklist
  if (bp.security_checklist?.length) {
    children.push(heading('13. Security Checklist'))
    bp.security_checklist.forEach(s => children.push(bullet(s)))
  }

  // Build Document with Segoe UI base font style system & custom 0.75-inch page margins
  const doc = new Document({
    styles: {
      documentDefaults: {
        run: {
          font: 'Segoe UI',
          size: 22,        // 11pt default body size
          color: '334155', // Slate-700
        },
        paragraph: {
          spacing: {
            after: 140,    // 7pt spacing after paragraphs
            line: 276,     // 1.15x line spacing
          },
        },
      },
    } as any,
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1080,    // 0.75 inch margins
            bottom: 1080,
            left: 1080,
            right: 1080,
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 120 },
              children: [
                new TextRun({ text: 'SENTINEL AI  ·  PROJECT BLUEPRINT', size: 16, color: MUTED, bold: true })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'Page ', size: 16, color: MUTED }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 16,
                  color: MUTED
                }),
                new TextRun({ text: ' of ', size: 16, color: MUTED }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 16,
                  color: MUTED
                }),
              ]
            })
          ]
        })
      },
      children
    }]
  })

  const blob = await Packer.toBlob(doc)
  const safeName = bp.project_type.replace(/[^a-z0-9]+/gi, '_')
  saveAs(blob, `Build_Guide_${safeName}.docx`)
}
