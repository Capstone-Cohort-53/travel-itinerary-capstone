import {z} from "zod/v4";
import {sql} from "../../utils/database.utils.ts";


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

export const MemberRequestSchema = MemberSchema.omit({role:true}).extend({token:z.string().length(64)})

export type MemberRequest = z.infer<typeof MemberRequestSchema>

export async function insertMember (member: Member): Promise<Member>  {
    MemberSchema.parse(member)
    const { id, inviteId, tripId, adults, children, going, role } = member
    const [row] = await sql`INSERT INTO member (id, invite_id, trip_id, adults, children, going, role) VALUES (${id}, ${inviteId}, ${tripId}, ${adults}, ${children}, ${going}, ${role}) RETURNING id, invite_id, trip_id, adults, children, going, role`
    return MemberSchema.parse(row)
}

export const MemberWithProfileSchema = MemberSchema.extend({
    profileId: z.uuidv7().nullable(),
    name: z.string(),
    image: z.string().nullable()
})

export type MemberWithProfile = z.infer<typeof MemberWithProfileSchema>

export async function selectMembersByTripId(tripId: string): Promise<MemberWithProfile[]> {
    const rowList = await sql`
        SELECT member.id, member.invite_id, member.trip_id, member.adults, member.children, member.going, member.role,
               trip_invite.accepted_profile_id AS profile_id,
               COALESCE(profile.name, trip_invite.name) AS name,
               profile.image
        FROM member
            JOIN trip_invite ON member.invite_id = trip_invite.id
            LEFT JOIN profile ON trip_invite.accepted_profile_id = profile.id
        WHERE member.trip_id = ${tripId}
        ORDER BY member.role DESC, name`
    return MemberWithProfileSchema.array().parse(rowList)
}

export async function selectMemberById(id: string): Promise<Member | null> {
    const rowList = await sql`
        SELECT id, invite_id, trip_id, adults, children, going, role FROM member WHERE id = ${id}`
    return MemberSchema.array().max(1).parse(rowList)[0] ?? null
}

export async function deleteMember(id: string): Promise<void> {
    await sql`DELETE FROM member WHERE id = ${id}`
}

















// export type Profile = z.infer<typeof ProfileSchema>;
//
// export async function insertProfile (profile: Profile): Promise<Profile>{
//     ProfileSchema.parse(profile)
//     const {id,cellNumber, createdAt, email, name, image} = profile
//     const [row]= await sql`
//    insert into profile(id, cell_number, created_at, email, name, image)
//    values (${id}, ${cellNumber}, ${createdAt}, ${email}, ${name}, ${image})
//    returning id, cell_number, created_at, email, name, image`
//     return ProfileSchema.parse(row)
// }
//
// export async function selectProfileByProfileEmail (email: string): Promise<Profile | null> {
//     const rowList = await sql`
//     select id, cell_number, created_at, email, name, image from profile where email=${email}`
//     const result = ProfileSchema.array().max(1).parse(rowList)
//     return result [0] ?? null
// }
//
// export async function selectProfileByProfileId (id: string): Promise<Profile | null> {
//     const rowList = await sql`
//     SELECT id, cell_number, created_at, email, name, image
//     FROM profile WHERE id = ${id}`
//     const result = ProfileSchema.array().max(1).parse(rowList)
//     return result [0] ?? null
// }
