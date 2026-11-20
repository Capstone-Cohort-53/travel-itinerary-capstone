import {z} from 'zod/v4'
import {sql} from "../../utils/database.utils.ts"

// One activity_rsvp row, matching the activity_rsvp table in sql/project.sql.
// The limits match the table: adults and children are whole numbers, 0 or more.
export const ActivityRsvpSchema = z.object({
    id: z.uuidv7('please provide a valid uuid for rsvp'),
    activityId: z.uuidv7('please provide a valid uuid for activity'),
    memberId: z.uuidv7('please provide a valid uuid for member'),
    adults: z.int('adults must be a whole number')
        .min(0, 'adults cannot be negative'),
    children: z.int('children must be a whole number')
        .min(0, 'children cannot be negative'),
    going: z.enum(['yes', 'no', 'maybe'], 'going must be yes, no, or maybe')
})

export type ActivityRsvp = z.infer<typeof ActivityRsvpSchema>


// What the client sends for POST.
// id is made by the server, activityId comes from the URL, and memberId is looked up
// from the signed-in user, so none of those are in the body.
// Everything is optional; the controller fills in the defaults (going 'maybe', adults 1, children 0).
export const ActivityRsvpRequestSchema = ActivityRsvpSchema.pick({
    adults: true,
    children: true,
    going: true
}).partial()

export type ActivityRsvpRequest = z.infer<typeof ActivityRsvpRequestSchema>


// An RSVP plus the name of the person who sent it, for the GET list.
export const ActivityRsvpWithNameSchema = ActivityRsvpSchema.extend({
    name: z.string()
})

export type ActivityRsvpWithName = z.infer<typeof ActivityRsvpWithNameSchema>


/**
 * Create an RSVP, or replace it if this member already answered for this activity.
 * The table's unique (activity_id, member_id) rule is what makes "replace" work:
 * if a row already exists, ON CONFLICT updates it instead of adding a second one,
 * and the existing row keeps its original id.
 * @param rsvp the full RSVP to save
 */
export async function upsertActivityRsvp(rsvp: ActivityRsvp): Promise<ActivityRsvp> {
    const {id, activityId, memberId, adults, children, going} = ActivityRsvpSchema.parse(rsvp)
    const [row] = await sql`INSERT INTO activity_rsvp (id,
                                                       activity_id,
                                                       member_id,
                                                       adults,
                                                       children,
                                                       going)
                            VALUES (${id},
                                    ${activityId},
                                    ${memberId},
                                    ${adults},
                                    ${children},
                                    ${going})
                            ON CONFLICT (activity_id, member_id) DO UPDATE
                                SET adults   = EXCLUDED.adults,
                                    children = EXCLUDED.children,
                                    going    = EXCLUDED.going
                            RETURNING id, activity_id, member_id, adults, children, going`
    return ActivityRsvpSchema.parse(row)
}


/**
 * Select one member's RSVP for one activity.
 * @param activityId the activity
 * @param memberId the member who answered
 */
export async function selectActivityRsvpByActivityIdAndMemberId(activityId: string, memberId: string): Promise<ActivityRsvp | null> {
    const rowList = await sql`
        SELECT id, activity_id, member_id, adults, children, going
        FROM activity_rsvp
        WHERE activity_id = ${activityId}
          AND member_id = ${memberId}`
    return ActivityRsvpSchema.array().max(1).parse(rowList)[0] ?? null
}


/**
 * Select every RSVP for an activity, with the name of each person, sorted by name.
 * The name is the profile name, or the invite name if there's no profile
 * (the same rule as selectMembersByTripId in member.model.ts).
 * @param activityId the activity whose RSVPs to list
 */
export async function selectActivityRsvpsByActivityId(activityId: string): Promise<ActivityRsvpWithName[]> {
    const rowList = await sql`
        SELECT activity_rsvp.id,
               activity_rsvp.activity_id,
               activity_rsvp.member_id,
               activity_rsvp.adults,
               activity_rsvp.children,
               activity_rsvp.going,
               COALESCE(profile.name, trip_invite.name) AS name
        FROM activity_rsvp
            JOIN member ON activity_rsvp.member_id = member.id
            JOIN trip_invite ON member.invite_id = trip_invite.id
            LEFT JOIN profile ON trip_invite.accepted_profile_id = profile.id
        WHERE activity_rsvp.activity_id = ${activityId}
        ORDER BY name`
    return ActivityRsvpWithNameSchema.array().parse(rowList)
}


/**
 * Delete an RSVP by its id.
 * @param id the RSVP's id
 */
export async function deleteActivityRsvp(id: string): Promise<void> {
    await sql`DELETE FROM activity_rsvp WHERE id = ${id}`
}
