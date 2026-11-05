import type { Request, Response } from 'express'
import { z } from 'zod/v4'

import {
    TripInviteRequestSchema,
    insertTripInvite,
    selectTripInviteByToken

} from "./trip-invite.model.ts"

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"

import {isUniqueViolation} from "../../utils/database.utils.ts"



export async function postTripInviteController(
    request: Request,
    response: Response
): Promise<void> {
    try {

        const validationResult = TripInviteRequestSchema.safeParse(request.body)

        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }
        const tripIdResult = z.uuidv7().safeParse(request.params.tripId)

        if (!tripIdResult.success) {
            sendZodError(request, response, tripIdResult.error)
            return
        }
        const profileId = request.session.profile?.id

        if (!profileId) {
            sendError(request, response, 401, 'You must be logged in to invite someone to a trip.')
            return
        }



    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}
