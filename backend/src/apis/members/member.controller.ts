import type {Request, Response} from 'express'

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"
import {
    deleteMember,
    insertMember,
    type Member,
    MemberRequestSchema,
    MemberSchema,
    selectMemberById,
    selectMembersByTripId
} from "./member.model.ts";
import {selectTripInviteByToken, updateTripInvite} from "../trip-invite/trip-invite.model.ts";
import {selectTripById} from "../trip/trip.model.ts";

export async function postMemberController(
    request: Request,
    response: Response
): Promise<void> {
    try {

        const validationResult = MemberRequestSchema.safeParse(request.body)

        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }

        const profileId = request.session.profile?.id
        if (!profileId) {
            sendError(request, response, 401, 'You must be logged in to respond to this invite.')
            return
        }

        const {data} = validationResult
        const {id, inviteId, tripId, adults, children, going, token} = data

        let tripInvite = await selectTripInviteByToken(token)
        if (!tripInvite) {
            sendError(request, response, 401, 'Invite does not exist.')
            return
        }

        const {expiresAt} = tripInvite
        if (expiresAt !== null && expiresAt < new Date()) {
            sendError(request, response, 410, 'This invite has expired.')
            return
        }


        if (going === 'yes') {
            tripInvite.status = 'accepted'
        } else if (going === 'no') {
            tripInvite.status = 'declined'
        } else {
            tripInvite.status = 'pending'
        }

        tripInvite.acceptedProfileId = profileId

        await updateTripInvite(tripInvite)


        //Construct member to be inserted into database.

        const member: Member = {
            id,
            inviteId,
            tripId,
            adults,
            children,
            going,
            role: 'member'
        }

        const result: Member = await insertMember(member)

        response
            .status(201)
            .location(`/apis/member`)
            .json(result)

    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

export async function getMemberByIdController (request: Request, response: Response): Promise<void> {
    try {
        const validationResult = MemberSchema.pick({id: true}).safeParse(request.params)

        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }

        const id = validationResult.data.id
        const member = await selectMemberById(id)

        if (member === null){
            sendError(request, response, 404, `No member exists with an id ${id}`)
        }
        response.json(member)

    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

export async function getMembersByTripIdController (request: Request, response: Response): Promise<void> {
    try {

     const validationResult = MemberSchema.pick({tripId: true}).safeParse(request.params)

        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }

        const id = validationResult.data.tripId
        const members = await selectMembersByTripId(id)
        response.json(members)

    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

export async function deleteMemberController (request: Request, response: Response): Promise<void> {
    try {

        const validationResult = MemberSchema.pick({id: true}).safeParse(request.params)

        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }

        const id = validationResult.data.id
        const member = await selectMemberById(id)

        if (member === null){
            sendError(request, response, 404, `No member exists with an id ${id}`)
            return
        }

        const trip = await selectTripById(member.tripId)

        const profileId = request.session.profile?.id
        if (!profileId) {
            sendError(request, response, 401, 'You must be logged in to respond to this invite.')
            return
        }

        if (profileId !== trip?.ownerId) {
            sendError(request, response, 400, 'You must own the trip to remove members.')
            return
        }

        await deleteMember (id)

        response.status(204).send('Member deleted.')

    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }

}

export async function putMemberController (request: Request, response: Response): Promise<void> {
    try {

        const validationResult = MemberSchema.pick({id: true}).safeParse(request.params)

        if (!validationResult.success) {
            sendZodError(request, response, validationResult.error)
            return
        }

        const id = validationResult.data.id
        const member = await selectMemberById(id)

        if (member === null){
            sendError(request, response, 404, `No member exists with an id ${id}`)
            return
        }

        const profileId = request.session.profile?.id
        if (!profileId) {
            sendError(request, response, 401, 'You must be logged in to respond to this invite.')
            return
        }

        const tripInvite = await selectTripInviteBy

        if (profileId !== member.)

    }

    catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

