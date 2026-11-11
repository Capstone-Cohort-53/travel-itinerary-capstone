import type {Request, Response} from 'express'

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"
import {insertMember, type Member, MemberRequestSchema, MemberSchema} from "./member.model.ts";
import {sql} from "../../utils/database.utils.ts";
import {selectTripInviteByToken} from "../trip-invite/trip-invite.model.ts";

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
        const {id, inviteId, tripId, adults, children, going, role, token} = data

        let tripInvite = await selectTripInviteByToken(token)
        if (!tripInvite) {
            sendError(request, response, 401, 'Invite does not exist.')
            return
        }
        //*account for expired, do a check like on 35; check to see tripinvite expiration

        if (going === 'yes') {
            tripInvite.status = 'accepted'
        } else if (going === 'no') {
            tripInvite.status = 'declined'
        } else {tripInvite.status = 'pending'}

        //Construct member to be inserted into database.

        const member : Member = {
            id,
            inviteId,
            tripId,
            adults,
            children,
            going,
            role
        }

        const result:Member = await insertMember(member)

        response
            .status(201)
            .location(`/apis/member`)
            .json(result)

    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }

}