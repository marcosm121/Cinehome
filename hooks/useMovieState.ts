import useSWR, { KeyedMutator } from 'swr'

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
  update: { watched?: boolean; rating?: number | null; notes?: string | null },
  mutate?: KeyedMutator<any>
): Promise<void> {
  if (mutate) {
    // Optimistic update: apply immediately, revert on error
    await mutate(
      async (current: any) => {
        await fetch(`/api/user/movies/${tmdbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        })
        // Re-fetch to get server-confirmed state
        const res = await fetch(`/api/user/movies/${tmdbId}`)
        const { entry } = await res.json()
        return { entry }
      },
      {
        optimisticData: (current: any) => ({
          entry: { ...(current?.entry ?? { tmdbId, watched: false, rating: null, notes: null }), ...update },
        }),
        rollbackOnError: true,
        revalidate: false,
      }
    )
  } else {
    await fetch(`/api/user/movies/${tmdbId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
  }
}
