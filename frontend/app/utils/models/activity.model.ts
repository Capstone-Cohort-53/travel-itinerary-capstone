import {z} from "zod";
import type {Status} from "~/utils/interfaces/Status";
import {deleteRequest, getRequest, postRequest, putRequest} from "~/utils/request.utils";
import type {SignedInUser} from "~/utils/session.server";

// one activity, mirroring the backend's ActivitySchema (backend/src/apis/activity/activity.model.ts)
export const ActivitySchema = z.object({
    id: z.uuidv7(),
    tripId: z.uuidv7(),
    address: z.string().nullable(),
    cost: z.coerce.number(),
    description: z.string().nullable(),
    endDatetime: z.coerce.date().nullable(),
    lat: z.coerce.number().nullable(),
    lng: z.coerce.number().nullable(),
    location: z.string().nullable(),
    mandatory: z.boolean(),
    name: z.string(),
    notes: z.string().nullable(),
    startDatetime: z.coerce.date().nullable(),
})
export type Activity = z.infer<typeof ActivitySchema>

export type ActivitiesResult = { status: Status; activities: Activity[] }

/**
 * GET /apis/trip/:tripId/activity: every activity planned for a trip.
 * Never throws: every failure comes back as a Status.
 */
export async function getActivitiesByTripId(tripId: string, user: SignedInUser): Promise<ActivitiesResult> {
    const status = await getRequest(`/trip/${tripId}/activity`, user)
    if (status.status !== 200) {
        return {status, activities: []}
    }

    const validationResult = ActivitySchema.array().safeParse(status.data)
    if (!validationResult.success) {
        return {
            status: {status: 502, data: null, message: 'Could not read the activities. Please try again.'},
            activities: []
        }
    }
    return {status, activities: validationResult.data}
}



/** A `datetime-local` input's value, e.g. "2026-12-02T18:00". */
const dateTimeLocal = z.union([
    z.literal(''),
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Please pick a date and time.'),
])

/** A coordinate from a picked place suggestion, or empty when the address was typed by hand. */
const coordinate = z.union([
    z.literal(''),
    z.string().regex(/^-?\d{1,3}(\.\d+)?$/, 'Please pick the place again.'),
])

/**
 * What the activity form's inputs hold: one input per column of the backend's
 * activity table. lat and lng are filled in when the organizer picks a place
 * from the Location Name suggestions (Photon); when they're empty, the server
 * looks the address up instead (see geocode.server.ts). Every input is a
 * string, and an empty string means "not provided". The limits mirror the
 * backend's ActivitySchema. Used by TanStack Form in the browser and again by
 * the route actions on the server.
 */
export const ActivityFormSchema = z.object({
    name: z.string().trim().min(1, 'Please enter an activity name.').max(255, 'Name must be 255 characters or fewer.'),
    // the `mandatory` boolean, as the two radio buttons' values
    mandatory: z.enum(['mandatory', 'optional'], 'Please choose mandatory or optional.'),
    startDatetime: dateTimeLocal,
    endDatetime: dateTimeLocal,
    description: z.string().trim(),
    location: z.string().trim().max(255, 'Location must be 255 characters or fewer.'),
    address: z.string().trim().max(255, 'Address must be 255 characters or fewer.'),
    // numeric(10,2) in the database: up to 99,999,999.99
    cost: z.union([
        z.literal(''),
        z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Please enter a cost like 35 or 35.00.'),
    ]),
    notes: z.string().trim(),
    lat: coordinate,
    lng: coordinate,
}).refine(
    // same rule as the backend: an activity can't end before it starts
    (data) => data.startDatetime === '' || data.endDatetime === '' || data.endDatetime >= data.startDatetime,
    {message: 'End can’t be before the start.', path: ['endDatetime']},
)
export type ActivityForm = z.infer<typeof ActivityFormSchema>

/**
 * The coordinates that came with a picked place, when they're usable: both
 * present, in range, and there's still an address. null means "look the
 * address up on the server instead".
 */
export function coordinatesFromForm(form: ActivityForm): Pick<ActivityRequest, 'lat' | 'lng'> | null {
    if (!form.address || form.lat === '' || form.lng === '') {
        return null
    }
    const lat = Number(form.lat)
    const lng = Number(form.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return null
    }
    // numeric(9,6) in the database: 6 decimal places
    return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))}
}

/** The body POST and PUT /trip/:tripId/activity expect: the backend's fields, by the same names. */
export type ActivityRequest = {
    name: string,
    mandatory: boolean,
    startDatetime: string | null,
    endDatetime: string | null,
    description: string | null,
    location: string | null,
    address: string | null,
    cost: number,
    notes: string | null,
    lat: number | null,
    lng: number | null,
}

/**
 * Turns the form's strings into the API's request body, field for field. An
 * empty input becomes null (or 0 for cost, the backend's default).
 *
 * Start and end are saved as the clock time at the destination, marked as UTC,
 * the same way trip dates are. Display them with `timeZone: 'UTC'` so 6:00 PM
 * stays 6:00 PM no matter where the viewer is.
 */
export function toActivityRequest(form: ActivityForm, coordinates: Pick<ActivityRequest, 'lat' | 'lng'> = {lat: null, lng: null}): ActivityRequest {
    return {
        name: form.name,
        mandatory: form.mandatory === 'mandatory',
        startDatetime: form.startDatetime ? `${form.startDatetime}Z` : null,
        endDatetime: form.endDatetime ? `${form.endDatetime}Z` : null,
        description: form.description || null,
        location: form.location || null,
        address: form.address || null,
        cost: form.cost === '' ? 0 : Number(form.cost),
        notes: form.notes || null,
        // looked up from the address by the route action; null means no map pin
        lat: coordinates.lat,
        lng: coordinates.lng,
    }
}

/** The first of these activities that has a map pin, as a hint for where the trip is; null when none do. */
export function firstPin(activities: Activity[]): { lat: number, lng: number } | null {
    const pinned = activities.find((activity) => activity.lat !== null && activity.lng !== null)
    return pinned ? {lat: pinned.lat as number, lng: pinned.lng as number} : null
}

/** Turns a saved activity back into the form's strings, for the Edit page. The reverse of toActivityRequest. */
export function toActivityForm(activity: Activity): ActivityForm {
    return {
        name: activity.name,
        mandatory: activity.mandatory ? 'mandatory' : 'optional',
        // read in UTC, the way toActivityRequest saved them: "2026-12-02T18:00"
        startDatetime: activity.startDatetime?.toISOString().slice(0, 16) ?? '',
        endDatetime: activity.endDatetime?.toISOString().slice(0, 16) ?? '',
        description: activity.description ?? '',
        location: activity.location ?? '',
        address: activity.address ?? '',
        cost: activity.cost === 0 ? '' : String(activity.cost),
        notes: activity.notes ?? '',
        // the saved pin is reused when the address isn't changed; editing the address clears it
        lat: activity.lat === null ? '' : String(activity.lat),
        lng: activity.lng === null ? '' : String(activity.lng),
    }
}

export async function postActivity(tripId: string, body: ActivityRequest, signedInUser: SignedInUser): Promise<Status> {
    return postRequest(`/trip/${tripId}/activity`, body, signedInUser)
}

/** GET /apis/trip/:tripId/activity/:activityId: one activity, or null when it can't be loaded. */
export async function getActivity(tripId: string, activityId: string, signedInUser: SignedInUser): Promise<Activity | null> {
    const status = await getRequest(`/trip/${tripId}/activity/${activityId}`, signedInUser)
    const validationResult = ActivitySchema.safeParse(status.data)
    return validationResult.success ? validationResult.data : null
}

/** PUT replaces every field: anything left out of the body goes back to the API's default. */
export async function putActivity(tripId: string, activityId: string, body: ActivityRequest, signedInUser: SignedInUser): Promise<Status> {
    return putRequest(`/trip/${tripId}/activity/${activityId}`, body, signedInUser)
}

export async function deleteActivity(tripId: string, activityId: string, signedInUser: SignedInUser): Promise<Status> {
    return deleteRequest(`/trip/${tripId}/activity/${activityId}`, signedInUser)
}
