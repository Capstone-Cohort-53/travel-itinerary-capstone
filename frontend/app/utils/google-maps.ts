/**
 * A link that opens a place in Google Maps: a new tab on a computer, the Google
 * Maps app on a phone. These plain "Maps URLs" need no API key or billing account.
 * https://developers.google.com/maps/documentation/urls/get-started
 *
 * Searches for the location name plus the address, so Google shows the place
 * itself (with hours, photos and directions), not just a pin. Returns null when
 * there's nothing to search for.
 */
export function googleMapsUrl(location: string | null, address: string | null): string | null {
    const query = [location, address?.replace(/\s*\n\s*/g, ', ')].filter(Boolean).join(', ')
    return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null
}
