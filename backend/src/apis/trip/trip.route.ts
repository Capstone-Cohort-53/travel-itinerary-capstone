//create route


import {postTripController} from "./trip.controller.ts";
import {Router} from "express";
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts";

const basepath = '/apis/trip' as const
const router = Router()


router.route(`/`)
    .post(isLoggedInController, postTripController)

export const tripRoute = { basepath, router }

//register in App.ts in the App.ts