import {z} from "zod";
import {MemberSchema} from "~/utils/models/member.model";
import {ProfileSchema} from "~/utils/models/profile.model";
import type {SignedInUser} from "~/utils/session.server";
import {getRequest} from "~/utils/request.utils";

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
