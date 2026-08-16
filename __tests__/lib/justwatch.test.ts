import { findJustWatchMatch, justWatchSearchTerms, type RawJustWatchNode } from '@/lib/justwatch'

describe('justwatch utils', () => {
  it('matches the exact TMDB id instead of trusting search order', () => {
    const nodes: RawJustWatchNode[] = [
      {
        content: {
          title: 'Dune (dunas)',
          fullPath: '/ar/pelicula/dune',
          externalIds: { tmdbId: '841' },
        },
      },
      {
        content: {
          title: 'Duna (parte uno)',
          fullPath: '/ar/pelicula/dune-2021',
          externalIds: { tmdbId: '438631' },
        },
      },
    ]

    expect(findJustWatchMatch(nodes, 438631)?.url)
      .toBe('https://www.justwatch.com/ar/pelicula/dune-2021')
  })

  it('deduplicates offer qualities and keeps the best one', () => {
    const node: RawJustWatchNode = {
      content: {
        title: 'Test',
        fullPath: '/ar/pelicula/test',
        externalIds: { tmdbId: '123' },
      },
      offers: [
        {
          monetizationType: 'FLATRATE', presentationType: 'SD',
          package: { packageId: 8, clearName: 'Test Video', icon: '/icon/test.png' },
        },
        {
          monetizationType: 'FLATRATE', presentationType: 'HD',
          package: { packageId: 8, clearName: 'Test Video', icon: '/icon/test.png' },
        },
      ],
    }

    const result = findJustWatchMatch([node], 123)
    expect(result?.offers).toHaveLength(1)
    expect(result?.offers[0].presentationType).toBe('HD')
    expect(result?.offers[0].providerIconUrl).toBe('https://images.justwatch.com/icon/test.png')
  })

  it('rejects paths outside the Argentina movie namespace', () => {
    const node: RawJustWatchNode = {
      content: {
        title: 'Test',
        fullPath: '/us/movie/test',
        externalIds: { tmdbId: '123' },
      },
    }
    expect(findJustWatchMatch([node], 123)).toBeNull()
  })

  it('tries localized and original titles without duplicates', () => {
    expect(justWatchSearchTerms({
      tmdbId: 545611,
      title: 'Todo en todas partes al mismo tiempo',
      originalTitle: 'Everything Everywhere All at Once',
    })).toEqual([
      'Todo en todas partes al mismo tiempo',
      'Everything Everywhere All at Once',
    ])

    expect(justWatchSearchTerms({ tmdbId: 1, title: 'Backrooms', originalTitle: 'Backrooms' }))
      .toEqual(['Backrooms'])
  })
})
