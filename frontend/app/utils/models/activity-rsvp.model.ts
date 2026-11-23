import {z} from "zod";
import type {Status} from "~/utils/interfaces/Status";
import {getRequest, postRequest} from "~/utils/request.utils";
import type {SignedInUser} from "~/utils/session.server";

// ── RSVPs: mirror the backend's ActivityRsvpSchema (backend/src/apis/activity-rsvp/activity-rsvp.model.ts) ──

export const GOING_OPTIONS = ['yes', 'maybe', 'no'] as const

/** One RSVP plus the name of the person who sent it: what GET /activity/:activityId/rsvp returns. */
export const ActivityRsvpSchema = z.object({
    id: z.uuidv7(),
    activityId: z.uuidv7(),
    memberId: z.uuidv7(),
    adults: z.int().min(0),
    children: z.int().min(0),
    going: z.enum(GOING_OPTIONS),
    name: z.string(),
})
export type ActivityRsvp = z.infer<typeof ActivityRsvpSchema>

/**
 * What the "Will you attend?" form's inputs hold: the three fields the backend
 * accepts in POST /activity/:activityId/rsvp, as strings. Used by TanStack
 * Form in the browser and again by the route action on the server.
 */
export const RsvpFormSchema = z.object({
    going: z.enum(GOING_OPTIONS, 'Please choose Going, Maybe, or Not going.'),
    adults: z.string().regex(/^\d{1,3}$/, 'Please enter how many adults, 0 or more.'),
    children: z.string().regex(/^\d{1,3}$/, 'Please enter how many children, 0 or more.'),
})
export type RsvpForm = z.infer<typeof RsvpFormSchema>

/** GET /apis/activity/:activityId/rsvp: everyone's answers. Empty when they can't be loaded. */
export async function getActivityRsvps(activityId: string, signedInUser: SignedInUser): Promise<ActivityRsvp[]> {
    const status = await getRequest(`/activity/${activityId}/rsvp`, signedInUser)
    const validationResult = ActivityRsvpSchema.array().safeParse(status.data)
    return validationResult.success ? validationResult.data : []
}

/** POST /apis/activity/:activityId/rsvp: creates the signed-in member's RSVP, or replaces it (201 / 200). */
export async function postActivityRsvp(activityId: string, form: RsvpForm, signedInUser: SignedInUser): Promise<Status> {
    return postRequest(`/activity/${activityId}/rsvp`, {
        going: form.going,
        adults: Number(form.adults),
        children: Number(form.children),
    }, signedInUser)
}


// ── trip members: read-only, from Melissa's GET /apis/member/trip/:tripId ──

/** The fields of the backend's MemberWithProfile this page uses (Zod drops the rest). */
export const TripMemberSchema = z.object({
    id: z.uuidv7(),
    profileId: z.uuidv7().nullable(),
    name: z.string(),
    role: z.enum(['owner', 'member']),
    adults: z.int(),
    children: z.int(),
})
export type TripMember = z.infer<typeof TripMemberSchema>

/** Everyone on the trip, the organizer included. Empty when they can't be loaded. */
export async function getTripMembers(tripId: string, signedInUser: SignedInUser): Promise<TripMember[]> {
    const status = await getRequest(`/member/trip/${tripId}`, signedInUser)
    const validationResult = TripMemberSchema.array().safeParse(status.data)
    return validationResult.success ? validationResult.data : []
}


// ── attendance: the organizer's panel ──

export type Attendance = { going: number, maybe: number, notGoing: number, notResponded: number }

/**
 * Counts people, not RSVPs: each RSVP covers its adults and children. Members
 * who haven't answered count with the household size they gave when they
 * accepted the invite.
 */
export function countAttendance(rsvps: ActivityRsvp[], members: TripMember[]): Attendance {
    const people = (household: { adults: number, children: number }) => household.adults + household.children
    const total = (going: ActivityRsvp['going']) =>
        rsvps.filter((rsvp) => rsvp.going === going).reduce((sum, rsvp) => sum + people(rsvp), 0)

    const answered = new Set(rsvps.map((rsvp) => rsvp.memberId))
    const notResponded = members
        .filter((member) => !answered.has(member.id))
        .reduce((sum, member) => sum + people(member), 0)

    return {going: total('yes'), maybe: total('maybe'), notGoing: total('no'), notResponded}
}
