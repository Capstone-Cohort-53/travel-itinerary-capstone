//create route

import {postTripController} from "./trip.controller.ts";
import {Router} from "express";
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts";

import {getProfilesByTripIdController} from "../profile/profile.controller.ts";

import {getMyTripsController, getOneTripDetailsController, deleteTripController, putTripController} from "./trip.controller.ts";


const basepath = '/apis/trip' as const
const router = Router()


router.route(`/`)
    .get(isLoggedInController, getMyTripsController)
    .post(isLoggedInController, postTripController)


router.route('/:tripId/member')
    .get(getProfilesByTripIdController)

router.route(`/:tripId`)
    .get(isLoggedInController, getOneTripDetailsController)
    .put(isLoggedInController, putTripController)
    .delete(isLoggedInController, deleteTripController)


export const tripRoute = { basepath, router }

//register in App.ts in the App.ts
