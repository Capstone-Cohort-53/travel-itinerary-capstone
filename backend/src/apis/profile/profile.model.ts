import {z} from "zod/v4";
import {sql} from "../../utils/database.utils.ts";

export const ProfileSchema =
    z.object({
        id: z.uuidv7('please provide a valid uuid for id'),
        email: z
            .email('please provide a valid email')
            .max(255,'please provide a valid email (255 characters)'),
        cellNumber: z.string('please provide a valid cellNumber')
            .max(20,'please provide 20 characters').nullable(),
        createdAt: z.coerce.date('please provide a valid created at'),
        name:z.string('please provide a valid name')
            .max(255,'please provide a valid name (255 characters)'),
        image: z.url('please provide a valid image')
            .max(255,'please provide a valid image (255 characters)')
    })
export type Profile = z.infer<typeof ProfileSchema>;

export async function insertProfile (profile: Profile): Promise<Profile>{
    ProfileSchema.parse(profile)
    const {id,cellNumber, createdAt, email, name, image} = profile
    const [row]= await sql`
   insert into profile(id, cell_number, created_at, email, name, image)
   values (${id}, ${cellNumber}, ${createdAt}, ${email}, ${name}, ${image})
   returning id, cell_number, created_at, email, name, image`
    return ProfileSchema.parse(row)
}

/**
 * update the editable fields of a profile (name, image, cellNumber)
 * id, email and createdAt are never changed here
 */
export async function updateProfile (profile: Profile): Promise<Profile> {
    const {id, cellNumber, name, image} = ProfileSchema.parse(profile)
    const [row] = await sql`
    UPDATE profile SET cell_number = ${cellNumber}, name = ${name}, image = ${image}
    WHERE id = ${id}
    RETURNING id, cell_number, created_at, email, name, image`
    return ProfileSchema.parse(row)
}

export async function selectProfileByProfileEmail (email: string): Promise<Profile | null> {
    const rowList = await sql`
    select id, cell_number, created_at, email, name, image from profile where email=${email}`
    const result = ProfileSchema.array().max(1).parse(rowList)
    return result [0] ?? null
}

export async function selectProfileByProfileId (id: string): Promise<Profile | null> {
    const rowList = await sql`
    SELECT id, cell_number, created_at, email, name, image
    FROM profile WHERE id = ${id}`
    const result = ProfileSchema.array().max(1).parse(rowList)
    return result [0] ?? null
}

export async function selectProfileByProfileName (name: string): Promise<Profile | null> {
    const rowList = await sql`SELECT id, cell_number, created_at, email, name, image FROM profile WHERE name=${name}`
    const result = ProfileSchema.array().max(1).parse(rowList)
    return result [0] ?? null
}

/**
 * select the profiles of everyone who is a member of a trip
 * profile -> trip_invite (accepted_profile_id) -> member (invite_id)
 */
export async function selectProfilesByTripId (tripId: string): Promise<Profile[]> {
    const rowList = await sql`
    SELECT profile.id, profile.cell_number, profile.created_at, profile.email, profile.name, profile.image
    FROM profile
    INNER JOIN trip_invite ON trip_invite.accepted_profile_id = profile.id
    INNER JOIN member ON member.invite_id = trip_invite.id
    WHERE member.trip_id = ${tripId}`
    return ProfileSchema.array().parse(rowList)
}
