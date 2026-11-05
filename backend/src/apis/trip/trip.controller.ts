import {sendError, sendServerError, sendZodError} from "../../utils/response.utils.ts";
import {insertTrip, type Trip, TripSchema} from "./trip.model.ts";
import type {Request, Response} from "express";
import {isUniqueViolation} from "../../utils/database.utils.ts";

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


        //create a trip from the validated result (Redundant but in other cases not all info is sent from the client)
        const trip: Trip = {
            id: validationResult.data.id,
            ownerId: profile.id,
            createdAt: null,
            description: validationResult.data.description,
            destination: validationResult.data.destination,
            title: validationResult.data.title,
            startDate: validationResult.data.startDate,
            endDate: validationResult.data.endDate,
            image: validationResult.data.image,

        }

        //insert
        const createdTrip = await insertTrip(trip)
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