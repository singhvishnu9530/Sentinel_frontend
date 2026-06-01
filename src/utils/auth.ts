import type { User } from '../types'

const USER_KEY = 'sentinel_user'

export function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(USER_KEY)
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as User) : null
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Signup failed')
  return data.user as User
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Invalid email or password')
  return data.user as User
}

export async function upgradeToPro(userId: number): Promise<User> {
  const res = await fetch(`/auth/upgrade/${userId}`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Upgrade failed')
  return data.user as User
}

export async function fetchUsage(userId: number): Promise<User> {
  const res = await fetch(`/auth/usage/${userId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Could not fetch usage')
  return data.user as User
}
