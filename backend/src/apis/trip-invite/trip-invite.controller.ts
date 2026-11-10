import type {Request, Response} from 'express'
import * as crypto from 'crypto'
import formData from 'form-data'
import Mailgun from 'mailgun.js'


import {
    TripInviteRequestSchema,
    insertTripInvite,
    selectTripInviteByToken, type TripInvite

} from "./trip-invite.model.ts"

import {
    sendError,
    sendServerError,
    sendZodError
} from "../../utils/response.utils.ts"

import {isUniqueViolation} from "../../utils/database.utils.ts"
import {insertTrip, selectTripById, type Trip} from "../trip/trip.model.ts";
import {token} from "morgan";
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
        const {id, tripId, name, cellNumber, email, expiresAt} = data


        // TODO add check to make sure the person creating trip invite owns the trip
        const trip = await selectTripById(tripId)
            if (trip?.ownerId !== profileId){
                sendError(request, response, 401, 'You must be the trip owner to send invitations.')
                return
            }




        //create a trip from the validated result (Redundant but in other cases not all info is sent from the client)
        const tripInvite: TripInvite = {
            id,
            invitedBy: profileId,
            tripId: tripId,
            name,
            acceptedProfileId: null,
            cellNumber:cellNumber ?? null,
            createdAt: null,
            email: email ?? null,
            expiresAt: expiresAt ?? null,
            status: "pending",
            token: crypto.randomBytes(16).toString('hex')
        }
            if (email) {

// fire off the activation email without awaiting it — a delivery failure is
// logged via .catch() and never blocks or fails the sign-up response
                // we need to figure out what accept-invite is going to be
                const inviteLink: string = `${request.protocol}://${request.hostname}:8080${request.originalUrl}accept-invite/${tripInvite.token}`
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


/**
 * Builds and sends the trip-invitation email via Mailgun. The returned promise
 * rejects on any failure (including client construction), so callers should
 * handle errors with `.catch()` or a try/catch.
 *
 * @param to the invitee's email address
 * @param inviteLink the absolute invite-response URL to embed in the message
 * @param trip the trip the recipient is being invited to (title, destination, and start date appear in the email)
 * @param name the name shown in the email as the person sending the invite
 * @param organizerName the username sending invite
 * @returns a promise that resolves once Mailgun accepts the message
 */
async function sendInviteEmail (to: string, inviteLink: string, trip:Trip, name: string, organizerName: string): Promise<void> {
    const mailgun: Mailgun = new Mailgun(formData)
    const mailgunClient = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY as string })

    const message = `<h2> ${name} You're Invited</h2>
        <p>To respond to your invite from ${organizerName} to ${trip.destination}. Click here:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>`

    await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN as string, {
        from: `Mailgun Sandbox <postmaster@${process.env.MAILGUN_DOMAIN as string}>`,
        to,
        subject: 'Invitation to join your fab friends.',
        html: message
    })
}

