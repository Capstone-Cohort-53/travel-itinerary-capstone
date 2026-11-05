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
        const{id,ownerId,title, description, destination, startDate, endDate, createdAt} = TripSchema.parse(trip)
        const[row] = await sql`INSERT INTO trip (SELECT owner_id, title, description, destination, start_date, end_date,  
        FROM trip) 
        VALUES(${id}, ${ownerId}, ${title}, ${description}, ${destination}, ${startDate}, ${endDate}, now()) 
        RETURNING id, owner_id, title, description, destination, start_date, end_date, created_at`
//parse the inserted trip object and return it so that the information can be displayed to the end user
        return TripSchema.parse(row)
}


/**
 * select a trip by its id
 * @param id
 */
export async function selectTripbyTripId(id:string):
Promise<Trip|null> {
        const rowList= await sql `SELECT id, name FROM trip WHERE id=?`
        const result =TripSchema.array().max(1).
        parse(rowList)
        return result[0] ?? null
}