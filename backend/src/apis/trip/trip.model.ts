import {z} from "zod/v4";
import {sql} from "../../utils/database.utils.ts";

export const TripSchema =
    z.object({
        id: z
            .uuidv7('please provide a valid uuid for trip'),
        ownerId: z
            .uuidv7('please provide a valid uuid for trip'),
        description: z
            .string('please provide a valid cellNumber')
            .max(20,'please provide 20 characters').nullable(),
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

/**
 * Insert a trip object into the database
 */

export async function insertTrip(trip:Trip) {
        //final check to make sure we have a full trip object before inserting it into the database
        //sql call to insert the tag into the database
        const{id,ownerId,title, description, destination, startDate, endDate, createdAt, image} = TripSchema.parse(trip)
        const[row] = await sql`INSERT INTO trip (id, owner_id, title, description, destination, start_date, end_date, image, created_at)
        VALUES(${id}, ${ownerId}, ${title}, ${description}, ${destination}, ${startDate}, ${endDate}, ${image}, now()) 
        RETURNING id, owner_id, title, description, destination, start_date, end_date, created_at, image`
//parse the inserted trip object and return it so that the information can be displayed to the end user
        return TripSchema.parse(row)
}



/**
 * select a trip by its id
 * @param id
 */
export async function selectTripById(id:string):
Promise<Trip|null> {
        const rowList= await sql `SELECT id, owner_id, title, description, destination, start_date, end_date, image, created_at FROM trip WHERE id=${id} `
        const result = TripSchema.array().max(1).parse(rowList)
        return result[0] ?? null
}

/**
 *Endpoint: GET "List a trip I own or belong to" - what the GET translates to in SQL :SELECT
 */

export async function selectTripsByProfileId(profileId: string) {
        //sql call to get the trip by profile from  the database
        const rowList = await sql`
        SELECT DISTINCT trip.id, trip.owner_id, trip.title, trip.description, trip.destination, trip.start_date, trip.end_date, trip.image, trip.created_at
        FROM trip
        LEFT JOIN member ON member.trip_id = trip.id
        LEFT JOIN trip_invite ON trip_invite.id = member.invite_id
        WHERE trip.owner_id =${profileId}
            OR trip_invite.accepted_profile_id = ${profileId}
            ORDER BY trip.start_date`
        return TripSchema.array().parse(rowList)
//parse the inserted trip object and return it so that the information can be displayed to the end user
}

/**
 *Endpoint: GET "View the details of a single trip" -
 * Returns the trip only if the profile owns it or has accepted an invite to it
 * what the GET translates to in SQL :SELECT
 */

export async function selectTripDetailById(tripId: string, profileId:string) {
        //sql call to get the trip by profile from  the database
        const rowList = await sql`
        SELECT DISTINCT trip.id, trip.owner_id, trip.title, trip.description, trip.destination, trip.start_date, trip.end_date, trip.image, trip.created_at
        FROM trip
        LEFT JOIN member ON member.trip_id = trip.id
        LEFT JOIN trip_invite ON trip_invite.id = member.invite_id
        WHERE trip.id =${tripId}
            AND (trip.owner_id = ${profileId} OR trip_invite.accepted_profile_id=${profileId})`
        const result = TripSchema.array().max(1).parse(rowList)
        return result [0] ?? null

}

/**
 * Endpoint: DELTE "Delete the trip by Id, only if the profile is the owner."
 */

export async function deleteTrip(tripId: string, profileId:string) {
        //sql call to get the trip by profile from  the database
        const rowList = await sql`
        DELETE FROM trip
        WHERE id =${tripId}  AND owner_id = ${profileId}`

        return 'successfully deleted trip'
}
