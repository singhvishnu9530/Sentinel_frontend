export interface User {
  id: string
  name: string
  email: string
  plan?: 'free' | 'pro'
  tokens_used?: number
  token_limit?: number | null
  locked?: boolean
  locked_until?: string | null
}


export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: string
}

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  type: 'chat' | 'analysis'
  timestamp: Date
}

export interface Alternative {
  name: string
  cost: string
  tradeoff: string
}

export interface BlueprintLayer {
  layer: string
  choice: string
  why: string
  alternatives: Alternative[]
  cost: string
  basis: string
}

export interface BudgetTier {
  name: string
  monthly_cost: string
  summary: string
  best_for: string
}

export interface BuildPhase {
  phase: string
  goal: string
  tasks: string[]
}

export interface KeyRisk {
  risk: string
  mitigation: string
}

export interface TechniqueNote {
  area: string
  recommendation: string
  details: string
}

export interface ToolService {
  name: string
  purpose: string
  cost: string
}

export interface BuildBlueprint {
  project_type: string
  problem_statement: string
  overview: string
  budget_tiers: BudgetTier[]
  stack: BlueprintLayer[]
  implementation_techniques: TechniqueNote[]
  tools_and_services: ToolService[]
  build_order: BuildPhase[]
  deployment: string
  estimated_monthly_cost: string
  cost_breakdown: string[]
  decisions_to_make: string[]
  assumptions: string[]
  key_risks: KeyRisk[]
  security_checklist: string[]
}

export interface AnalysisResult {
  build_blueprint_report?: BuildBlueprint
  errors?: string[]
}
