/**
 * Place suggestions for the activity form's Location Name box, from Photon
 * (https://photon.komoot.io): a free, keyless search-as-you-type service built
 * on OpenStreetMap, the same data as our map. Called straight from the browser.
 *
 * Photon's public server is shared and has no uptime guarantee, so callers
 * should debounce, ask for a handful of results, and treat a failure as "no
 * suggestions": the organizer can always type the place by hand.
 */

const PHOTON_URL = 'https://photon.komoot.io/api/'

/** One suggestion, already split into the form's boxes. */
export type PlaceSuggestion = {
    id: string,
    /** Location Name, e.g. "La Choza" */
    name: string,
    /** Street Address, e.g. "905 Alarid Street" */
    street: string,
    /** City, State, e.g. "Santa Fe, NM" (or "Lusaka, Zambia" outside the US) */
    cityState: string,
    zip: string,
    lat: number,
    lng: number,
    /** the second line in the dropdown, e.g. "905 Alarid Street, Santa Fe, NM 87505" */
    detail: string,
}

export type Coordinates = { lat: number, lng: number }

// Photon spells US states out; the form uses the two-letter code
const US_STATES: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'District of Columbia': 'DC',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL',
    'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA',
    'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
    'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR',
    'Pennsylvania': 'PA', 'Puerto Rico': 'PR', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
}

// the parts of a Photon result we use; every one may be missing
type PhotonFeature = {
    geometry: { coordinates: [number, number] },
    properties: {
        osm_type?: string, osm_id?: number, type?: string,
        name?: string, housenumber?: string, street?: string,
        city?: string, district?: string, county?: string, state?: string,
        country?: string, countrycode?: string, postcode?: string,
    },
}

function toSuggestion({geometry, properties: p}: PhotonFeature): PlaceSuggestion | null {
    const [lng, lat] = geometry.coordinates
    const street = [p.housenumber, p.street].filter(Boolean).join(' ')
    // a city result has no "city" of its own: its name is the city
    const city = p.city ?? (p.type === 'city' ? p.name : undefined) ?? p.district ?? p.county
    const region = p.countrycode === 'US' ? (p.state && US_STATES[p.state]) ?? p.state : p.country
    const cityState = [city, region].filter(Boolean).join(', ')
    const name = p.name ?? street
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null
    }

    const cityLine = [cityState, p.postcode].filter(Boolean).join(' ')
    // for a city result, don't repeat the name in the second line
    const detail = [street, cityLine].filter(Boolean).join(', ').replace(new RegExp(`^${escapeRegExp(name)}, `), '')
    return {
        id: `${p.osm_type ?? ''}${p.osm_id ?? `${lat},${lng}`}`,
        name, street, cityState, zip: p.postcode ?? '', lat, lng, detail,
    }
}

/** Straight-line distance in kilometers (the haversine formula). */
function distanceKm(a: Coordinates, b: Coordinates): number {
    const toRadians = Math.PI / 180
    const dLat = (b.lat - a.lat) * toRadians
    const dLng = (b.lng - a.lng) * toRadians
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRadians) * Math.cos(b.lat * toRadians) * Math.sin(dLng / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(h))
}

// how close a place has to be to count as "near the trip"
const NEARBY_KM = 150

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** One Photon search, as suggestions. Throws only when aborted or when Photon can't be reached. */
async function photonSearch(query: string, limit: number, near: Coordinates | null, signal: AbortSignal): Promise<PlaceSuggestion[]> {
    const params = new URLSearchParams({q: query, limit: String(limit), lang: 'en'})
    if (near) {
        params.set('lat', String(near.lat))
        params.set('lon', String(near.lng))
    }
    const response = await fetch(`${PHOTON_URL}?${params}`, {signal})
    if (!response.ok) {
        return []
    }
    const body = await response.json() as { features?: PhotonFeature[] }
    return (body.features ?? [])
        .map(toSuggestion)
        .filter((suggestion): suggestion is PlaceSuggestion => suggestion !== null)
}

/** Drops repeats (Photon sometimes lists a building and its entrance), keeping the first. */
function withoutRepeats(suggestions: PlaceSuggestion[]): PlaceSuggestion[] {
    const seen = new Set<string>()
    return suggestions.filter((suggestion) => {
        const key = `${suggestion.name}|${suggestion.detail}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/** Where the trip is, for ranking suggestions. Either may be missing. */
export type SearchArea = {
    /** a pin on this trip (another activity's), the most reliable hint */
    near: Coordinates | null,
    /** the trip's destination as typed, e.g. "Santa Fe" */
    destination: string | null,
}

/**
 * Up to `limit` places matching what's been typed, with places on this trip first.
 *
 * - With a pin on the trip, places within NEARBY_KM (150 km) of it come first: Photon
 *   ranks a close name match above distance, so "folk art museum" would otherwise
 *   start with one in Greece.
 * - With no pin yet (a new trip), the destination is added to the search too
 *   ("la choza" → "la choza Santa Fe") and those matches come first. Looking the
 *   destination up on its own doesn't work: "Santa Fe" alone means Argentina.
 *
 * Throws only when aborted or when Photon can't be reached.
 */
export async function searchPlaces(query: string, {near, destination}: SearchArea, signal: AbortSignal, limit = 5): Promise<PlaceSuggestion[]> {
    if (near) {
        // ask for extra results to re-rank, so a nearby place further down Photon's list can move up
        const suggestions = withoutRepeats(await photonSearch(query, limit * 2, near, signal))
        // nearby first; otherwise keep Photon's order (Array.sort is stable)
        const isFar = (place: PlaceSuggestion) => distanceKm(near, place) > NEARBY_KM ? 1 : 0
        suggestions.sort((a, b) => isFar(a) - isFar(b))
        return suggestions.slice(0, limit)
    }

    const place = destination?.trim()
    // skip the extra search when the organizer has already typed the destination
    if (!place || query.toLowerCase().includes(place.toLowerCase())) {
        return withoutRepeats(await photonSearch(query, limit, null, signal)).slice(0, limit)
    }
    const [atDestination, anywhere] = await Promise.all([
        photonSearch(`${query} ${place}`, limit, null, signal),
        photonSearch(query, limit, null, signal),
    ])
    return withoutRepeats([...atDestination, ...anywhere]).slice(0, limit)
}
