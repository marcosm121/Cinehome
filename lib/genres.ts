export interface NormalizedMovie {
  tmdbId: number
  title: string
  overview: string | null
  year: number | null
  runtime: number | null
  genres: string[]
  posterUrl: string | null
  backdropUrl: string | null
  voteAverage: number | null
  language: string | null
  country: string | null
  director: string | null
  cast: string[]
  tagline: string | null
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
  10770: 'Película de TV', 53: 'Thriller', 10752: 'Bélica', 37: 'Western',
}
