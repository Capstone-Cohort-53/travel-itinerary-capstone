import {z} from 'zod/v4'
import {sql} from "../../utils/database.utils.ts"

// One activity row, matching the activity table in sql/project.sql.
// cost, lat and lng are numeric columns, which Postgres sends back as strings ("12.50"),
// so z.coerce.number() turns them into real numbers.
export const ActivitySchema = z.object({
    id: z.uuidv7('please provide a valid uuid for activity'),
    tripId: z.uuidv7('please provide a valid uuid for trip'),
    address: z.string('please provide a valid address')
        .max(255, 'please provide a valid address (255 characters)')
        .nullable(),
    cost: z.coerce.number('please provide a valid cost')
        .min(0, 'cost cannot be negative'),
    description: z.string('please provide a valid description').nullable(),
    endDatetime: z.coerce.date('please provide a valid end date and time').nullable(),
    lat: z.coerce.number('please provide a valid latitude')
        .min(-90, 'latitude must be between -90 and 90')
        .max(90, 'latitude must be between -90 and 90')
        .nullable(),
    lng: z.coerce.number('please provide a valid longitude')
        .min(-180, 'longitude must be between -180 and 180')
        .max(180, 'longitude must be between -180 and 180')
        .nullable(),
    location: z.string('please provide a valid location')
        .max(255, 'please provide a valid location (255 characters)')
        .nullable(),
    mandatory: z.boolean('mandatory must be true or false'),
    name: z.string('please provide a valid name')
        .min(1, 'please provide a name')
        .max(255, 'please provide a valid name (255 characters)'),
    notes: z.string('please provide valid notes').nullable(),
    startDatetime: z.coerce.date('please provide a valid start date and time').nullable()
})

export type Activity = z.infer<typeof ActivitySchema>


// What the client sends for POST and PUT.
// id is made by the server and tripId comes from the URL, so neither is in the body.
// Only name is required; everything else can be left out.
export const ActivityRequestSchema = ActivitySchema.omit({
    id: true,
    tripId: true
}).partial({
    address: true,
    cost: true,
    description: true,
    endDatetime: true,
    lat: true,
    lng: true,
    location: true,
    mandatory: true,
    notes: true,
    startDatetime: true
}).refine(
    // same rule as the database: an activity can't end before it starts
    (data) => !data.startDatetime || !data.endDatetime || data.endDatetime >= data.startDatetime,
    {message: 'End date and time cannot be before the start date and time.', path: ['endDatetime']}
)

export type ActivityRequest = z.infer<typeof ActivityRequestSchema>


/**
 * Insert a new activity into the database.
 * @param activity the full activity to save
 */
export async function insertActivity(activity: Activity): Promise<Activity> {
    const {id, tripId, address, cost, description, endDatetime, lat, lng, location, mandatory, name, notes, startDatetime} = ActivitySchema.parse(activity)
    const [row] = await sql`INSERT INTO activity (id,
                                                  trip_id,
                                                  address,
                                                  cost,
                                                  description,
                                                  end_datetime,
                                                  lat,
                                                  lng,
                                                  location,
                                                  mandatory,
                                                  name,
                                                  notes,
                                                  start_datetime)
                            VALUES (${id},
                                    ${tripId},
                                    ${address},
                                    ${cost},
                                    ${description},
                                    ${endDatetime},
                                    ${lat},
                                    ${lng},
                                    ${location},
                                    ${mandatory},
                                    ${name},
                                    ${notes},
                                    ${startDatetime})
                            RETURNING id, trip_id, address, cost, description, end_datetime, lat, lng, location, mandatory, name, notes, start_datetime`
    return ActivitySchema.parse(row)
}


/**
 * Select a single activity by its id.
 * @param id the activity's id
 */
export async function selectActivityById(id: string): Promise<Activity | null> {
    const rowList = await sql`
        SELECT id, trip_id, address, cost, description, end_datetime, lat, lng, location, mandatory, name, notes, start_datetime
        FROM activity
        WHERE id = ${id}`
    return ActivitySchema.array().max(1).parse(rowList)[0] ?? null
}


/**
 * Select every activity for a trip, earliest first (activities with no start time go last).
 * @param tripId the trip whose activities to list
 */
export async function selectActivitiesByTripId(tripId: string): Promise<Activity[]> {
    const rowList = await sql`
        SELECT id, trip_id, address, cost, description, end_datetime, lat, lng, location, mandatory, name, notes, start_datetime
        FROM activity
        WHERE trip_id = ${tripId}
        ORDER BY start_datetime NULLS LAST, name`
    return ActivitySchema.array().parse(rowList)
}


/**
 * Update an activity. Every field except id and trip_id is replaced.
 * @param activity the activity with its new values
 */
export async function updateActivity(activity: Activity): Promise<Activity> {
    const {id, address, cost, description, endDatetime, lat, lng, location, mandatory, name, notes, startDatetime} = ActivitySchema.parse(activity)
    const [row] = await sql`UPDATE activity
                            SET address        = ${address},
                                cost           = ${cost},
                                description    = ${description},
                                end_datetime   = ${endDatetime},
                                lat            = ${lat},
                                lng            = ${lng},
                                location       = ${location},
                                mandatory      = ${mandatory},
                                name           = ${name},
                                notes          = ${notes},
                                start_datetime = ${startDatetime}
                            WHERE id = ${id}
                            RETURNING id, trip_id, address, cost, description, end_datetime, lat, lng, location, mandatory, name, notes, start_datetime`
    return ActivitySchema.parse(row)
}


/**
 * Delete an activity by its id.
 * @param id the activity's id
 */
export async function deleteActivity(id: string): Promise<void> {
    await sql`DELETE FROM activity WHERE id = ${id}`
}
