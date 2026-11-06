import {z} from 'zod/v4'
import {sql} from "../../utils/database.utils.ts"

export const TripInviteSchema = z.object({
    id:z.uuidv7(),
    invitedBy:z.uuidv7(),
    tripId:z.uuidv7(),
    acceptedProfileId:z.uuidv7().nullable(),
    cellNumber: z.string().max(20).nullable(),
    createdAt: z.coerce.date(),
    email:z.email().nullable(),
    expiresAt: z.coerce.date().nullable(),
    status:z.enum(['pending', 'accepted', 'declined','expired']),
    token:z.string().max(64)
})

export type TripInvite = z.infer<typeof TripInviteSchema>


export const TripInviteRequestSchema = TripInviteSchema.pick({
   tripId: true,
    email: true,
    cellNumber: true
}).partial({email:true, cellNumber:true}).refine(
    (data) => Boolean(data.email || data.cellNumber),
    { message: 'Please provide an email address or cell number.' }
)


export async function insertTripInvite (tripInvite: TripInvite): Promise<TripInvite> {
    const [row] = await sql`INSERT INTO trip_invite (
       id,
       invited_by,
       trip_id,
       accepted_profile_id,                  
       cell_number,                  
       created_at,                  
       email,
       expires_at,
       status,
       token
       )
    VALUES (
      ${tripInvite.id},
      ${tripInvite.invitedBy},
      ${tripInvite.tripId},
      ${tripInvite.acceptedProfileId},
      ${tripInvite.cellNumber},
      ${tripInvite.createdAt},
      ${tripInvite.email},
      ${tripInvite.expiresAt},
      ${tripInvite.status},
      ${tripInvite.token}
    )
    RETURNING *
  `
  return TripInviteSchema.parse(row)

}


export async function selectTripInviteByToken (token: string): Promise<TripInvite | null> {
    const rowList = await sql`
    SELECT id, invited_by, trip_id, accepted_profile_id, cell_number, created_at, email, expires_at, status, token
    FROM trip_invite
    WHERE token = ${token}
  `

    return TripInviteSchema.array().max(1).parse(rowList)[0] ?? null
}

// write the function to select trip invite by
// export async function selectTripInvitedBy (invited_by:): Promise<TripInvite > {
//     const rowList = await sql`
//         SELECT id,
//                invited_by,
//                trip_id,
//                accepted_profile_id,
//                cell_number,
//                created_at,
//                email,
//                expires_at,
//                status,
//                token
//         FROM trip_invite
//         WHERE invited_by = ${invited_by}`
// }
//
// return selectTripInvitedBy().array().max(1).parse(rowList)[0] ?? null
