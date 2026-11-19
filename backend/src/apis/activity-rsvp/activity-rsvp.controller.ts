import type {Request, Response} from 'express'
import {z} from 'zod/v4'
import {v7} from 'uuid'

import {
    ActivityRsvpRequestSchema,
    type ActivityRsvp,
    upsertActivityRsvp,
    selectActivityRsvpByActivityIdAndMemberId,
    selectActivityRsvpsByActivityId,
    deleteActivityRsvp
} from "./activity-rsvp.model.ts"

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"

import {selectActivityById} from "../activity/activity.model.ts"
import {selectTripDetailById} from "../trip/trip.model.ts"
import {selectMembersByTripId, type MemberWithProfile} from "../members/member.model.ts"


export async function getActivityRsvpsController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the activity id from the URL
        const paramsResult = z.object({activityId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {activityId} = paramsResult.data

        // 2. the activity must exist (its row tells us which trip it belongs to)
        const activity = await selectActivityById(activityId)
        if (activity === null) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 3. the signed-in user must own the activity's trip or have accepted an invite to it
        //    (an activity they can't see looks the same as one that doesn't exist)
        const trip = await selectTripDetailById(activity.tripId, request.session.profile?.id ?? '')
        if (trip === null) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 4. send everyone's responses, with names
        const rsvps = await selectActivityRsvpsByActivityId(activityId)
        response.status(200).json(rsvps)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function postActivityRsvpController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the activity id from the URL
        const paramsResult = z.object({activityId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {activityId} = paramsResult.data

        // 2. validate the body
        const bodyResult = ActivityRsvpRequestSchema.safeParse(request.body)
        if (!bodyResult.success) {
            sendZodError(request, response, bodyResult.error)
            return
        }

        // 3. the activity must exist
        const activity = await selectActivityById(activityId)
        if (activity === null) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 4. the signed-in user must be able to see the activity's trip
        const profileId = request.session.profile?.id ?? ''
        const trip = await selectTripDetailById(activity.tripId, profileId)
        if (trip === null) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 5. find the signed-in user's member row for that trip; RSVPs belong to a member
        const member = await findMyMember(activity.tripId, profileId)
        if (member === undefined) {
            sendError(request, response, 403, 'You must be a member of this trip to RSVP.')
            return
        }

        // 6. have they already answered? (decides 201 vs 200, and keeps the original id)
        const existingRsvp = await selectActivityRsvpByActivityIdAndMemberId(activityId, member.id)

        // 7. build the full RSVP with defaults for anything left out, then create or replace it
        const {data} = bodyResult
        const rsvp: ActivityRsvp = {
            id: existingRsvp?.id ?? v7(),
            activityId,
            memberId: member.id,
            adults: data.adults ?? 1,
            children: data.children ?? 0,
            going: data.going ?? 'maybe'
        }
        const savedRsvp = await upsertActivityRsvp(rsvp)

        // 8. 201 the first time they answer, 200 when they change their answer
        response
            .status(existingRsvp === null ? 201 : 200)
            .location(`/apis/activity/${activityId}/rsvp`)
            .json(savedRsvp)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function deleteActivityRsvpController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the activity id from the URL
        const paramsResult = z.object({activityId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {activityId} = paramsResult.data

        // 2. the activity must exist
        const activity = await selectActivityById(activityId)
        if (activity === null) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 3. the signed-in user must be able to see the activity's trip
        const profileId = request.session.profile?.id ?? ''
        const trip = await selectTripDetailById(activity.tripId, profileId)
        if (trip === null) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 4. find the signed-in user's member row for that trip
        const member = await findMyMember(activity.tripId, profileId)
        if (member === undefined) {
            sendError(request, response, 403, 'You must be a member of this trip to RSVP.')
            return
        }

        // 5. they can only clear their own response, and only if they have one
        const rsvp = await selectActivityRsvpByActivityIdAndMemberId(activityId, member.id)
        if (rsvp === null) {
            sendError(request, response, 404, 'You have not responded to this activity.')
            return
        }

        // 6. clear it; they're back to unanswered
        await deleteActivityRsvp(rsvp.id)
        response.status(200).json({message: 'RSVP cleared.'})
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


/**
 * Find the signed-in user's member row for a trip.
 * member has no profile id of its own, so this uses selectMembersByTripId
 * (member.model.ts), which links each member to a profile through trip_invite,
 * and picks out the one whose profileId matches.
 * @param tripId the trip
 * @param profileId the signed-in user's profile id
 * @returns their member row, or undefined if they don't have one
 */
async function findMyMember(tripId: string, profileId: string): Promise<MemberWithProfile | undefined> {
    const members = await selectMembersByTripId(tripId)
    return members.find(member => member.profileId === profileId)
}
