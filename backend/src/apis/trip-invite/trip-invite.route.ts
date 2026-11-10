import { Router } from 'express'
import { postTripInviteController} from "./trip-invite.controller.ts"
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts";

export const router = Router()
const basepath = '/apis/trip-invite' as const
router.route(`/`)
    .post(isLoggedInController, postTripInviteController)

export const tripInviteRoute = { basepath, router }
