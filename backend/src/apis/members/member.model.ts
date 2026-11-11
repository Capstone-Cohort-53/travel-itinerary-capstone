import {z} from "zod/v4";
import {sql} from "../../utils/database.utils.ts";
import {TripInviteSchema} from "../trip-invite/trip-invite.model.ts";


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

export const MemberRequestSchema = MemberSchema.extend ({token:z.string().length(64)})

export type MemberRequest = z.infer<typeof MemberRequestSchema>

export async function insertMember (member: Member): Promise<Member>  {
    const { id, inviteId, tripId, adults, children, going, role } = member
    const [row] = await sql`INSERT INTO member (id, invite_id, trip_id, adults, children, going, role) VALUES (${id}, ${inviteId}, ${tripId}, ${adults}, ${children}, ${going}, ${role}) RETURNING id, invite_id, trip_id, adults, children, going, role`
    return MemberSchema.parse(row)
}

//
// export async function selectMemberById(memberId: string): Promise<Member | null> {
//     // Replace with your actual database connection pool logic
//     // const result = await sql`SELECT * FROM members WHERE member_id = ${memberId}`;
//     // return result[0] ?? null;
//
//     return {
//         memberId,
//         email: 'user@example.com',
//         firstName: 'Alex',
//         lastName: 'Rivera',
//         createdAt: new Date(),
//     };
// }
















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
