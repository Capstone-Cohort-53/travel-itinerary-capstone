import type {Request, Response} from 'express'
import * as crypto from 'crypto'
import {Resend} from 'resend'
import validator from 'validator'
import {z} from 'zod/v4'
import {v7} from 'uuid'



import {
    TripInviteRequestSchema,
    TripInviteSummarySchema,
    insertTripInvite,
    selectTripInviteByToken, type TripInvite,
    selectTripInvitesByTripId,
    selectTripInviteById,
    deleteTripInvite,
    updateTripInvite, selectKitchenSinkByTripId,
    TripInviteDetailsSchema, updateTripInviteDetails


} from "./trip-invite.model.ts"

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"


import {isUniqueViolation} from "../../utils/database.utils.ts"
import {selectTripById, type Trip} from "../trip/trip.model.ts";
import {selectProfileByProfileId} from "../profile/profile.model.ts";
import type {Profile} from "../profile/profile.model.ts";



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

        const profile = request.session.profile
        const profileId = profile?.id
        if (!profileId) {
            sendError(request, response, 401, 'You must be logged in to invite someone to a trip.')
            return
        }



        // Build out trip invite object

        const {data} = validationResult
        const {name, cellNumber, email, expiresAt} = data
        const tripId = String(request.params.tripId)


        // TODO add check to make sure the person creating trip invite owns the trip
        const trip = await selectTripById(tripId)
        if (trip?.ownerId !== profileId){
            sendError(request, response, 401, 'You must be the trip owner to send invitations.')
            return
        }




        //create a trip from the validated result (Redundant but in other cases not all info is sent from the client)
        const tripInvite: TripInvite = {
            id: v7(),
            invitedBy: profileId,
            tripId,
            name,
            acceptedProfileId: null,
            cellNumber:cellNumber ?? null,
            createdAt: null,
            email: email ?? null,
            expiresAt: expiresAt ?? null,
            status: "pending",
            token: crypto.randomBytes(32).toString('hex')
        }
        if (email) {

// fire off the activation email without awaiting it — a delivery failure is
// logged via .catch() and never blocks or fails the sign-up response
            // points at the frontend's accept-invitation/:token page
            const inviteLink: string = `${request.protocol}://${request.hostname}:8080/accept-invitation/${tripInvite.token}`
            await sendInviteEmail(email, inviteLink, trip, name, profile.name)
                .catch(mailError => {
                    console.error('Invite email failed to send:', mailError)
                })

        }

        // Insert trip invite object into the database
        const createdTripInvite = await insertTripInvite(tripInvite)

        // Send result to the end user


        response
            .status(201)
            .location(`/apis/trip-invite/${tripInvite.id}`)
            .json(createdTripInvite)


    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function getTripInviteByTokenController (request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the token from the URL (32 random bytes = 64 hex characters)
        const paramsResult = z.object({ token: z.string().length(64) }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }

        // 2. find the invitation
        const invite = await selectTripInviteByToken(paramsResult.data.token)
        if (invite === null) {
            sendError(request, response, 404, 'Invitation not found.')
            return
        }

        // 3. get the trip and the organizer's profile
        const trip = await selectTripById(invite.tripId)
        const organizer = await selectProfileByProfileId(invite.invitedBy)
        if (trip === null || organizer === null) {
            sendError(request, response, 404, 'Invitation not found.')
            return
        }

        // 4. a past expiration date counts as expired
        const isExpired = invite.expiresAt !== null && invite.expiresAt < new Date()

        // 5. send ONLY what the acceptance page needs: no email, phone, token, or ids
        response.status(200).json({
            inviteeName: invite.name,
            organizerName: organizer.name,
            status: isExpired ? 'expired' : invite.status,
            expiresAt: invite.expiresAt,
            trip: {
                title: trip.title,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                image: trip.image
            }
        })
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function declineTripInviteController (request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the token from the URL (32 random bytes = 64 hex characters)
        const paramsResult = z.object({ token: z.string().length(64) }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }

        // 2. find the invitation
        const invite = await selectTripInviteByToken(paramsResult.data.token)
        if (invite === null) {
            sendError(request, response, 404, 'Invitation not found.')
            return
        }

        // 3. a past expiration date means it can't be answered anymore
        if (invite.expiresAt !== null && invite.expiresAt < new Date()) {
            sendError(request, response, 410, 'This invite has expired.')
            return
        }

        // 4. only a pending invite can be declined
        if (invite.status !== 'pending') {
            sendError(request, response, 409, `This invitation has already been ${invite.status}.`)
            return
        }

        // 5. mark it declined and save it
        await updateTripInvite({ ...invite, status: 'declined' })

        // 6. let the invitee know it worked
        response.status(200).json({ message: 'Invitation declined.' })
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function getTripInvitesController (request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the trip id from the URL
        const paramsResult = z.object({ tripId: z.uuidv7() }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const { tripId } = paramsResult.data

        // 2. the trip must exist...
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }

        // 3. ...and belong to the signed-in user
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can view invitations.')
            return
        }

        // 4. send the list (token is left out by the model)
        const invites = await selectTripInvitesByTripId(tripId)
        response.status(200).json(invites)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function getTripInviteByIdController (request: Request, response: Response): Promise<void> {
    try {
        // 1. validate both ids from the URL
        const paramsResult = z.object({ tripId: z.uuidv7(), inviteId: z.uuidv7() }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const { tripId, inviteId } = paramsResult.data

        // 2. the trip must exist and belong to the signed-in user
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can view invitations.')
            return
        }

        // 3. the invite must exist AND belong to this trip, so an owner can't
        //    read another trip's invite by pairing their trip id with it
        const invite = await selectTripInviteById(inviteId)
        if (invite === null || invite.tripId !== tripId) {
            sendError(request, response, 404, 'Invitation not found.')
            return
        }

        // 4. send the invite without its secret token
        response.status(200).json(TripInviteSummarySchema.parse(invite))
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}


export async function deleteTripInviteController (request: Request, response: Response): Promise<void> {
    try {
        // 1. validate both ids from the URL
        const paramsResult = z.object({ tripId: z.uuidv7(), inviteId: z.uuidv7() }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const { tripId, inviteId } = paramsResult.data

        // 2. the trip must exist and belong to the signed-in user
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can revoke invitations.')
            return
        }

        // 3. the invite must exist AND belong to this trip, so an owner can't
        //    delete another trip's invite by pairing their trip id with it
        const invite = await selectTripInviteById(inviteId)
        if (invite === null || invite.tripId !== tripId) {
            sendError(request, response, 404, 'Invitation not found.')
            return
        }

        // 4. the owner is on the roster too (their own accepted invite); they can't remove themselves
        if (invite.acceptedProfileId === trip.ownerId) {
            sendError(request, response, 400, "You can't remove yourself from your own trip.")
            return
        }

        // 5. revoke it (and, if they had accepted, take them off the trip)
        await deleteTripInvite(inviteId)
        response.status(200).json({ message: 'Traveler removed.' })
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

/**
 * PUT /apis/trip/:tripId/invite/:inviteId
 * Lets the trip owner fix a pending invite's name, email or cell number (e.g. a typo).
 * Accepted invites are locked: those travelers' details come from their own profile.
 */
export async function putTripInviteController (request: Request, response: Response): Promise<void> {
    try {
        const paramsResult = z.object({ tripId: z.uuidv7(), inviteId: z.uuidv7() }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const { tripId, inviteId } = paramsResult.data

        const bodyResult = TripInviteDetailsSchema.safeParse(request.body)
        if (!bodyResult.success) {
            sendZodError(request, response, bodyResult.error)
            return
        }

        // the trip must exist and belong to the signed-in user
        const trip = await selectTripById(tripId)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found.')
            return
        }
        if (trip.ownerId !== request.session.profile?.id) {
            sendError(request, response, 403, 'Only the trip owner can edit invitations.')
            return
        }

        // the invite must belong to this trip, and still be waiting for an answer
        const invite = await selectTripInviteById(inviteId)
        if (invite === null || invite.tripId !== tripId) {
            sendError(request, response, 404, 'Invitation not found.')
            return
        }
        if (invite.status !== 'pending') {
            sendError(request, response, 409, 'Only pending invitations can be edited.')
            return
        }

        const updatedInvite = await updateTripInviteDetails(inviteId, bodyResult.data)
        // never send the token back: it is the invite's secret link
        const { token: _token, ...inviteWithoutToken } = updatedInvite
        response.status(200).json(inviteWithoutToken)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}

/**
 * Builds and sends the trip-invitation email via Resend. The returned promise
 * rejects on any failure (missing API key, or Resend refusing the message),
 * so callers should handle errors with `.catch()` or a try/catch.
 *
 * Needs RESEND_API_KEY and RESEND_DOMAIN (a domain verified in Resend) in project.env.
 *
 * @param to the invitee's email address
 * @param inviteLink the absolute invite-response URL to embed in the message
 * @param trip the trip the recipient is being invited to (its destination appears in the email)
 * @param name the invitee's name, shown in the greeting
 * @param organizerName the name of the trip owner sending the invite
 * @returns a promise that resolves once Resend accepts the message
 */
async function sendInviteEmail (to: string, inviteLink: string, trip: Trip, name: string, organizerName: string): Promise<void> {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // names and destination are typed by users, so escape them before putting them in HTML
    const message = `<h2>${validator.escape(name)}, You're Invited</h2>
        <p>To respond to your invite from ${validator.escape(organizerName)} to ${validator.escape(trip.destination)}, click here:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>`

    // Resend reports failures in `error` instead of throwing, so turn them into a rejection
    const { error } = await resend.emails.send({
        from: `TripsQueen <invites@${process.env.RESEND_DOMAIN as string}>`,
        to,
        subject: 'Invitation to join your fab friends.',
        html: message
    })
    if (error) {
        throw new Error(`Resend rejected the invite email: ${error.name}: ${error.message}`)
    }
}

export async function getTripInvitesKitchenSinkController (request: Request, response: Response): Promise<void> {
    try {
        // 1. validate the trip id from the URL
        const paramsResult = z.object({ tripId: z.uuidv7() }).safeParse(request.params)
        if (!paramsResult.success) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const { tripId } = paramsResult.data


        const invites = await selectKitchenSinkByTripId(tripId)
        response.status(200).json(invites)
    } catch (error: unknown) {
        console.error(error)
        sendServerError(request, response)
    }
}