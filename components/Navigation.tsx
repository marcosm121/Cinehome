'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  return (
    <>
      {/* Mobile bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="md:hidden">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0',
              color: active ? 'var(--accent)' : 'var(--ink-faint)',
              textDecoration: 'none', gap: 3,
            }}>
              {item.icon(active)}
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop left sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 220, background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--line)',
        padding: '28px 12px',
        display: 'flex', flexDirection: 'column', gap: 2,
        zIndex: 40,
      }} className="hidden md:flex">
        <div style={{
          fontSize: 20, fontWeight: 800, letterSpacing: '-0.8px',
          color: 'var(--ink)', marginBottom: 24, padding: '0 8px',
        }}>
          Cinehome
        </div>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              color: active ? 'var(--ink)' : 'var(--ink-mute)',
              background: active ? 'var(--bg-hover)' : 'transparent',
              textDecoration: 'none', fontSize: 14,
              fontWeight: active ? 600 : 400,
              transition: 'background 120ms, color 120ms',
            }}>
              {item.icon(active)}
              {item.label}
            </Link>
          )
        })}
      </aside>
    </>
  )
}
