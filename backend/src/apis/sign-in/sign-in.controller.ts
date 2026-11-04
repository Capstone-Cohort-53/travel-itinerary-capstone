import type {Request, Response} from 'express'
import {bearerToken, fetchGoogleIdentity, GoogleTokenError} from "../../utils/google.utils.ts";
import {sendError, sendServerError, sendZodError} from "../../utils/response.utils.ts";
import {insertProfile, selectProfileByProfileEmail, type Profile, ProfileSchema} from "../profile/profile.model.ts";
import {isUniqueViolation} from "../../utils/database.utils.ts";
import {establishSession} from "../../utils/auth.utils.ts";
import {v7} from "uuid";

export async function signInController (request:Request, response:Response) {

    try {
        // const validationResult =ProfileSchema.pick({cellNumber:true}).safeParse(request.body)
        // // if validation failed return an error telling the user what validation rule they broke
        // if( validationResult.success ===false) {
        //     sendZodError(request,response,validationResult.error)
        //     return
        // }
    const token = bearerToken(request.headers.authorization)
        if (token === null) {
            sendError(request, response, 401, 'Provide a Google token as "Authorization: bearer token".')
            return;
        }
        const identity = await fetchGoogleIdentity(token)
        const existingProfile: Profile | null = await selectProfileByProfileEmail(identity.email)

            const preferredName= identity?.name?.trim()?.slice(0,32) ?? 'no name set'
            const newProfile = {

                id: v7(),
                email: identity.email,
                name: preferredName,
                image: identity?.picture ?? 'https://res.cloudinary.com/cnm-ingenuity-deep-dive-bootcamp/image/upload/v1726159504/t32ematygvtcyz4ws9p5.png',
                cellNumber: null,
                createdAt : new Date(),

            }

        const profile: Profile = existingProfile ?? await insertProfile(newProfile)
        const authorization: string = establishSession(request, profile)
        response.header({authorization})
        response.status(200).json(profile)

    } catch (error: unknown) {
        if (error instanceof GoogleTokenError) {
            sendError(request,response, 401, error.message)
            return
        }
        if (isUniqueViolation(error)){
            sendError(request, response, 409, 'Could not create a profile: that email or name is already taken.')
            return
        }
        console.error(error)
        sendServerError(request,response)
    }
}