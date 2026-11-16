import {sendError, sendServerError, sendZodError} from "../../utils/response.utils.ts";
import {
    deleteTrip,
    insertTrip,
    selectTripDetailById,
    selectTripsByProfileId,
    type Trip,
    TripSchema, updateTrip
} from "./trip.model.ts";
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
        const createdMember = await insertMember(member)
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

/**
 * Express controller for Listing trips I own or belong to by user id.
 * @endpoint GET/apis/trip
 * @returns  200 with an array of trips, or an ErrorResponse (401/500)
 */

export async function getMyTripsController(request: Request, response: Response) {
    // use a try catch block to gracefully handle any errors that might occur
    // purpose of this function: List trips I own or belong to

    try {
        //1. Verify the user is logged in and extract their profile ID from the session
        const profile = request.session?.profile;
        //if a validation failed return an error telling the user
        if (profile === undefined || profile === null) {
            sendError(request, response, 401, 'Please login to view your trips');
            return;
        }
        const profileid = profile.id;
        //2. call your database model to get the trips associated with this profileId.
        // (You will need to build this function in your trip.model.ts file)
        //GET
        const trips = await selectTripsByProfileId(profile.id)
        response
            .status(200).json(trips)
        // do I need .location() , no do not need it for GET just need it for post
    }catch (error:any) {
        //the client supplies the id, so a duplicate primary key is a client error
        if (isUniqueViolation(error)) {
            sendError (request, response, 409, 'No trips have been found')
            return
        }
        console.error(error)
        sendServerError(request, response)
    }

}

//Get one trip's details:
export async function getOneTripDetailsController(request: Request, response: Response) {
    // use a try catch block to gracefully handle any errors that might occur
    // purpose of this function: List one trip's details

    try {
        //1. Verify the user is logged in and extract their profile ID from the session
        const profile = request.session?.profile;
        //if a validation failed return an error telling the user
        if (profile === undefined || profile === null) {
            sendError(request, response, 401, 'Please login to view this trip');
            return;
        }
        //2. validate the tripId from the URL (/apis/trip/:tripId)
        const validationResult = TripSchema.pick({id:true}).safeParse({id:request.params.tripId})
        if (validationResult.success === false) {
            sendZodError(request,response, validationResult.error)
            return
        }
        const tripId= validationResult.data.id

        //3. get the trip, only if this profile owns it or belongs to it
        const trip = await selectTripDetailById(tripId, profile.id)
        if (trip === null) {
            sendError(request, response, 404, 'Trip not found')
            return
        }
        response
            .status(200).json(trip)
        // do I need .location() , no do not need it for GET just need it for post
    }catch (error:any) {
        console.error(error)
        sendServerError(request, response)
    }
}

//Delete a trip for someone who owns the trip
export async function deleteTripController(request: Request, response: Response) {
    // use a try catch block to gracefully handle any errors that might occur
    // purpose of this function: List one trip's details

    try {
        //1. Verify the user is logged in and extract their profile ID from the session
        const profile = request.session?.profile;
        //if a validation failed return an error telling the user
        if (profile === undefined || profile === null) {
            sendError(request, response, 401, 'Please login to delete a trip.');
            return;
        }

        //2. Validate request.params.tripId and return 400 if it's invalid.
        const validationResult = TripSchema.pick({id: true}).safeParse({id: request.params.tripId})
        if (validationResult.success === false) {
            sendZodError(request, response, validationResult.error)
            return
        }
        const tripId = validationResult.data.id

        //3. Call deleteTrip(tripId, profile.id) and return 404 if the result is null.
        const deletedTrip = await deleteTrip(tripId, profile.id)
        if (deletedTrip === null) {
        sendError(request,response, 404, 'Trip not found')
        return
    }

    //4. On success, send 200 with the deleted trip, or 204 with nobody.
    response.status(200).json(deletedTrip)
    } catch(error:any) {
        console.error(error)
        sendServerError(request, response)
    }
}

/**
 * Express controller for updating a trip (owner only).
 * @Endpoint PUT / apis/trip/: tripId
 * @return 200 with the updated trip, or an ErrorResponse (400/401/404/500)
 */

export async function putTripController(request: Request, response: Response) {
    try {
        //1. Verify the user is logged in and extract their profile ID from the session
        const profile = request.session?.profile;
        //if a validation failed return an error telling the user
        if (profile === undefined || profile === null) {
            sendError(request, response, 401, 'Please login to update a trip.');
            return;
        }

        //2. Validate  the tripId from the URL
        const paramsResult = TripSchema.pick({id: true}).safeParse({id: request.params.tripId})
        if (paramsResult.success === false) {
            sendZodError(request, response, paramsResult.error)
            return
        }
        const tripId = paramsResult.data.id

        //3. validate the new trip data from the body (id, owner and createdAt are never taken from the client)
        const bodyResult = TripSchema.omit({id: true, ownerId: true, createdAt: true}).safeParse(request.body)
        if (bodyResult.success === false) {
            sendZodError(request, response, bodyResult.error)
            return
        }
        //4. update the trip, only if this profile is the owner
        const updatedTrip = await updateTrip(tripId, profile.id, bodyResult.data)
        if (updatedTrip === null) {
            sendError(request, response, 404, 'Trip not found')
            return
        }
        response.status(200).json(updatedTrip)
    } catch (error:any) {
        console.error(error)
        sendServerError(request, response)

    }
}