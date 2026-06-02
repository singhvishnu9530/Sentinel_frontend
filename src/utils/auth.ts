import type { User } from '../types'

const USER_KEY = 'sentinel_user'
const TOKEN_KEY = 'sentinel_token'

export function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** Authorization header for authenticated requests (empty if not logged in). */
export function authHeader(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function clearSession() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as User) : null
}

/** Safely parse a response — handles backend 500s that return HTML/plain text. */
async function parseJsonOrThrow(res: Response, fallbackMsg: string) {
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // Non-JSON body (e.g. "Internal Server Error" or a proxy error page)
    throw new Error(
      res.ok ? 'Unexpected server response' : 'Server error — is the backend running?',
    )
  }
  if (!res.ok) throw new Error(data?.detail || fallbackMsg)
  return data
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await parseJsonOrThrow(res, 'Signup failed')
  return data.user as User
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseJsonOrThrow(res, 'Invalid email or password')
  if (data.token) saveToken(data.token)
  return data.user as User
}

export async function upgradeToPro(): Promise<User> {
  const res = await fetch('/auth/upgrade', { method: 'POST', headers: authHeader() })
  const data = await parseJsonOrThrow(res, 'Upgrade failed')
  return data.user as User
}

export async function fetchUsage(): Promise<User> {
  const res = await fetch('/auth/usage', { headers: authHeader() })
  const data = await parseJsonOrThrow(res, 'Could not fetch usage')
  return data.user as User
}
