/**
 * Activity ideas for a trip's destination, from Wikivoyage
 * (https://en.wikivoyage.org): the free travel guide written by travelers.
 * Its city pages list places to see, things to do, and places to eat and drink,
 * most with a map pin. Called straight from the browser, like Photon.
 *
 * Wikivoyage's text is CC BY-SA, so wherever ideas are shown, credit Wikivoyage
 * and link to the guide page they came from.
 *
 * Wikivoyage limits how often one visitor can ask, so each destination is looked
 * up once while the page is open, and a failure just means "no ideas".
 */

import {tripCenter, type Coordinates, type SearchArea} from "~/utils/place-search";

const API_URL = 'https://en.wikivoyage.org/w/api.php'

/** The four tabs in "Need ideas?". */
export type IdeaCategory = 'sights' | 'culture' | 'outdoors' | 'food'

export type TripIdea = {
    id: string,
    category: IdeaCategory,
    name: string,
    /** a sentence or two about it, plain text; may be empty */
    description: string,
    /** as the guide writes it, e.g. "Blvd. Kukulcán km 9.5"; may be empty */
    address: string,
    /** the map pin; null when the guide doesn't give one */
    lat: number | null,
    lng: number | null,
}

export type TripIdeas = {
    /** the guide page the ideas came from, e.g. "Cancún", for the credit link */
    pageTitle: string,
    pageUrl: string,
    ideas: TripIdea[],
}

// a destination's guide needs at least this many ideas to be worth showing;
// fewer usually means a big city whose guide is split into neighborhood pages
const MIN_IDEAS = 4

// the guide page has to be this close to the destination's center
const SEARCH_RADIUS_METERS = '10000'

/** Asks the Wikivoyage API, the way it asks browser apps to: origin=* for CORS. Throws when it can't be reached or says no. */
async function askWikivoyage(params: Record<string, string>): Promise<any> {
    const query = new URLSearchParams({...params, format: 'json', formatversion: '2', origin: '*'})
    const response = await fetch(`${API_URL}?${query}`)
    if (!response.ok) {
        throw new Error(`Wikivoyage answered ${response.status}`)
    }
    return response.json()
}

/** Guide pages near a spot, closest first; district pages ("Paris/5th arrondissement") after the city's own page. */
async function guidePagesNear({lat, lng}: Coordinates): Promise<string[]> {
    const body = await askWikivoyage({
        action: 'query', list: 'geosearch', gscoord: `${lat}|${lng}`,
        gsradius: SEARCH_RADIUS_METERS, gslimit: '10',
    })
    const titles: string[] = (body.query?.geosearch ?? []).map((page: { title: string }) => page.title)
    const isDistrict = (title: string) => title.includes('/') ? 1 : 0
    // Array.sort is stable, so each group stays closest first
    return titles.sort((a, b) => isDistrict(a) - isDistrict(b))
}

/** A guide page's wikitext, the source the ideas are read from. */
async function pageWikitext(title: string): Promise<string> {
    const body = await askWikivoyage({action: 'parse', page: title, prop: 'wikitext', redirects: '1'})
    return body.parse?.wikitext ?? ''
}


// ── reading listings out of the wikitext ──
// A listing looks like {{see | name=El Rey | lat=21.06 | long=-86.78 | content=Mayan ruins ... }}
// or {{listing | type=eat | name=... }}. Values can hold their own {{templates}} and [[links]],
// so the text is read brace by brace rather than with one regular expression.

/** Where the {{ at `start` closes: the index just past its }}, or -1. */
function templateEnd(text: string, start: number): number {
    let depth = 0
    for (let i = start; i < text.length - 1; i++) {
        const pair = text.slice(i, i + 2)
        if (pair === '{{') {
            depth++
            i++
        } else if (pair === '}}') {
            depth--
            i++
            if (depth === 0) return i + 1
        }
    }
    return -1
}

/** Splits a template's inside on the | that separate its fields, skipping the | inside nested {{ }} and [[ ]]. */
function splitFields(inside: string): string[] {
    const fields: string[] = []
    let depth = 0
    let current = ''
    for (let i = 0; i < inside.length; i++) {
        const pair = inside.slice(i, i + 2)
        if (pair === '{{' || pair === '[[') {
            depth++
            current += pair
            i++
        } else if (pair === '}}' || pair === ']]') {
            depth--
            current += pair
            i++
        } else if (inside[i] === '|' && depth === 0) {
            fields.push(current)
            current = ''
        } else {
            current += inside[i]
        }
    }
    fields.push(current)
    return fields
}

/** Wikitext to plain text: [[Page|shown]] → shown, '''bold''' → bold, and templates, references and HTML dropped. */
function plainText(wikitext: string): string {
    return wikitext
        .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '')
        .replace(/\{\{[^{}]*\}\}/g, '')
        .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
        .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, '$1')
        .replace(/\[https?:\/\/\S+\]/g, '')
        .replace(/'{2,}/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

// "See" places that go in Culture instead of Sights
const CULTURE_WORDS = /museum|museo|gallery|galer|art\b|arts\b|theat|teatro|cathedral|church|iglesia|temple|mission|histor|library|cultur/i
// "See" and "Do" places that go in Outdoors, judged by their name
const OUTDOOR_WORDS = /beach|playa|\bpark\b|parque|garden|jard[ií]n|nature|reserve|trail|hike|hiking|lake|lagoon|laguna|river|island|\bisla\b|cenote|snorkel|div(e|ing)|kayak|surf|reef|forest|canyon|mountain|\bski\b/i
// a "Do" whose description is about one of these is an outdoor activity too (kept short
// on purpose: a dinner cruise's description mentions the lagoon, but it isn't one)
const OUTDOOR_ACTIVITY_WORDS = /\b(snorkel\w*|scuba|diving|kayak\w*|hik(e|es|ing)|trails?|cenotes?|surf\w*|beach(es)?)\b/i

/** Which tab a listing belongs in, or null for listing types that aren't activities (Buy, Sleep, Go). */
function categoryOf(type: string, name: string, description: string): IdeaCategory | null {
    if (type === 'eat' || type === 'drink') return 'food'
    if (type === 'see' || type === 'do') {
        if (OUTDOOR_WORDS.test(name) || (type === 'do' && OUTDOOR_ACTIVITY_WORDS.test(description))) return 'outdoors'
        if (CULTURE_WORDS.test(name) || (type === 'see' && CULTURE_WORDS.test(description))) return 'culture'
        return 'sights'
    }
    return null
}

const LISTING_TYPES = new Set(['see', 'do', 'eat', 'drink', 'buy', 'sleep', 'go', 'listing'])

/** Every See, Do, Eat and Drink listing on a guide page, in the page's order. */
export function readListings(wikitext: string): TripIdea[] {
    const ideas: TripIdea[] = []
    // a plain {{listing}} takes its type from the == See == / == Eat == heading above it
    let section = ''
    let i = 0
    while (i < wikitext.length) {
        if (wikitext.startsWith('\n==', i)) {
            const lineEnd = wikitext.indexOf('\n', i + 1)
            const heading = wikitext.slice(i + 1, lineEnd === -1 ? undefined : lineEnd)
            // only the top-level == Heading ==, not === Subheading ===
            const top = heading.match(/^==([^=].*?)==\s*$/)
            if (top) section = top[1].trim().toLowerCase()
            i++
            continue
        }
        if (!wikitext.startsWith('{{', i)) {
            i++
            continue
        }

        const end = templateEnd(wikitext, i)
        if (end === -1) break
        const [templateName, ...rest] = splitFields(wikitext.slice(i + 2, end - 2))
        i = end
        const kind = templateName.trim().toLowerCase()
        if (!LISTING_TYPES.has(kind)) continue

        const fields: Record<string, string> = {}
        for (const field of rest) {
            const equals = field.indexOf('=')
            if (equals > 0) fields[field.slice(0, equals).trim().toLowerCase()] = field.slice(equals + 1).trim()
        }
        const type = (kind === 'listing' ? fields.type || section : kind).toLowerCase()
        const name = plainText(fields.name ?? '')
        // some guides list a big place only as a link to its own page: no name to show
        if (!name || name.length > 120) continue

        const description = plainText(fields.content ?? '')
        const category = categoryOf(type, name, description)
        if (!category) continue

        const lat = Number(fields.lat)
        const lng = Number(fields.long)
        const hasPin = fields.lat !== undefined && fields.long !== undefined && fields.lat !== '' && fields.long !== ''
            && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
        ideas.push({
            id: `${category}-${ideas.length}`,
            category,
            name,
            description,
            address: plainText(fields.address ?? ''),
            lat: hasPin ? Number(lat.toFixed(6)) : null,
            lng: hasPin ? Number(lng.toFixed(6)) : null,
        })
    }
    return ideas
}


// one lookup per destination while the page is open
const ideasCache = new Map<string, Promise<TripIdeas | null>>()

/**
 * Ideas for a trip: the Wikivoyage guide for the destination's area, read into
 * See / Do / Eat / Drink ideas. Null when the destination can't be placed on
 * the map, there's no guide for it, or Wikivoyage can't be reached. Never throws.
 */
export function findTripIdeas(area: SearchArea): Promise<TripIdeas | null> {
    const key = `${area.destination?.trim().toLowerCase() ?? ''}|${area.near?.lat ?? ''},${area.near?.lng ?? ''}`
    let lookup = ideasCache.get(key)
    if (!lookup) {
        lookup = lookUpIdeas(area).catch(() => null).then((result) => {
            // don't remember a miss (Wikivoyage may have been busy); try again next time
            if (!result) ideasCache.delete(key)
            return result
        })
        ideasCache.set(key, lookup)
    }
    return lookup
}

async function lookUpIdeas(area: SearchArea): Promise<TripIdeas | null> {
    const center = await tripCenter(area)
    if (!center) return null

    // the closest city page first; if it has hardly any listings (a big city
    // split into districts), the next page over. At most 2 pages, to go easy on Wikivoyage.
    const titles = (await guidePagesNear(center)).slice(0, 2)
    for (const title of titles) {
        const ideas = readListings(await pageWikitext(title))
        if (ideas.length >= MIN_IDEAS) {
            return {
                pageTitle: title,
                pageUrl: `https://en.wikivoyage.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
                ideas,
            }
        }
    }
    return null
}
