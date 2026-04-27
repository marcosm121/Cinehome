'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/watchlist',
    label: 'Listas',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Vistas',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
    document.body.classList.remove('navigating')
  }, [pathname])

  function navigate(href: string) {
    if (pathname !== href) {
      window.history.pushState(null, '', href)
      document.body.classList.add('navigating')
    }
    setPendingHref(href)
    router.push(href)
  }

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    const w = collapsed ? '64px' : '220px'
    document.documentElement.style.setProperty('--sidebar-w', w)
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  return (
    <>
      {/* ── Mobile bottom nav (hidden on md+) ── */}
      <nav
        className="flex md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-elevated)',
          borderTop: '1px solid var(--line)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pendingHref === item.href
          return (
            <button key={item.href} onClick={() => navigate(item.href)} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0',
              color: active ? 'var(--accent)' : 'var(--ink-faint)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              gap: 3,
            }}>
              {item.icon(active)}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          )
        })}
        {user?.isAdmin && (
          <button onClick={() => navigate('/admin')} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '10px 0',
            color: pathname === '/admin' || pendingHref === '/admin' ? 'var(--accent)' : 'var(--ink-faint)',
            background: 'transparent', border: 'none', cursor: 'pointer', gap: 3,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={pathname === '/admin' || pendingHref === '/admin' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: pathname === '/admin' || pendingHref === '/admin' ? 600 : 400 }}>Admin</span>
          </button>
        )}
      </nav>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className="hidden md:flex"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: collapsed ? 64 : 220,
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--line)',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'width 200ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '20px 0' : '20px 16px 20px 20px',
          borderBottom: '1px solid var(--line)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Cinehome
            </span>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--ink-mute)', padding: 6, borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {collapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pendingHref === item.href
            return (
              <button key={item.href} onClick={() => navigate(item.href)} title={collapsed ? item.label : undefined} style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--ink)' : 'var(--ink-mute)',
                background: active ? 'var(--bg-hover)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: 14,
                fontWeight: active ? 600 : 400,
                transition: 'background 120ms, color 120ms',
                whiteSpace: 'nowrap', width: '100%',
              }}>
                {item.icon(active)}
                {!collapsed && item.label}
              </button>
            )
          })}
          {user?.isAdmin && (
            <button onClick={() => navigate('/admin')} style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 12px',
              borderRadius: 'var(--radius-md)',
              color: (pathname === '/admin' || pendingHref === '/admin') ? 'var(--ink)' : 'var(--ink-mute)',
              background: (pathname === '/admin' || pendingHref === '/admin') ? 'var(--bg-hover)' : 'transparent',
              border: 'none', cursor: 'pointer', fontSize: 14,
              fontWeight: (pathname === '/admin' || pendingHref === '/admin') ? 600 : 400,
              transition: 'background 120ms, color 120ms',
              whiteSpace: 'nowrap', width: '100%',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={(pathname === '/admin' || pendingHref === '/admin') ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {!collapsed && 'Admin'}
            </button>
          )}
        </nav>
      </aside>
    </>
  )
}
