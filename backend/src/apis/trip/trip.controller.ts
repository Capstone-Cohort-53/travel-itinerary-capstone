import {sendError, sendServerError, sendZodError} from "../../utils/response.utils.ts";
import {insertTrip, type Trip, TripSchema} from "./trip.model.ts";
import type {Request, Response} from "express";
import {isUniqueViolation} from "../../utils/database.utils.ts";
import {insertMember, type Member} from "../members/member.model.ts";
import {v7} from "uuid";
import {insertTripInvite, type TripInvite} from "../trip-invite/trip-invite.model.ts";
import crypto from "crypto";

export async function postTripController(request: Request, response: Response) {
    // use a try catch block to gracefully handle any errors that might occur

    try {
        //used Zod to validate the end user provided all required information to create a trip
        const validationResult = TripSchema.omit({ownerId: true, createdAt: true}).safeParse(request.body)
        //if a validation failed return an error telling the user
        //what validation rule they broke
        if (validationResult.success === false) {
            sendZodError(request, response, validationResult.error)
            return
        }
        // the author is taken from the session, never trusted from the body
        const profile = request.session?.profile
        if (profile === undefined || profile === null) {
            sendError(request, response, 401, 'Please login to create a trip')
            return
        }
const {data} = validationResult
        const {id, description, destination} = data

        //create a trip from the validated result (Redundant but in other cases not all info is sent from the client)
        const trip: Trip = {
            id,
            ownerId: profile.id,
            createdAt: null,
            description,
            destination,
            title: data.title,
            startDate: data.startDate,
            endDate: data.endDate,
            image: data.image,

        }

        //insert
        const createdTrip = await insertTrip(trip)
        const invite: TripInvite = {id: v7(), tripId: createdTrip.id, invitedBy: profile.id, createdAt: null, acceptedProfileId: profile.id, email: profile.email, cellNumber: profile.cellNumber, name: profile.name, status: 'accepted', token: crypto.randomBytes(32).toString('hex'), expiresAt: null}
        const createdInvite = await insertTripInvite(invite)
        const member: Member = {id: v7(), tripId:createdTrip.id, inviteId: createdInvite.id, role : 'owner', going: 'yes', adults: 1, children: 0}
        await insertMember(member)
            //configure and send the response
            response
            .status(201)
            .location(`/apis/trip/${trip.id}`)
            .json(createdTrip)
        }catch (error:any) {
        //the client supplies the id, so a duplicate primary key is a client error
        if (isUniqueViolation(error)) {
            sendError (request, response, 409, 'A trip with that id already exists')
            return
        }
        console.error(error)
        sendServerError(request, response)
        }

}