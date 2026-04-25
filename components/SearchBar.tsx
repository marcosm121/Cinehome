'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { NormalizedMovie } from '@/lib/tmdb'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NormalizedMovie[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])

  function select(movie: NormalizedMovie) {
    setQuery('')
    setOpen(false)
    router.push(`/movie/${movie.tmdbId}`)
  }

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Buscar película..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={e => { results.length && setOpen(true); e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={e => { setTimeout(() => setOpen(false), 150); e.currentTarget.style.borderColor = 'var(--line-strong)' }}
          aria-label="Buscar película"
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink)', fontSize: 14, outline: 'none',
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-faint)' }}>
            …
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 100,
          maxHeight: 360, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        role="listbox"
        aria-label="Resultados de búsqueda">
          {results.slice(0, 8).map((m) => (
            <div
              key={m.tmdbId}
              role="option"
              aria-selected={false}
              onMouseDown={() => select(m)}
              style={{
                display: 'flex', gap: 12, padding: '10px 14px', cursor: 'pointer',
                alignItems: 'center',
                borderBottom: '1px solid var(--line)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {m.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.posterUrl.replace('w500', 'w92')}
                  alt=""
                  style={{ width: 32, height: 48, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 32, height: 48, borderRadius: 4, background: 'var(--bg-card)', flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                  {[m.year, m.genres?.[0]].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
