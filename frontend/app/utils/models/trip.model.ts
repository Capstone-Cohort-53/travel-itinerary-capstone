import {z} from 'zod'
import {v7 as uuid} from "uuid";
import type {Status} from "~/utils/interfaces/Status";
import {failedRequestStatus, getRequest, REQUEST_TIMEOUT_MS, REST_URL} from "~/utils/request.utils";
import type {SignedInUser} from "~/utils/session.server";

// a whole trip, mirroring the backend's TripSchema (backend/src/apis/trip/trip.model.ts)
export const TripSchema =
    z.object({
        id: z
            .uuidv7('please provide a valid uuid for trip'),
        ownerId: z
            .uuidv7('please provide a valid uuid for trip'),
        description: z
            .string('please provide a valid description')
            .max(40,'please provide a description of 40 characters or less').nullable(),
        createdAt: z
            .coerce.date('please provide a valid created at').nullable(),
        title:z
            .string('please provide a valid title')
            .max(255,'please provide a valid name (255 characters)'),
        image: z
            .url('please provide a valid image')
            .max(255,'please provide a valid image (255 characters)'),
        destination: z
            .string('please provide a valid destination')
            .max(255,'please provide a valid destination (255 characters)'),

        startDate:z
            .coerce.date('please provide a valid startDate'),

        endDate:z
            .coerce.date('please provide a valid endDate'),    })
export type Trip = z.infer<typeof TripSchema>;

// only what the create trip form lets the user type.
// id is made by postTrip and ownerId comes from the API's session: neither is in the form.
// Every value is a string because that is what an <input> holds.
export const NewTripSchema = z.object({
    title: z.string('please provide a trip name')
        .trim()
        .min(1, 'please provide a trip name')
        .max(255, 'please provide a trip name of 255 characters or less'),
    destination: z.string('please provide a destination')
        .trim()
        .min(1, 'please provide a destination')
        .max(255, 'please provide a destination of 255 characters or less'),
    startDate: z.iso.date('please provide a start date'),
    endDate: z.iso.date('please provide an end date'),
    // the backend allows 40 characters
    description: z.string('please provide a valid description')
        .trim()
        .max(40, 'please keep the description to 40 characters or less'),
}).refine(
    // same rule as the database: a trip cannot end before it starts (YYYY-MM-DD compares correctly as text)
    (trip) => trip.endDate >= trip.startDate,
    {message: 'the end date cannot be before the start date', path: ['endDate']}
)
export type NewTrip = z.infer<typeof NewTripSchema>

export type TripResult = { status: Status; trip: Trip | null }

/**
 * GET /apis/trip/:tripId: one trip, only if the signed-in user owns it or is a member.
 * Never throws: every failure comes back as a Status.
 */
export async function getTrip(tripId: string, signedInUser: SignedInUser): Promise<TripResult> {
    const status = await getRequest(`/trip/${tripId}`, signedInUser);
    if (status.status !== 200) {
        return {status, trip: null}
    }

    const validationResult = TripSchema.safeParse(status.data)
    if (!validationResult.success) {
        return {
            status: {status: 502, data: null, message: 'Could not read this trip. Please try again.'},
            trip: null
        }
    }
    return {status, trip: validationResult.data}
}

export type TripsResult = { status: Status; trips: Trip[] }

/**
 * GET /apis/trip: every trip the signed-in user owns or has joined, soonest first.
 * Never throws: every failure comes back as a Status.
 */
export async function getMyTrips(signedInUser: SignedInUser): Promise<TripsResult> {
    const status = await getRequest('/trip', signedInUser);
    if (status.status !== 200) {
        return {status, trips: []}
    }

    const validationResult = TripSchema.array().safeParse(status.data)
    if (!validationResult.success) {
        return {
            status: {status: 502, data: null, message: 'Could not read your trips. Please try again.'},
            trips: []
        }
    }
    return {status, trips: validationResult.data}
}

export async function getTripByTripId(tripId: string, signedInUser:SignedInUser): Promise<Trip | null> {
    const {trip} = await getTrip(tripId, signedInUser)
    return trip
}

/**
 * POST /apis/trip: creates a trip owned by the signed-in user.
 *
 * The id is made here (UUIDv7), because the API expects the client to send it.
 * The owner is never sent: the API takes it from its own session.
 * Never throws: every failure comes back as a Status.
 *
 * @param data the validated form values
 * @param user the signed-in user, from requireSignedInUser
 * @param image the trip's image. The form does not ask for one, but the API requires it
 * @returns 200 with the new trip in `data`, otherwise the failure's status and message
 */
export async function postTrip(data: NewTrip, user: SignedInUser, image: string): Promise<Status> {
    // serverValidate hands back the raw form values, so trim here
    const description = data.description.trim()
    const trip = {
        id: uuid(),
        title: data.title.trim(),
        destination: data.destination.trim(),
        description: description === '' ? null : description,
        startDate: data.startDate,
        endDate: data.endDate,
        image,
    }

    try {
        const response = await fetch(`${REST_URL}/trip`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: user.authorization,
                Cookie: user.cookie,
            },
            body: JSON.stringify(trip),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        // parse the body defensively: an error response may not carry JSON
        const body = await response.json().catch(() => null)

        if (response.status === 201) {
            return {status: 200, data: body, message: 'Trip created!'}
        }

        return {
            status: response.status,
            data: null,
            message: body?.message ?? 'Could not create the trip. Please try again.',
        }
    } catch (error) {
        console.error('POST /trip failed:', error)
        return failedRequestStatus(error)
    }
}
