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
   returning id, cell_number, profile.created_at, email, name, image`
    return ProfileSchema.parse(row)
    }

export async function selectProfileByProfileEmail (email: string): Promise<Profile | null> {
    const rowList = await sql`
    select id, cell_number, created_at, email, name, image from profile where email=${email}`
    const result = ProfileSchema.array().max(1).parse(rowList)
    return result [0] ?? null
}



