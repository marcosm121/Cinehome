# User Management System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded env-var users with a MongoDB-based user system featuring admin panel, first-login password setup, session invalidation, and per-user list sharing.

**Architecture:** Users live in MongoDB with string `_id` matching existing data (e.g. `"marcos"`) for backward compatibility. Auth reads from DB instead of env vars. JWT includes `sessionVersion` which is verified against DB in every API call — incrementing it on reset/delete immediately invalidates all active sessions. Lists move from `isShared: boolean` to `sharedWith: string[]` (array of user IDs).

**Tech Stack:** Next.js 16, Mongoose, jose (JWT), bcryptjs, SWR, existing MongoDB Atlas.

---

## Context & Backward Compatibility

Existing MongoDB data (`lists`, `listMovies`, `userMovies`) uses string userIds like `"marcos"` and `"flor"`. The new `User` model uses `_id: String` to match, so no data migration is needed. The seed script creates the marcos admin user once; all other users are created from the admin panel.

---

## Task 1: User MongoDB Model

**Files:**
- Create: `lib/models/User.ts`
- Modify: `lib/db.ts` (no change needed, just awareness)

**Step 1: Create `lib/models/User.ts`**

```ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  _id: string
  name: string
  username: string
  isAdmin: boolean
  passwordHash: string | null // null = first login pending
  sessionVersion: number
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  passwordHash: { type: String, default: null },
  sessionVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

UserSchema.index({ username: 1 }, { unique: true })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
```

**Step 2: Commit**
```bash
git add lib/models/User.ts
git commit -m "feat: User MongoDB model with sessionVersion and isAdmin"
```

---

## Task 2: Admin Seed Script

Creates the marcos admin user in DB. Run once manually.

**Files:**
- Create: `scripts/seed-admin.mjs`

**Step 1: Create `scripts/seed-admin.mjs`**

```js
import mongoose from 'mongoose'
import { config } from 'dotenv'
config({ path: '.env.local' })

const UserSchema = new mongoose.Schema({
  _id: { type: String },
  name: String,
  username: String,
  isAdmin: Boolean,
  passwordHash: { type: String, default: null },
  sessionVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

await mongoose.connect(process.env.MONGODB_URI)

const existing = await User.findById('marcos')
if (existing) {
  console.log('Admin user already exists:', existing.username)
} else {
  await User.create({
    _id: 'marcos',
    name: 'Marcos',
    username: 'marcos',
    isAdmin: true,
    passwordHash: null,
    sessionVersion: 0,
  })
  console.log('✓ Admin user marcos created. Password will be set on first login.')
}

await mongoose.disconnect()
```

**Step 2: Run the seed**
```bash
node scripts/seed-admin.mjs
```
Expected: `✓ Admin user marcos created.`

**Step 3: Commit**
```bash
git add scripts/seed-admin.mjs
git commit -m "feat: admin seed script for initial marcos user"
```

---

## Task 3: Update Auth Layer

Replace env-var user lookups with MongoDB. Update JWT to include `isAdmin` and `sessionVersion`. Update `getSession` to verify sessionVersion against DB.

**Files:**
- Modify: `lib/users.ts` → replace entirely
- Modify: `lib/auth.ts` → add isAdmin + sessionVersion to JwtPayload
- Modify: `lib/getSession.ts` → verify sessionVersion against DB

**Step 1: Replace `lib/users.ts`**

```ts
import { connectDB } from './db'
import User, { IUser } from './models/User'

export type AppUser = Pick<IUser, '_id' | 'name' | 'username' | 'isAdmin' | 'passwordHash' | 'sessionVersion'>

export async function getUserByUsername(username: string): Promise<AppUser | null> {
  await connectDB()
  return User.findOne({ username }).lean() as Promise<AppUser | null>
}

export async function getUserById(id: string): Promise<AppUser | null> {
  await connectDB()
  return User.findById(id).lean() as Promise<AppUser | null>
}

export async function getAllUsers(): Promise<AppUser[]> {
  await connectDB()
  return User.find({}, { passwordHash: 0 }).lean() as Promise<AppUser[]>
}
```

**Step 2: Update `lib/auth.ts` — add isAdmin and sessionVersion to JwtPayload**

```ts
export interface JwtPayload {
  userId: string
  username: string
  name: string
  isAdmin: boolean
  sessionVersion: number
}
```

Update `signToken` to accept and sign the full payload (no change needed, it spreads `{ ...payload }`).

**Step 3: Update `lib/getSession.ts` — verify sessionVersion**

```ts
import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME, JwtPayload } from './auth'
import { connectDB } from './db'
import User from './models/User'

export async function getSession(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null

  // Verify sessionVersion — invalidates sessions after password reset or deletion
  await connectDB()
  const user = await User.findById(payload.userId).lean() as any
  if (!user || user.sessionVersion !== payload.sessionVersion) return null

  return payload
}
```

**Step 4: Update `app/api/auth/login/route.ts`**

Replace the password comparison and token signing. Now reads from DB and handles null password (first login):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { signToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth'
import { getUserByUsername } from '@/lib/users'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { username, password } = body as Record<string, unknown>
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const user = await getUserByUsername(username)
  if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  // First login: no password set yet
  if (!user.passwordHash) {
    // Issue a short-lived set-password token
    const tempToken = await signToken({
      userId: user._id as string,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      sessionVersion: -1, // special value: not a real session
    })
    return NextResponse.json({ requiresPasswordSetup: true, tempToken })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  try {
    const token = await signToken({
      userId: user._id as string,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      sessionVersion: user.sessionVersion,
    })
    const res = NextResponse.json({
      user: { id: user._id, name: user.name, username: user.username, isAdmin: user.isAdmin },
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[login] signToken failed:', err)
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }
}
```

**Step 5: Update `app/api/auth/me/route.ts`** to return isAdmin:

```ts
return NextResponse.json({
  id: user._id,
  name: user.name,
  username: user.username,
  isAdmin: user.isAdmin,
})
```

Wait — `getUserById` now returns from DB so it's async. Update accordingly:
```ts
const user = await getUserById(session.userId)
```

**Step 6: Update proxy.ts** to whitelist `/set-password`:

```ts
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/set-password', '/api/auth/set-password']
```

**Step 7: Remove env-var user logic**

Delete `lib/users.ts`'s old env-var content (already replaced in Step 1). Remove `USER1_*` and `USER2_*` from `.env.example` (add `ADMIN_SEED_DONE=true` as a reminder instead).

**Step 8: Commit**
```bash
git add lib/users.ts lib/auth.ts lib/getSession.ts app/api/auth/login/route.ts app/api/auth/me/route.ts proxy.ts
git commit -m "feat: auth reads from MongoDB, sessionVersion validation, first-login detection"
```

---

## Task 4: Set Password Flow

**Files:**
- Create: `app/api/auth/set-password/route.ts`
- Create: `app/set-password/page.tsx`

**Step 1: Create `app/api/auth/set-password/route.ts`**

Accepts the tempToken from login response + new password. Hashes it, saves to DB, issues real session.

```ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken, signToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { tempToken, password } = body as Record<string, unknown>
  if (typeof tempToken !== 'string' || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verify the temp token (sessionVersion === -1 means it's a set-password token)
  const payload = await verifyToken(tempToken)
  if (!payload || payload.sessionVersion !== -1) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(payload.userId)
  if (!user || user.passwordHash !== null) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  user.passwordHash = passwordHash
  user.sessionVersion = 1
  await user.save()

  // Issue real session token
  const token = await signToken({
    userId: user._id as string,
    username: user.username,
    name: user.name,
    isAdmin: user.isAdmin,
    sessionVersion: user.sessionVersion,
  })

  const res = NextResponse.json({
    user: { id: user._id, name: user.name, username: user.username, isAdmin: user.isAdmin },
  })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  })
  return res
}
```

**Step 2: Create `app/set-password/page.tsx`**

Page shown after first login. Receives `tempToken` as query param.

```tsx
'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const tempToken = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, password }),
      })
      if (res.ok) {
        router.replace('/')
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Error al guardar contraseña')
    } catch {
      setError('No se pudo conectar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '0 16px' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: 32, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line-strong)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 6px', color: 'var(--ink)' }}>Creá tu contraseña</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 24px' }}>Es la primera vez que entrás. Elegí una contraseña para tu cuenta.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.4px' }}>Contraseña</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus
              style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="confirm" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.4px' }}>Repetir contraseña</label>
            <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none', width: '100%' }} />
          </div>
          {error && <p role="alert" style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding: 13, borderRadius: 8, marginTop: 4, background: loading ? 'var(--bg-hover)' : 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
            {loading ? 'Guardando…' : 'Crear contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  )
}
```

**Step 3: Update `app/login/page.tsx`** to handle `requiresPasswordSetup` response:

In `handleSubmit`, after `res.ok` check, add before the `if (res.ok)` block:

```ts
const data = await res.json().catch(() => ({}))
if (data.requiresPasswordSetup && data.tempToken) {
  router.replace(`/set-password?token=${data.tempToken}`)
  return
}
if (res.ok) {
  router.replace('/')
  return
}
setError(data.error || 'Error al iniciar sesión')
```

Note: refactor `handleSubmit` to parse the JSON once instead of twice.

**Step 4: Commit**
```bash
git add app/api/auth/set-password/route.ts app/set-password/page.tsx app/login/page.tsx proxy.ts
git commit -m "feat: set-password flow for first login"
```

---

## Task 5: Admin User API Routes

**Files:**
- Create: `app/api/admin/users/route.ts`
- Create: `app/api/admin/users/[id]/route.ts`
- Create: `app/api/admin/users/[id]/reset-password/route.ts`
- Create: `lib/adminGuard.ts`

**Step 1: Create `lib/adminGuard.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './getSession'

export async function adminGuard(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  if (!session.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  return { error: null, session }
}
```

**Step 2: Create `app/api/admin/users/route.ts`** (GET list, POST create)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/adminGuard'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { error } = await adminGuard(req)
  if (error) return error
  await connectDB()
  const users = await User.find({}, { passwordHash: 0 }).lean()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const { error } = await adminGuard(req)
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, username } = body as Record<string, unknown>
  if (typeof name !== 'string' || !name.trim() || typeof username !== 'string' || !username.trim()) {
    return NextResponse.json({ error: 'Nombre y usuario requeridos' }, { status: 400 })
  }

  await connectDB()
  const existing = await User.findOne({ username: username.trim().toLowerCase() })
  if (existing) return NextResponse.json({ error: 'El usuario ya existe' }, { status: 409 })

  try {
    const user = await User.create({
      _id: randomUUID(),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      isAdmin: false,
      passwordHash: null,
      sessionVersion: 0,
    })
    return NextResponse.json({ user: { _id: user._id, name: user.name, username: user.username } }, { status: 201 })
  } catch (err) {
    console.error('[admin/users POST]', err)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
```

**Step 3: Create `app/api/admin/users/[id]/route.ts`** (DELETE user + all data)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/adminGuard'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import List from '@/lib/models/List'
import ListMovie from '@/lib/models/ListMovie'
import UserMovie from '@/lib/models/UserMovie'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error, session } = await adminGuard(req)
  if (error) return error

  const { id } = await params
  if (id === session!.userId) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
  }

  await connectDB()
  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  try {
    // Delete all user data
    const userLists = await List.find({ ownerId: id }, { _id: 1 })
    const listIds = userLists.map(l => l._id)
    await ListMovie.deleteMany({ listId: { $in: listIds } })
    await List.deleteMany({ ownerId: id })
    await UserMovie.deleteMany({ userId: id })
    // Remove from sharedWith arrays
    await List.updateMany({ sharedWith: id }, { $pull: { sharedWith: id } })
    // Delete user — increment sessionVersion first to invalidate sessions
    await User.findByIdAndDelete(id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
```

**Step 4: Create `app/api/admin/users/[id]/reset-password/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/adminGuard'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await adminGuard(req)
  if (error) return error

  const { id } = await params
  await connectDB()

  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Clear password + increment sessionVersion to invalidate all active sessions
  user.passwordHash = null
  user.sessionVersion = (user.sessionVersion ?? 0) + 1
  await user.save()

  return NextResponse.json({ ok: true })
}
```

**Step 5: Commit**
```bash
git add lib/adminGuard.ts app/api/admin/
git commit -m "feat: admin user management API (list, create, delete, reset-password)"
```

---

## Task 6: Admin UI Page

**Files:**
- Create: `app/(app)/admin/page.tsx`
- Create: `app/(app)/admin/loading.tsx`
- Modify: `components/Navigation.tsx` — add admin link for admins
- Modify: `hooks/useUser.ts` — expose isAdmin

**Step 1: Update `hooks/useUser.ts`** to type isAdmin:

```ts
export function useUser() {
  const { data, error, isLoading } = useSWR('/api/auth/me', fetcher, { revalidateOnFocus: false })
  return {
    user: data as { id: string; name: string; username: string; isAdmin: boolean } | undefined,
    loading: isLoading,
    error,
  }
}
```

**Step 2: Create `app/(app)/admin/page.tsx`**

```tsx
'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/Skeleton'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR('/api/admin/users', fetcher)
  const users = data?.users ?? []

  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Redirect non-admins
  if (!loading && user && !user.isAdmin) {
    router.replace('/')
    return null
  }

  async function createUser() {
    if (!newName.trim() || !newUsername.trim()) return
    setError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), username: newUsername.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setNewName(''); setNewUsername(''); setCreating(false)
    mutate()
  }

  async function resetPassword(id: string) {
    await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
    mutate()
  }

  async function deleteUser(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    mutate()
  }

  if (isLoading) return (
    <div style={{ padding: '24px 22px' }}>
      <Skeleton width={120} height={36} borderRadius={8} style={{ marginBottom: 20 }} />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={60} borderRadius={10} style={{ marginBottom: 10 }} />)}
    </div>
  )

  return (
    <div style={{ padding: '24px 22px 110px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--ink)', margin: 0 }}>Usuarios</h1>
      </div>

      {/* User list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {users.map((u: any) => (
          <div key={u._id} style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {u.name}
                {u.isAdmin && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 'var(--radius-pill)', letterSpacing: '0.5px' }}>ADMIN</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                @{u.username} {u.passwordHash === null && <span style={{ color: 'var(--gold)' }}>· Sin contraseña</span>}
              </div>
            </div>
            {!u.isAdmin && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => resetPassword(u._id)}
                  style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer' }}
                >
                  Resetear contraseña
                </button>
                {confirmDelete === u._id ? (
                  <>
                    <button onClick={() => deleteUser(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--red)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: `1px solid var(--red)`, color: 'var(--red)', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create user */}
      {creating ? (
        <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--line-strong)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 14 }}>Nuevo usuario</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none' }} />
            <input placeholder="Usuario (para el login)" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createUser()}
              style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none' }} />
            {error && <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createUser} style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Crear</button>
              <button onClick={() => { setCreating(false); setNewName(''); setNewUsername(''); setError('') }} style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} style={{ width: '100%', padding: 13, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          + Agregar usuario
        </button>
      )}
    </div>
  )
}
```

**Step 3: Create `app/(app)/admin/loading.tsx`**

```tsx
import { Skeleton } from '@/components/Skeleton'

export default function AdminLoading() {
  return (
    <div style={{ padding: '24px 22px', maxWidth: 600, margin: '0 auto' }}>
      <Skeleton width={120} height={36} borderRadius={8} style={{ marginBottom: 20 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={64} borderRadius={12} style={{ marginBottom: 10 }} />
      ))}
    </div>
  )
}
```

**Step 4: Add admin link to `components/Navigation.tsx`**

Import `useUser` and conditionally render an admin nav item. Add to `NAV_ITEMS` dynamically based on `user.isAdmin`:

Inside `Navigation()`, after the existing hooks:
```ts
const { user } = useUser()
```

Then in both the mobile nav and desktop sidebar, after mapping `NAV_ITEMS`, add:
```tsx
{user?.isAdmin && (
  <button onClick={() => navigate('/admin')} style={{ /* same style as other items */ }}>
    <svg>/* shield icon */</svg>
    Admin
  </button>
)}
```

Use this SVG for the shield icon:
```tsx
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
</svg>
```

**Step 5: Commit**
```bash
git add app/(app)/admin/ hooks/useUser.ts components/Navigation.tsx
git commit -m "feat: admin panel UI — list, create, delete, reset-password"
```

---

## Task 7: Update List Model — sharedWith

Replace `isShared: boolean` with `sharedWith: string[]`.

**Files:**
- Modify: `lib/models/List.ts`
- Modify: `app/api/lists/route.ts`
- Modify: `app/api/lists/[id]/route.ts`
- Modify: `app/api/lists/[id]/movies/route.ts`

**Step 1: Update `lib/models/List.ts`**

Replace:
```ts
isShared: { type: Boolean, default: false },
```
With:
```ts
sharedWith: { type: [String], default: [] }, // array of user IDs
```

Update the interface:
```ts
sharedWith: string[]
```

Remove `isShared` and `coverTmdbId`/`coverPosterUrl` fields stay unchanged.

**Step 2: Update `app/api/lists/route.ts`** — GET returns accessible lists

```ts
// User sees lists they own OR are in sharedWith
const lists = await List.find({
  $or: [{ ownerId: session.userId }, { sharedWith: session.userId }],
}).sort({ createdAt: -1 })
```

POST create: use `sharedWith: []` instead of `isShared: false`.

**Step 3: Update `app/api/lists/[id]/route.ts`** — PUT handles sharedWith

```ts
const { name, sharedWith, coverTmdbId, coverPosterUrl } = body as Record<string, unknown>
if (Array.isArray(sharedWith)) list!.sharedWith = sharedWith as string[]
```

**Step 4: Update `app/api/lists/[id]/movies/route.ts`** — access check uses sharedWith

```ts
// Replace: list.ownerId !== session.userId && !list.isShared
// With:
if (list.ownerId !== session.userId && !list.sharedWith.includes(session.userId)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Step 5: Commit**
```bash
git add lib/models/List.ts app/api/lists/
git commit -m "feat: lists use sharedWith[] instead of isShared boolean"
```

---

## Task 8: Update List UI — User Selector for Sharing

Replace the isShared toggle in `app/(app)/watchlist/[id]/page.tsx` settings panel with a user selector (checkboxes).

**Files:**
- Modify: `app/(app)/watchlist/[id]/page.tsx`
- Modify: `app/(app)/watchlist/page.tsx`

**Step 1: In `app/(app)/watchlist/[id]/page.tsx`** settings panel, replace the `isShared` toggle with a multi-user selector:

Fetch all users from `/api/admin/users` — but that's admin-only. Instead, create a public endpoint for listing users for sharing purposes.

Create `app/api/users/route.ts` (already exists — returns public user info). Use it to get all users.

Replace the sharing section in settings:
```tsx
{/* Sharing — user selector */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Compartida con</div>
  {otherUsers.map((u: any) => {
    const isShared = list.sharedWith?.includes(u._id)
    return (
      <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{u.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>@{u.username}</div>
        </div>
        <Toggle
          checked={isShared}
          onChange={() => toggleUserShare(u._id, isShared)}
        />
      </div>
    )
  })}
  {otherUsers.length === 0 && (
    <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>No hay otros usuarios.</div>
  )}
</div>
```

Add `toggleUserShare` function:
```ts
async function toggleUserShare(userId: string, currently: boolean) {
  const newSharedWith = currently
    ? (list.sharedWith ?? []).filter((id: string) => id !== userId)
    : [...(list.sharedWith ?? []), userId]

  mutateLists(
    async (current: any) => {
      await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedWith: newSharedWith }),
      })
      return current
    },
    {
      optimisticData: (current: any) => ({
        ...current,
        lists: current?.lists?.map((l: any) =>
          l._id === id ? { ...l, sharedWith: newSharedWith } : l
        ),
      }),
      rollbackOnError: true,
      revalidate: true,
    }
  )
}
```

Update `isOwner` check to use `sharedWith` (already handled by the access logic).

**Step 2: Update `app/(app)/watchlist/page.tsx`** — ListCard uses sharedWith

Replace `list.isShared ? '🤝 Compartida' : 'Personal'` with:
```tsx
{(list.sharedWith?.length > 0) ? '🤝 Compartida' : 'Personal'}
```

**Step 3: Update `app/(app)/watchlist/[id]/page.tsx`** eyebrow text:
```tsx
{(list.sharedWith?.length > 0) ? '🤝 Lista compartida' : 'Mi lista'}
```

**Step 4: Update `toggleShared` optimistic update** — remove old `isShared` logic, it's now replaced by `toggleUserShare`.

**Step 5: Commit**
```bash
git add app/(app)/watchlist/ app/api/users/
git commit -m "feat: list sharing uses per-user selection instead of global toggle"
```

---

## Task 9: Cleanup & Env Var Removal

**Files:**
- Modify: `.env.example`
- Modify: `.env.local`
- Modify: `jest.env.ts` (update JWT_SECRET test setup)

**Step 1: Update `.env.example`**

Remove USER1_* and USER2_* variables. Add:
```env
# Run node scripts/seed-admin.mjs once after first deploy
MONGODB_URI=mongodb+srv://...
JWT_SECRET=
TMDB_READ_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Update `.env.local`** — remove USER1_*/USER2_*/USER*_PASSWORD entries (they're no longer used).

**Step 3: Verify build passes**
```bash
npm run build
```

**Step 4: Final commit**
```bash
git add .env.example
git commit -m "chore: remove env-var user system, cleanup after DB migration"
```

---

## Deployment Notes

After deploying to Render:
1. Make sure `MONGODB_URI` and `JWT_SECRET` are set in Render env vars
2. Run the seed script once: connect to the server or run locally against prod DB:
   ```bash
   MONGODB_URI=<prod_uri> node scripts/seed-admin.mjs
   ```
3. marcos logs in → gets redirected to /set-password → sets new password → enters app
4. From admin panel, create flor and any other users

## Summary: What Changes

| Area | Before | After |
|---|---|---|
| Users | Env vars | MongoDB |
| Password storage | Plain text | bcrypt hash |
| First login | N/A | Set-password flow |
| Session invalidation | Not possible | sessionVersion in JWT |
| List sharing | isShared boolean | sharedWith string[] |
| Admin | N/A | /admin panel (marcos only) |
