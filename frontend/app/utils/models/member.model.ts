import z from "zod"
import type {SignedInUser} from "~/utils/session.server";
import {postRequest} from "~/utils/request.utils";
import type {Status} from "~/utils/interfaces/Status";

export const MemberSchema =
    z.object({
        id: z.uuidv7('please provide a valid uuid for id'),
        inviteId: z.uuidv7('please provide a valid uuid'),
        tripId: z.uuidv7('please provide a valid uuid'),
        adults: z.int ('must be positive integer') .min(1, 'must be positive integer') .max(100, 'must be 100 or less'),
        children: z.int ('must be whole number') .min(0, 'must be whole number') .max(10, 'must be whole number'),
        going: z.enum(['yes', 'no', 'maybe']),
        role: z.enum(['owner', 'member'])
    })

export type Member = z.infer<typeof MemberSchema>


/**
 * The accept-invitation RSVP form. z.coerce turns the number inputs' strings
 * into numbers, so the same schema validates TanStack Form in the browser and
 * the FormData strings in the route action.
 */
export const AcceptInviteFormSchema = z.object({
    going: MemberSchema.shape.going,
    adults: z.coerce.number<string>('Please enter the number of adults.')
        .int('Please enter a whole number.')
        .min(1, 'At least 1 adult is required.')
        .max(100, 'Must be 100 or fewer.'),
    children: z.coerce.number<string>('Please enter the number of children.')
        .int('Please enter a whole number.')
        .min(0, 'Cannot be negative.')
        .max(10, 'Must be 10 or fewer.'),
})
export type AcceptInviteForm = z.infer<typeof AcceptInviteFormSchema>

/** The body POST /member expects: the RSVP plus the invite's secret token. */
export type MemberRequest = AcceptInviteForm & { token: string }

/** Accepts (or declines) an invitation by creating the signed-in user's member row. */
export async function postMember(body: MemberRequest, signedInUser: SignedInUser): Promise<Status> {
    return postRequest('/member', body, signedInUser)
}
