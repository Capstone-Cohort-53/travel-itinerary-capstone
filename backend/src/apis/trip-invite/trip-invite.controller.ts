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

        const profileId = request.session.profile?.id

        if (!profileId) {
            sendError(request, response, 401, 'You must be logged in to invite someone to a trip.')
            return
        }
// TODO add check to make sure the person creating trip invite owns the trip

        // Build out trip invite object
        // Insert trip invite object into the database
        // Send result to the end user



    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}
