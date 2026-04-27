# Explorar — Design Doc

**Fecha:** 2026-04-27  
**Feature:** Pantalla de exploración de películas con secciones curadas y filtros

---

## Objetivo

Permitir al usuario descubrir películas nuevas desde la home, mediante secciones curadas (Populares, Mejor valoradas) y filtros activos (género, año, rating mínimo). El acceso es desde un botón en la home, no desde el nav.

---

## Arquitectura

### Nuevos archivos
- `app/(app)/explore/page.tsx` — Client Component, pantalla principal
- `app/(app)/explore/loading.tsx` — Skeleton de carga
- `app/api/movies/discover/route.ts` — Endpoint que envuelve `/discover/movie` de TMDB

### Archivos modificados
- `app/(app)/page.tsx` — Agrega botón/card "Explorar películas" junto a `TonightCard`

---

## API: `GET /api/movies/discover`

Query params opcionales:

| Param       | Tipo   | Descripción                                      |
|-------------|--------|--------------------------------------------------|
| `genres`    | string | IDs de géneros separados por coma (ej. `28,35`)  |
| `year`      | string | Año de lanzamiento exacto (ej. `2023`)           |
| `minRating` | string | Rating mínimo TMDB (ej. `7.0`)                  |
| `sort`      | string | `popularity.desc` (default) o `vote_average.desc`|
| `page`      | number | Número de página (default `1`)                   |

Respuesta: `{ results: NormalizedMovie[], page: number, totalPages: number }`

Usa el sistema de caché existente (`tmdbGet`) con una clave construida desde los params.

---

## UI / Layout

### Modo sin filtros activos (default)
```
[ Chips de géneros — scroll horizontal ]
[ Fila: select Año | select Rating mín ]
────────────────────────────────────────
[ Sección "Populares ahora"            ]
  → MovieShelf horizontal
[ Sección "Mejor valoradas"            ]
  → MovieShelf horizontal
[ paddingBottom: 90px ]
```

Las secciones curadas se fetchean con SWR con parámetros fijos:
- Populares: `sort=popularity.desc`
- Mejor valoradas: `sort=vote_average.desc&minRating=7`

### Modo con filtros activos
```
[ Chips de géneros — scroll horizontal ]
[ Fila: select Año | select Rating mín ]
────────────────────────────────────────
[ "X resultados" label                 ]
[ Grilla 2 col (mobile) / 3-4 (desktop)]
  → MovieCard (componente existente)
[ Botón "Cargar más" — full width      ]
[ paddingBottom: 90px ]
```

### Estado local del Client Component
```ts
filters: { genres: number[], year: string, minRating: string }
results: NormalizedMovie[]   // acumulados entre páginas
page: number
totalPages: number
isLoading: boolean
```

`hasActiveFilters = genres.length > 0 || year !== '' || minRating !== ''`

Al activar filtros: limpia results, resetea page = 1, fetcha.  
Al desactivar todos: vuelve a mostrar secciones curadas (SWR las tiene cacheadas).

---

## Decisiones mobile-first

- Chips de géneros: `overflow-x: auto` con scroll horizontal, sin wrap
- Año y rating: dos `<select>` nativos en fila, 50% de ancho cada uno
- Grilla: 2 columnas en mobile, 3-4 en desktop vía CSS
- Botón "Cargar más": full-width en mobile
- `paddingBottom: 90px` para no tapar el bottom nav

---

## Cambio en Home

Se agrega un botón/card "Explorar películas →" debajo de `TonightCard` en `app/(app)/page.tsx`. Navega a `/explore`. No se modifica el nav ni `Navigation.tsx`.

---

## Fuera de scope

- Filtro por idioma o país
- Guardar preferencias de filtros
- Infinite scroll (se usa "Cargar más" explícito)
- Tabs explícitos curado/filtrado
