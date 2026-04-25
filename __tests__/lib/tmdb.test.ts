import { normalizeTmdbMovie, posterUrl } from '@/lib/tmdb'

describe('tmdb utils', () => {
  it('normalizeTmdbMovie maps TMDB fields to app shape', () => {
    const raw = {
      id: 123,
      title: 'Test Movie',
      overview: 'A description.',
      release_date: '2024-06-15',
      runtime: 120,
      genres: [{ id: 1, name: 'Drama' }, { id: 2, name: 'Thriller' }],
      poster_path: '/abc123.jpg',
      backdrop_path: '/def456.jpg',
      vote_average: 7.45,
      original_language: 'en',
      production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      tagline: 'A tagline.',
      credits: {
        crew: [{ job: 'Director', name: 'Jane Doe' }, { job: 'Producer', name: 'John Smith' }],
        cast: [{ name: 'Actor One' }, { name: 'Actor Two' }, { name: 'Actor Three' }],
      },
    }
    const result = normalizeTmdbMovie(raw)
    expect(result.tmdbId).toBe(123)
    expect(result.title).toBe('Test Movie')
    expect(result.year).toBe(2024)
    expect(result.genres).toEqual(['Drama', 'Thriller'])
    expect(result.runtime).toBe(120)
    expect(result.voteAverage).toBe(7.5)
    expect(result.director).toBe('Jane Doe')
    expect(result.cast).toEqual(['Actor One', 'Actor Two', 'Actor Three'])
    expect(result.posterUrl).toContain('abc123.jpg')
    expect(result.backdropUrl).toContain('def456.jpg')
    expect(result.tagline).toBe('A tagline.')
    expect(result.country).toBe('United States')
  })

  it('posterUrl returns null for null path', () => {
    expect(posterUrl(null)).toBeNull()
  })

  it('posterUrl returns full URL for valid path', () => {
    const url = posterUrl('/abc.jpg')
    expect(url).toBe('https://image.tmdb.org/t/p/w500/abc.jpg')
  })
})
