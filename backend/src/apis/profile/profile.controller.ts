import type { Request, Response } from 'express'
import {selectProfileByProfileId} from "./profile.model.ts"
import { sendError, sendServerError} from "../../utils/response.utils.ts"

export async function getProfileMeController (request: Request, response: Response): Promise<void> {
    try {
        const sessionProfile = request.session?.profile

        if (sessionProfile === undefined || sessionProfile === null) {
            sendError(request, response, 401, 'You must be signed in to view your profile')
            return
        }
        const profile = await selectProfileByProfileId(sessionProfile.id)
        if (profile === null) {
            sendError(request, response, 404, 'Profile not found')
            return
        }
        response.status(200).json(profile)
    } catch (error: any) {
        console.error(error)
        sendServerError(request, response)
    }
}