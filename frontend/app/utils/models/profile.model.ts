import {z} from "zod";

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
export type Profile = z.infer<typeof ProfileSchema>
