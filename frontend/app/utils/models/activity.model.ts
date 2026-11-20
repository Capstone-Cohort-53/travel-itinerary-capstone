import {z} from "zod";
import type {Status} from "~/utils/interfaces/Status";
import {getRequest} from "~/utils/request.utils";
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
