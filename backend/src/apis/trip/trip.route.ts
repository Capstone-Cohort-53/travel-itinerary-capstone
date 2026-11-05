//create route

import {getTargetTriple} from "@swc/core/binding";
import {postTripController} from "./trip.controller.ts";
import {Router} from "express";

const basepath = '/apis/trip' as const
const router = Router()


router.route(`/`)
    .post(isLoggedInController, postTripController)

export const tripRoute = { basepath, router }

//register in App.ts in the App.ts