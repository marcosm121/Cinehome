import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useMovieStates(tmdbIds: number[]) {
  const key = tmdbIds.length
    ? `/api/user/movies?tmdbIds=${tmdbIds.join(',')}`
    : null
  const { data, mutate } = useSWR(key, fetcher, { revalidateOnFocus: true })
  const entries: Record<number, { watched: boolean; rating: number | null; notes: string | null }> = {}
  for (const e of (data?.entries ?? [])) {
    entries[e.tmdbId] = e
  }
  return { entries, mutate }
}

export async function updateMovieState(
  tmdbId: number,
  update: { watched?: boolean; rating?: number | null; notes?: string | null }
): Promise<void> {
  await fetch(`/api/user/movies/${tmdbId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  })
}
