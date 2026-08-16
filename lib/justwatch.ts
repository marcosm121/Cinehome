import { connectDB } from './db'
import TmdbCache from './models/TmdbCache'

const JUSTWATCH_GRAPHQL_URL = 'https://apis.justwatch.com/graphql'
const JUSTWATCH_BASE_URL = 'https://www.justwatch.com'
const JUSTWATCH_IMAGES_URL = 'https://images.justwatch.com'
const COUNTRY = 'AR'
const LANGUAGE = 'es'
const CACHE_TTL_MS = 1000 * 60 * 60 * 6
const FETCH_TIMEOUT_MS = 8000

export type JustWatchMonetizationType =
  | 'FLATRATE'
  | 'FREE'
  | 'ADS'
  | 'RENT'
  | 'BUY'
  | 'CINEMA'
  | string

export interface JustWatchOffer {
  providerId: number
  providerName: string
  providerIconUrl: string | null
  monetizationType: JustWatchMonetizationType
  presentationType: string | null
  price: string | null
  priceValue: number | null
  currency: string | null
  url: string | null
}

export interface JustWatchAvailability {
  title: string
  url: string
  offers: JustWatchOffer[]
}

export interface JustWatchMovieInput {
  tmdbId: number
  title: string
  originalTitle?: string | null
  year?: number | null
}

interface CachedAvailability {
  availability: JustWatchAvailability | null
}

interface RawJustWatchPackage {
  packageId?: unknown
  clearName?: unknown
  icon?: unknown
}

interface RawJustWatchOffer {
  monetizationType?: unknown
  presentationType?: unknown
  retailPrice?: unknown
  retailPriceValue?: unknown
  currency?: unknown
  standardWebURL?: unknown
  package?: RawJustWatchPackage | null
}

export interface RawJustWatchNode {
  content?: {
    title?: unknown
    fullPath?: unknown
    externalIds?: { tmdbId?: unknown } | null
  } | null
  offers?: RawJustWatchOffer[] | null
}

interface GraphQLResponse {
  data?: {
    popularTitles?: {
      edges?: Array<{ node?: RawJustWatchNode | null }>
    }
  }
  errors?: unknown
}

const SEARCH_QUERY = `
  query GetSearchTitles(
    $filter: TitleFilter!
    $country: Country!
    $language: Language!
    $first: Int!
    $formatOfferIcon: ImageFormat
  ) {
    popularTitles(
      country: $country
      filter: $filter
      first: $first
      sortBy: POPULAR
    ) {
      edges {
        node {
          content(country: $country, language: $language) {
            title
            ... on MovieOrShowContent {
              fullPath
              externalIds { tmdbId }
            }
          }
          offers(country: $country, platform: WEB, filter: { bestOnly: false }) {
            monetizationType
            presentationType
            retailPrice(language: $language)
            retailPriceValue
            currency
            standardWebURL
            package {
              packageId
              clearName
              icon(profile: S100, format: $formatOfferIcon)
            }
          }
        }
      }
    }
  }
`

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function safeExternalUrl(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function iconUrl(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  if (raw.startsWith('/')) return `${JUSTWATCH_IMAGES_URL}${raw}`
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && url.hostname === 'images.justwatch.com'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function qualityRank(value: string | null): number {
  if (value === '_4K') return 3
  if (value === 'HD') return 2
  if (value === 'SD') return 1
  return 0
}

function preferOffer(candidate: JustWatchOffer, current: JustWatchOffer): boolean {
  if (candidate.priceValue != null && current.priceValue != null && candidate.priceValue !== current.priceValue) {
    return candidate.priceValue < current.priceValue
  }
  if (candidate.priceValue != null && current.priceValue == null) return true
  if (candidate.priceValue == null && current.priceValue != null) return false
  return qualityRank(candidate.presentationType) > qualityRank(current.presentationType)
}

function normalizeOffers(rawOffers: RawJustWatchOffer[]): JustWatchOffer[] {
  const deduped = new Map<string, JustWatchOffer>()

  for (const raw of rawOffers) {
    const providerId = typeof raw.package?.packageId === 'number' ? raw.package.packageId : null
    const providerName = asString(raw.package?.clearName)
    const monetizationType = asString(raw.monetizationType)
    if (providerId == null || !providerName || !monetizationType) continue

    const offer: JustWatchOffer = {
      providerId,
      providerName,
      providerIconUrl: iconUrl(raw.package?.icon),
      monetizationType,
      presentationType: asString(raw.presentationType),
      price: asString(raw.retailPrice),
      priceValue: typeof raw.retailPriceValue === 'number' ? raw.retailPriceValue : null,
      currency: asString(raw.currency),
      url: safeExternalUrl(raw.standardWebURL),
    }

    const key = `${providerId}:${monetizationType}`
    const current = deduped.get(key)
    if (!current || preferOffer(offer, current)) deduped.set(key, offer)
  }

  return [...deduped.values()]
}

export function findJustWatchMatch(
  nodes: RawJustWatchNode[],
  tmdbId: number
): JustWatchAvailability | null {
  const match = nodes.find(node => String(node.content?.externalIds?.tmdbId ?? '') === String(tmdbId))
  const title = asString(match?.content?.title)
  const fullPath = asString(match?.content?.fullPath)

  if (!match || !title || !fullPath || !fullPath.startsWith('/ar/pelicula/')) return null

  return {
    title,
    url: `${JUSTWATCH_BASE_URL}${fullPath}`,
    offers: normalizeOffers(match.offers ?? []),
  }
}

export function justWatchSearchTerms(movie: JustWatchMovieInput): string[] {
  return [...new Set([movie.title.trim(), movie.originalTitle?.trim()].filter((value): value is string => !!value))]
}

async function searchJustWatch(movie: JustWatchMovieInput, searchQuery: string): Promise<JustWatchAvailability | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const releaseYear = movie.year
      ? { min: movie.year, max: movie.year }
      : undefined
    const response = await fetch(JUSTWATCH_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'GetSearchTitles',
        query: SEARCH_QUERY,
        variables: {
          filter: {
            searchQuery,
            includeTitlesWithoutUrl: true,
            objectTypes: ['MOVIE'],
            ...(releaseYear && { releaseYear }),
          },
          country: COUNTRY,
          language: LANGUAGE,
          first: 10,
          formatOfferIcon: 'PNG',
        },
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`JustWatch error: ${response.status}`)
    const result = await response.json() as GraphQLResponse
    if (result.errors) throw new Error('JustWatch GraphQL error')

    const nodes = (result.data?.popularTitles?.edges ?? [])
      .map(edge => edge.node)
      .filter((node): node is RawJustWatchNode => !!node)

    return findJustWatchMatch(nodes, movie.tmdbId)
  } finally {
    clearTimeout(timer)
  }
}

function isCachedAvailability(value: unknown): value is CachedAvailability {
  if (!value || typeof value !== 'object' || !('availability' in value)) return false
  const availability = (value as CachedAvailability).availability
  return availability === null || (
    typeof availability === 'object' &&
    typeof availability.title === 'string' &&
    typeof availability.url === 'string' &&
    Array.isArray(availability.offers)
  )
}

export async function getJustWatchAvailability(
  movie: JustWatchMovieInput
): Promise<JustWatchAvailability | null> {
  await connectDB()
  const cacheKey = `justwatch:${COUNTRY}:${movie.tmdbId}`
  const cached = await TmdbCache.findById(cacheKey).lean() as { data?: unknown; expiresAt?: Date } | null
  if (cached?.expiresAt && cached.expiresAt > new Date() && isCachedAvailability(cached.data)) {
    return cached.data.availability
  }

  let availability: JustWatchAvailability | null = null
  for (const searchTerm of justWatchSearchTerms(movie)) {
    availability = await searchJustWatch(movie, searchTerm)
    if (availability) break
  }

  const data: CachedAvailability = { availability }
  await TmdbCache.findByIdAndUpdate(
    cacheKey,
    { data, expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
    { upsert: true }
  )

  return availability
}
