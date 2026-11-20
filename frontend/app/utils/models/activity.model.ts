import {z} from "zod";
import type {SignedInUser} from "~/utils/session.server";
import {postRequest} from "~/utils/request.utils";
import type {Status} from "~/utils/interfaces/Status";

/**
 * What the Add Activity form's inputs hold. Every input is a string, and an
 * empty string means "not provided". Used by TanStack Form in the browser and
 * again by the route action on the server.
 */
export const ActivityFormSchema = z.object({
    name: z.string().trim().min(1, 'Please enter an activity name.').max(255, 'Name must be 255 characters or fewer.'),
    mandatory: z.enum(['mandatory', 'optional'], 'Please choose mandatory or optional.'),
    activityDate: z.iso.date('Please pick a date.'),
    startTime: z.iso.time('Please pick a start time.'),
    endTime: z.iso.time('Please pick an end time.'),
    description: z.string().trim(),
    location: z.string().trim().max(255, 'Location name must be 255 characters or fewer.'),
    streetAddress: z.string().trim().max(150, 'Street address must be 150 characters or fewer.'),
    city: z.string().trim().max(60, 'City must be 60 characters or fewer.'),
    state: z.string().trim().max(20, 'State must be 20 characters or fewer.'),
    zip: z.union([z.literal(''), z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Please enter a 5-digit ZIP code.')]),
    // numeric(10,2) in the database: up to 99,999,999.99
    cost: z.union([
        z.literal(''),
        z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/, 'Please enter a cost like 35 or 35.00.'),
    ]),
    costNotes: z.string().trim(),
    notes: z.string().trim(),
}).refine(
    // same rule as the database: an activity can't end before it starts
    (data) => data.endTime > data.startTime,
    {message: 'End time must be after start time.', path: ['endTime']},
)
export type ActivityForm = z.infer<typeof ActivityFormSchema>

/** The body POST /trip/:tripId/activity expects. Fields left out get the API's defaults. */
export type ActivityRequest = {
    name: string,
    mandatory: boolean,
    startDatetime: string,
    endDatetime: string,
    description: string | null,
    location: string | null,
    address: string | null,
    cost?: number,
    notes: string | null,
}

/**
 * Turns the form's strings into the API's request body.
 *
 * - The date and times are saved as the clock time at the destination, marked
 *   as UTC, the same way trip dates are. Display them with `timeZone: 'UTC'`
 *   so 6:00 PM stays 6:00 PM no matter where the viewer is.
 * - Street, city, state and ZIP become one `address` string.
 * - The database has no column for cost notes, so they are added to `notes`.
 */
export function toActivityRequest(form: ActivityForm): ActivityRequest {
    const stateAndZip = [form.state, form.zip].filter(Boolean).join(' ')
    const address = [form.streetAddress, form.city, stateAndZip].filter(Boolean).join(', ')
    const notes = [form.notes, form.costNotes && `Cost notes: ${form.costNotes}`].filter(Boolean).join('\n\n')

    return {
        name: form.name,
        mandatory: form.mandatory === 'mandatory',
        startDatetime: `${form.activityDate}T${form.startTime}Z`,
        endDatetime: `${form.activityDate}T${form.endTime}Z`,
        description: form.description || null,
        location: form.location || null,
        // the field limits above keep the joined address under the column's 255 characters
        address: address || null,
        cost: form.cost === '' ? undefined : Number(form.cost),
        notes: notes || null,
    }
}

export async function postActivity(tripId: string, body: ActivityRequest, signedInUser: SignedInUser): Promise<Status> {
    return postRequest(`/trip/${tripId}/activity`, body, signedInUser)
}
