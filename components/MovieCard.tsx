import Image from 'next/image'
import { NavLink as Link } from './NavLink'
import { RatingBadge } from './RatingBadge'
import type { NormalizedMovie } from '@/lib/tmdb'

interface UserState {
  watched: boolean
  rating: number | null
  notes: string | null
}

interface MovieCardProps {
  movie: NormalizedMovie
  userState?: UserState | null
  variant?: 'shelf' | 'grid' | 'list'
}

export function MovieCard({ movie, userState, variant = 'shelf' }: MovieCardProps) {
  if (variant === 'list') {
    return (
      <Link href={`/movie/${movie.tmdbId}`} style={{
        display: 'flex', gap: 14, alignItems: 'center',
        textDecoration: 'none', color: 'inherit',
      }}>
        <PosterImage movie={movie} width={44} height={66} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {movie.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>
            {[movie.director, movie.year].filter(Boolean).join(' · ')}
          </div>
        </div>
        {userState?.rating != null && (
          <RatingBadge value={userState.rating} size={12} muted />
        )}
      </Link>
    )
  }

  return (
    <Link href={`/movie/${movie.tmdbId}`} style={{
      display: 'block', textDecoration: 'none',
      width: variant === 'shelf' ? 128 : '100%',
      flexShrink: variant === 'shelf' ? 0 : undefined,
    }}>
      <div style={{
        position: 'relative',
        width: variant === 'shelf' ? 128 : '100%',
        aspectRatio: '2/3',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}>
        <PosterImage movie={movie} fill />
        {userState?.rating != null && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-sm)', padding: '3px 6px',
          }}>
            <RatingBadge value={userState.rating} size={10} />
          </div>
        )}
        {userState?.watched && userState.rating == null && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 'var(--radius-sm)', padding: '2px 6px',
            fontSize: 9, fontWeight: 600, color: 'var(--green)', letterSpacing: '0.3px',
          }}>
            VISTA
          </div>
        )}
      </div>
      <div style={{
        marginTop: 8, fontWeight: 600, fontSize: 13,
        color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.2px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {movie.title}
      </div>
      <div style={{ marginTop: 2, fontSize: 11, color: 'var(--ink-mute)' }}>
        {movie.year}
      </div>
    </Link>
  )
}

interface PosterImageProps {
  movie: NormalizedMovie
  width?: number
  height?: number
  fill?: boolean
}

function PosterImage({ movie, width, height, fill }: PosterImageProps) {
  if (movie.posterUrl) {
    if (fill) {
      return (
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          style={{ objectFit: 'cover' }}
        />
      )
    }
    return (
      <Image
        src={movie.posterUrl}
        alt={movie.title}
        width={width!}
        height={height!}
        style={{ borderRadius: 'var(--radius-sm)', display: 'block' }}
      />
    )
  }

  const style: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0 }
    : { width, height }

  return (
    <div style={{
      ...style,
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 8, textAlign: 'center',
      fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.3,
    }}>
      {movie.title}
    </div>
  )
}
