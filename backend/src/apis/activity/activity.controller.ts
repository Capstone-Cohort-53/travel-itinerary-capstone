import type {Request, Response} from 'express'
import {z} from 'zod/v4'
import {v7} from 'uuid'

import {
    ActivityRequestSchema,
    type Activity,
    type ActivityRequest,
    insertActivity,
    selectActivityById,
    selectActivitiesByTripId,
    updateActivity,
    deleteActivity
} from "./activity.model.ts"

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"

import {selectTripById, selectTripDetailById} from "../trip/trip.model.ts"


export async function postActivityController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the trip id from the URL
        const paramsResult = z.object({tripId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {tripId} = paramsResult.data

        // 2. validate the body
        const bodyResult = ActivityRequestSchema.safeParse(request.body)
        if (!bodyResult.success) {
            sendZodError(request, response, bodyResult.error)
            return
        }

        // 3. the trip must exist and belong to the signed-in user
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can add activities.')
            return
        }

        // 4. build the full activity (new id from the server, defaults for anything left out) and save it
        const activity = buildActivity(v7(), tripId, bodyResult.data)
        const createdActivity = await insertActivity(activity)

        // 5. send the saved activity back
        response
            .status(201)
            .location(`/apis/trip/${tripId}/activity/${createdActivity.id}`)
            .json(createdActivity)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function getActivitiesByTripIdController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the trip id from the URL
        const paramsResult = z.object({tripId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {tripId} = paramsResult.data

        // 2. the signed-in user must own the trip or have accepted an invite to it
        //    (a trip they can't see looks the same as one that doesn't exist)
        const trip = await selectTripDetailById(tripId, request.session.profile?.id ?? '')
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }

        // 3. send the list
        const activities = await selectActivitiesByTripId(tripId)
        response.status(200).json(activities)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function getActivityByIdController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate both ids from the URL
        const paramsResult = z.object({tripId: z.uuidv7(), activityId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {tripId, activityId} = paramsResult.data

        // 2. the signed-in user must own the trip or have accepted an invite to it
        const trip = await selectTripDetailById(tripId, request.session.profile?.id ?? '')
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }

        // 3. the activity must exist AND belong to this trip, so nobody can read
        //    another trip's activity by pairing a trip id they can see with it
        const activity = await selectActivityById(activityId)
        if (activity === null || activity.tripId !== tripId) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 4. send it
        response.status(200).json(activity)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function putActivityController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate both ids from the URL
        const paramsResult = z.object({tripId: z.uuidv7(), activityId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {tripId, activityId} = paramsResult.data

        // 2. validate the body
        const bodyResult = ActivityRequestSchema.safeParse(request.body)
        if (!bodyResult.success) {
            sendZodError(request, response, bodyResult.error)
            return
        }

        // 3. the trip must exist and belong to the signed-in user
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can edit activities.')
            return
        }

        // 4. the activity must exist AND belong to this trip
        const existingActivity = await selectActivityById(activityId)
        if (existingActivity === null || existingActivity.tripId !== tripId) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 5. PUT replaces every field: anything left out of the body goes back to its default
        const activity = buildActivity(activityId, tripId, bodyResult.data)
        const updatedActivity = await updateActivity(activity)

        // 6. send the updated activity back
        response.status(200).json(updatedActivity)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function deleteActivityController(request: Request, response: Response): Promise<void> {
    try {
        // 1. validate both ids from the URL
        const paramsResult = z.object({tripId: z.uuidv7(), activityId: z.uuidv7()}).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const {tripId, activityId} = paramsResult.data

        // 2. the trip must exist and belong to the signed-in user
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can delete activities.')
            return
        }

        // 3. the activity must exist AND belong to this trip
        const activity = await selectActivityById(activityId)
        if (activity === null || activity.tripId !== tripId) {
            sendError(request, response, 404, 'Activity not found.')
            return
        }

        // 4. delete it
        await deleteActivity(activityId)
        response.status(200).json({message: 'Activity deleted.'})
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


/**
 * Turn a validated request body into a full Activity, filling in the
 * defaults for any optional field the client left out.
 * @param id the activity's id
 * @param tripId the trip the activity belongs to (from the URL)
 * @param data the validated request body
 */
function buildActivity(id: string, tripId: string, data: ActivityRequest): Activity {
    return {
        id,
        tripId,
        address: data.address ?? null,
        cost: data.cost ?? 0,
        description: data.description ?? null,
        endDatetime: data.endDatetime ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        location: data.location ?? null,
        mandatory: data.mandatory ?? false,
        name: data.name,
        notes: data.notes ?? null,
        startDatetime: data.startDatetime ?? null
    }
}
