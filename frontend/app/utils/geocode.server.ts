import {z} from "zod";

// Server only: the ".server" in the file name keeps React Router from ever
// bundling this file (and the API key it reads) into the browser's code.

/** Where an address is on the map, in the shape of the activity table's lat and lng columns. */
export type Coordinates = { lat: number | null, lng: number | null }

const noCoordinates: Coordinates = {lat: null, lng: null}

// geocode.maps.co answers with a list of matches, best first; lat and lon arrive as strings
const GeocodeResultsSchema = z.array(z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
}))

/**
 * Looks up an address with geocode.maps.co and returns the first match's
 * coordinates. Never throws: when there's no address, no key, no match, or the
 * call fails or is slow, it returns nulls so the activity still saves, just
 * without a map pin.
 */
export async function geocodeAddress(address: string | null): Promise<Coordinates> {
    const apiKey = process.env.GEOCODE_API_KEY
    if (!address || !apiKey) {
        return noCoordinates
    }

    try {
        const url = `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${encodeURIComponent(apiKey)}`
        // don't hold up saving the activity for more than 5 seconds
        const response = await fetch(url, {signal: AbortSignal.timeout(5000)})
        if (!response.ok) {
            // the URL holds the key, so log only the status
            console.error(`Geocoding failed with status ${response.status}`)
            return noCoordinates
        }

        const result = GeocodeResultsSchema.safeParse(await response.json())
        const first = result.success ? result.data[0] : undefined
        if (first === undefined) {
            return noCoordinates
        }

        // numeric(9,6) in the database: 6 decimal places
        return {lat: Number(first.lat.toFixed(6)), lng: Number(first.lon.toFixed(6))}
    } catch {
        console.error('Geocoding failed: the request errored or timed out')
        return noCoordinates
    }
}
