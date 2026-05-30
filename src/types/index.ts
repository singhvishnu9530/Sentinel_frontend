export interface User {
  id: number
  name: string
  email: string
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

export interface BlueprintLayer {
  layer: string
  choice: string
  why: string
  alternatives: string[]
  cost: string
  basis: string
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

export interface BuildBlueprint {
  project_type: string
  summary: string
  stack: BlueprintLayer[]
  assumptions: string[]
  key_questions: string[]
  build_order: BuildPhase[]
  security_checklist: string[]
  key_risks: KeyRisk[]
  estimated_monthly_cost: string
  cost_breakdown: string[]
}

export interface AnalysisResult {
  build_blueprint_report?: BuildBlueprint
  errors?: string[]
}
