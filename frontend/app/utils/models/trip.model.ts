import {z} from 'zod'
import {getRequest} from "~/utils/request.utils";
import type {SignedInUser} from "~/utils/session.server";

export const TripSchema =
    z.object({
        id: z
            .uuidv7('please provide a valid uuid for trip'),
        ownerId: z
            .uuidv7('please provide a valid uuid for trip'),
        description: z
            .string('please provide a valid cellNumber')
            .max(40,'please provide 20 characters').nullable(),
        createdAt: z
            .coerce.date('please provide a valid created at').nullable(),
        title:z
            .string('please provide a valid title')
            .max(255,'please provide a valid name (255 characters)'),
        image: z
            .url('please provide a valid image')
            .max(255,'please provide a valid image (255 characters)'),
        destination: z
            .string('please provide a valid destination')
            .max(255,'please provide a valid destination (255 characters)'),

        startDate:z
            .coerce.date('please provide a valid startDate'),

        endDate:z
            .coerce.date('please provide a valid endDate'),    })
export type Trip = z.infer<typeof TripSchema>;

export async function getTripByTripId(tripId: string, signedInUser:SignedInUser): Promise<Trip | null> {
    const status = await getRequest(`/trip/${tripId}`, signedInUser);
    const validationResult = TripSchema.safeParse(status.data)
    return validationResult.success ? validationResult.data : null
//
}