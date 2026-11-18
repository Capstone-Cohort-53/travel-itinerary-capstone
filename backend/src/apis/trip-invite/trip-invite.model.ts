import {z} from 'zod/v4'
import {sql} from "../../utils/database.utils.ts"
import {token} from "morgan";
import {MemberSchema} from "../members/member.model.ts";
import {ProfileSchema} from "../profile/profile.model.ts";

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


export const TripInviteRequestSchema = TripInviteSchema.pick({

    id: true,
    tripId: true,

    name: true,
    email: true,
    cellNumber: true,
    expiresAt: true
}).partial({email: true, cellNumber: true}).refine(
    (data) => Boolean(data.email || data.cellNumber),
    {message: 'Please provide an email address or cell number.'}
)
export const TripTravelerSchema = z.object({
    invite: TripInviteSchema.omit({token: true}),
    member: MemberSchema.nullable(),
    profile: ProfileSchema.nullable(),
})

export type TripTraveler = z.infer<typeof TripTravelerSchema>
// these all need to be in ABC order
export async function insertTripInvite(tripInvite: TripInvite): Promise<TripInvite> {
    TripInviteSchema.parse(tripInvite)
    const [row] = await sql`INSERT INTO trip_invite (id,
                                                     invited_by,
                                                     trip_id,
                                                     name,
                                                     accepted_profile_id,
                                                     cell_number,
                                                     created_at,
                                                     email,
                                                     expires_at,
                                                     status,
                                                     token)
                            VALUES (${tripInvite.id},
                                    ${tripInvite.invitedBy},
                                    ${tripInvite.tripId},
                                    ${tripInvite.name},
                                    ${tripInvite.acceptedProfileId},
                                    ${tripInvite.cellNumber},
                                    NOW(),
                                    ${tripInvite.email},
                                    ${tripInvite.expiresAt},
                                    ${tripInvite.status},
                                    ${tripInvite.token})
                            RETURNING id, invited_by, trip_id, name, accepted_profile_id, cell_number, created_at, email, expires_at, status, token`
    return TripInviteSchema.parse(row)

}


export async function selectTripInviteByToken(token: string): Promise<TripInvite | null> {
    const rowList = await sql`

        SELECT id,
               invited_by,
               trip_id,
               accepted_profile_id,
               cell_number,
               created_at,
               email,
               name,
               expires_at,
               status,
               token
        FROM trip_invite
        WHERE token = ${token}`
    return TripInviteSchema.array().max(1).parse(rowList)[0] ?? null
}


export async function updateTripInvite(tripInvite: TripInvite): Promise<TripInvite> {
    TripInviteSchema.parse(tripInvite)
    const {
        id,
        acceptedProfileId,
        status,
        token
    } = tripInvite
    const [row] = await sql`UPDATE trip_invite
                            SET accepted_profile_id = ${acceptedProfileId},
                                status              = ${status},
                                token               = ${token}
                            WHERE id = ${id}
                            RETURNING id, invited_by, trip_id, name, accepted_profile_id, cell_number, created_at, email, expires_at, status,token`
    return TripInviteSchema.parse(row)
    }

// an invite without its secret token: safe to show the trip owner in a list
export const TripInviteSummarySchema = TripInviteSchema.omit({ token: true })
export type TripInviteSummary = z.infer<typeof TripInviteSummarySchema>

/**
 * Select every invitation for a trip, newest first (token left out on purpose).
 * @param tripId the trip whose invitations to list
 */
export async function selectTripInvitesByTripId (tripId: string): Promise<TripInviteSummary[]> {
    const rowList = await sql`
    SELECT id, invited_by, trip_id, name, accepted_profile_id, cell_number, created_at, email, expires_at, status
    FROM trip_invite
    WHERE trip_id = ${tripId}
    ORDER BY created_at DESC
  `
    return TripInviteSummarySchema.array().parse(rowList)
}

/**
 * Select a single invitation by its id.
 * @param id the invitation's id
 */
export async function selectTripInviteById (id: string): Promise<TripInvite | null> {
    const rowList = await sql`
    SELECT id, invited_by, trip_id, name, accepted_profile_id, cell_number, created_at, email, expires_at, status, token
    FROM trip_invite
    WHERE id = ${id}
  `
    return TripInviteSchema.array().max(1).parse(rowList)[0] ?? null
}

/**
 * Delete (revoke) an invitation by its id.
 * @param id the invitation's id
 */
export async function deleteTripInvite (id: string): Promise<void> {
    await sql`DELETE FROM trip_invite WHERE id = ${id}`

}

export async function selectKitchenSinkByTripId(tripId: string): Promise<TripTraveler[]> {
    const rowList = await sql`
    SELECT
        json_build_object(
            'id', trip_invite.id,
            'invitedBy', trip_invite.invited_by,
            'tripId', trip_invite.trip_id,
            'acceptedProfileId', trip_invite.accepted_profile_id,
            'name', trip_invite.name,
            'cellNumber', trip_invite.cell_number,
            'createdAt', trip_invite.created_at,
            'email', trip_invite.email,
            'expiresAt', trip_invite.expires_at,
            'status', trip_invite.status
        ) AS invite,
        CASE WHEN member.id IS NULL THEN NULL ELSE json_build_object(
            'id', member.id,
            'inviteId', member.invite_id,
            'tripId', member.trip_id,
            'adults', member.adults,
            'children', member.children,
            'going', member.going,
            'role', member.role
        ) END AS member,
        CASE WHEN profile.id IS NULL THEN NULL ELSE json_build_object(
            'id', profile.id,
            'cellNumber', profile.cell_number,
            'createdAt', profile.created_at,
            'email', profile.email,
            'name', profile.name,
            'image', profile.image
        ) END AS profile
    FROM trip_invite
    LEFT JOIN member ON member.invite_id = trip_invite.id
    LEFT JOIN profile ON profile.id = trip_invite.accepted_profile_id
    WHERE trip_invite.trip_id = ${tripId}
    ORDER BY member.role DESC NULLS LAST, trip_invite.created_at`
    return TripTravelerSchema.array().parse(rowList)
}