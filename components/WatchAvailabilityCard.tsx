'use client'

import Image from 'next/image'
import useSWR from 'swr'
import { Skeleton } from '@/components/Skeleton'
import type { JustWatchAvailability, JustWatchOffer } from '@/lib/justwatch'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('No se pudo obtener la disponibilidad')
  return response.json()
}

const GROUPS = [
  { key: 'stream', label: 'Streaming', types: ['FLATRATE', 'FREE', 'ADS'] },
  { key: 'rent', label: 'Alquilar', types: ['RENT'] },
  { key: 'buy', label: 'Comprar', types: ['BUY'] },
  { key: 'cinema', label: 'Cine', types: ['CINEMA'] },
] as const

export function WatchAvailabilityCard({ tmdbId }: { tmdbId: number }) {
  const { data, isLoading, error } = useSWR<{ availability: JustWatchAvailability | null }>(
    `/api/movies/${tmdbId}/watch`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  if (isLoading) return <WatchAvailabilitySkeleton />
  if (error || !data?.availability) return null

  const availability = data.availability
  const visibleGroups = GROUPS
    .map(group => ({
      ...group,
      offers: availability.offers.filter(offer =>
        group.types.some(type => type === offer.monetizationType)
      ),
    }))
    .filter(group => group.offers.length > 0)

  return (
    <section style={{
      margin: '0 22px 24px', padding: 16,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-card)', border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: visibleGroups.length ? 16 : 0 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Dónde verla
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
            Disponibilidad actual en Argentina
          </div>
        </div>
        <a
          href={availability.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver ${availability.title} en JustWatch`}
          style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          JustWatch ↗
        </a>
      </div>

      {visibleGroups.length === 0 ? (
        <div style={{ color: 'var(--ink-mute)', fontSize: 13, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          No hay opciones disponibles por ahora.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visibleGroups.map(group => (
            <OfferGroup key={group.key} label={group.label} offers={group.offers} />
          ))}
        </div>
      )}
    </section>
  )
}

function OfferGroup({ label, offers }: { label: string; offers: JustWatchOffer[] }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {offers.map(offer => <OfferLink key={`${offer.providerId}:${offer.monetizationType}`} offer={offer} />)}
      </div>
    </div>
  )
}

function OfferLink({ offer }: { offer: JustWatchOffer }) {
  const content = (
    <>
      <div style={{
        width: 38, height: 38, borderRadius: 9,
        overflow: 'hidden', background: '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {offer.providerIconUrl ? (
          <Image src={offer.providerIconUrl} alt="" width={38} height={38} style={{ objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#111', fontWeight: 800, fontSize: 14 }}>{offer.providerName.slice(0, 1)}</span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: 'var(--ink)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {offer.providerName}
        </div>
        <div style={{ color: 'var(--ink-mute)', fontSize: 10, marginTop: 3, whiteSpace: 'nowrap' }}>
          {[offer.price, formatQuality(offer.presentationType)].filter(Boolean).join(' · ') || 'Incluido'}
        </div>
      </div>
    </>
  )

  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 9,
    minWidth: 150, padding: '9px 11px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)', border: '1px solid var(--line)',
    textDecoration: 'none', flexShrink: 0,
  }

  return offer.url ? (
    <a href={offer.url} target="_blank" rel="noopener noreferrer" title={`Abrir ${offer.providerName}`} style={style}>
      {content}
    </a>
  ) : (
    <div style={style}>{content}</div>
  )
}

function formatQuality(value: string | null): string | null {
  if (value === '_4K') return '4K'
  return value
}

function WatchAvailabilitySkeleton() {
  return (
    <div style={{ margin: '0 22px 24px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
      <Skeleton width={92} height={12} borderRadius={4} />
      <div style={{ marginTop: 9 }}><Skeleton width={190} height={10} borderRadius={4} /></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Skeleton width={150} height={58} borderRadius={10} />
        <Skeleton width={150} height={58} borderRadius={10} />
      </div>
    </div>
  )
}
