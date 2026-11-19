import z from "zod"

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
