import {z} from "zod";
import {MemberSchema} from "~/utils/models/member.model";
import {ProfileSchema} from "~/utils/models/profile.model";
import type {SignedInUser} from "~/utils/session.server";
import {getRequest, postRequest} from "~/utils/request.utils";
import type {Status} from "~/utils/interfaces/Status";
import {TripSchema} from "~/utils/models/trip.model";

export const TripInviteSchema = z.object({
    id: z.uuidv7(),
    invitedBy: z.uuidv7(),
    tripId: z.uuidv7(),
    acceptedProfileId: z.uuidv7().nullable(),
    name: z.string('please provide a valid name'),
    cellNumber: z.string().max(20).nullable(),
    createdAt: z.coerce.date('Please provide a valid created at').nullable(),
    email: z.email().nullable(),
    expiresAt: z.coerce.date().nullable(),
    status: z.enum(['pending', 'accepted', 'declined', 'expired']),
    token: z.string().length(64)
})

export type TripInvite = z.infer<typeof TripInviteSchema>


export const TripTravelerSchema = z.object({
    invite: TripInviteSchema.omit({token: true}),
    member: MemberSchema.nullable(),
    profile: ProfileSchema.nullable(),
})
export type TripTraveler = z.infer<typeof TripTravelerSchema>
export async function getTripInviteKitchenSink(tripId: string, signedInUser: SignedInUser): Promise<TripTraveler []>{
    const status = await getRequest(`/trip/${tripId}/invite/kitchen-sink`, signedInUser)
    const validationResult= TripTravelerSchema.array().safeParse(status.data)
    return validationResult.success ? validationResult.data : []
}


/**
 * What the invite form's inputs hold. Every input is a string, and an empty
 * string means "not provided". Used by TanStack Form in the browser and again
 * by the route action on the server.
 */
export const TripInviteFormSchema = z.object({
    name: z.string().trim().min(1, 'Please enter a name.').max(64, 'Name must be 64 characters or fewer.'),
    email: z.union([z.literal(''), z.email('Please enter a valid email.').max(255, 'Email is too long.')]),
    cellNumber: z.string().trim().max(20, 'Cell number must be 20 characters or fewer.'),
    expiresAt: z.union([z.literal(''), z.iso.date('Please pick a valid date.')]),
}).refine(
    (data) => data.email !== '' || data.cellNumber !== '',
    {message: 'Please provide an email or a cell number.', path: ['email']},
)
export type TripInviteForm = z.infer<typeof TripInviteFormSchema>

/** The body POST /trip/:tripId/invite expects. */
export type TripInviteRequest = {
    name: string,
    email?: string,
    cellNumber?: string,
    expiresAt: string | null,
}

export async function postTripInvite(tripId: string, body: TripInviteRequest, signedInUser: SignedInUser): Promise<Status> {
    return postRequest(`/trip/${tripId}/invite`, body, signedInUser)
}


/**
 * What the public GET /trip-invite/:token endpoint returns: only what the
 * accept-invitation page needs (no email, phone, token, or ids).
 */
export const InvitationPreviewSchema = z.object({
    inviteeName: z.string(),
    organizerName: z.string(),
    status: z.enum(['pending', 'accepted', 'declined', 'expired']),
    expiresAt: z.coerce.date().nullable(),
    trip: TripSchema.pick({title: true, destination: true, startDate: true, endDate: true, image: true}),
})
export type InvitationPreview = z.infer<typeof InvitationPreviewSchema>

/** Looks up an invitation by its secret token. Public: no signed-in user needed. */
export async function getTripInviteByToken(token: string): Promise<InvitationPreview | null> {
    const status = await getRequest(`/trip-invite/${token}`)
    const validationResult = InvitationPreviewSchema.safeParse(status.data)
    return validationResult.success ? validationResult.data : null
}
