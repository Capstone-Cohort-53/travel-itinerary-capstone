import type { Request, Response } from 'express'
import {z} from "zod/v4";
import {
    type Profile,
    ProfileSchema,
    selectProfileByProfileId,
    selectProfileByProfileName,
    selectProfilesByTripId,
    updateProfile
} from "./profile.model.ts"
import {sendError, sendServerError, sendZodError} from "../../utils/response.utils.ts"
import {establishSession} from "../../utils/auth.utils.ts";

// GET /apis/profile/me
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
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

// GET /apis/profile/:id
export async function getProfileByProfileIdController (request: Request, response: Response): Promise<void> {
    try {
        const validationResult = ProfileSchema.pick({id:true}).safeParse (request.params)
        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }
        const { id } = validationResult.data

        const profile = await selectProfileByProfileId(id)
        if(profile === null) {
            sendError (request, response, 404, `No profile exists with an id equal to ${id}`)
            return
        }
        response.status(200).json(profile)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

// GET /apis/profile/name/:name
export async function getProfileByProfileNameController (request: Request, response: Response): Promise<void> {
    try{
        const validationResult = ProfileSchema.pick({name:true}).safeParse (request.params)
        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }
        const {name} = validationResult.data

        const profile = await selectProfileByProfileName(name)
        if(profile === null) {
            sendError(request, response, 404, `No profile exists with a name equal to ${name}`)
            return
        }
        response.status(200).json(profile)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

// PUT /apis/profile/:id
export async function putProfileController (request: Request, response: Response): Promise<void> {
    try{
        // only these fields can be changed by the user; id, email and createdAt are not trusted from the body
        const validationResultForRequestBody = ProfileSchema.pick({name: true, image: true, cellNumber: true}).safeParse (request.body)
        if (!validationResultForRequestBody.success) {
            sendZodError(request, response, validationResultForRequestBody.error)
            return
        }
        const validationResultForRequestParams = ProfileSchema.pick({id:true}).safeParse (request.params)
        if (!validationResultForRequestParams.success) {
            sendZodError(request, response, validationResultForRequestParams.error)
            return
        }
        const {id} = validationResultForRequestParams.data

        const idFromSession = request.session?.profile?.id
        if (idFromSession !== id) {
            sendError(request,response, 403, 'You cannot update a profile that is not yours')
            return
        }

        const profile: Profile | null = await selectProfileByProfileId(id)
        if(profile === null) {
            sendError(request, response, 404, `No profile exists with an id equal to ${id}`)
            return
        }

        const {name, image, cellNumber} = validationResultForRequestBody.data
        profile.name = name
        profile.image = image
        profile.cellNumber = cellNumber

        const updatedProfile = await updateProfile(profile)

        // refresh the session so /me and the session profile show the new values
        const authorization: string = establishSession(request, updatedProfile)
        response.header({authorization})

        response.status(200).json(updatedProfile)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

// GET /apis/trip/:tripId/member
export async function getProfilesByTripIdController (request: Request, response: Response): Promise<void> {
    try {
        const validationResult = z.object({tripId: z.uuidv7('please provide a valid uuid for tripId')}).safeParse(request.params)
        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }
        const {tripId} = validationResult.data

        const sessionProfile = request.session?.profile
        if (sessionProfile === undefined || sessionProfile === null) {
            sendError(request, response, 401, 'You must be signed in to view trip members')
            return
        }

        const profiles = await selectProfilesByTripId(tripId)

        // only members of the trip can see the other members' profiles
        const isMember = profiles.some(profile => profile.id === sessionProfile.id)
        if (!isMember) {
            sendError(request, response, 403, 'You are not a member of this trip')
            return
        }

        response.status(200).json(profiles)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}
