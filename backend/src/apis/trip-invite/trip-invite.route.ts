import { Router } from 'express'
import {
    postTripInviteController,
    getTripInviteByTokenController,
    getTripInvitesController,
    getTripInviteByIdController,
    deleteTripInviteController,
    declineTripInviteController
} from "./trip-invite.controller.ts"
import { isLoggedInController } from "../../utils/controllers/is-logged-in.controller.ts"

// ── Owner-only routes: /apis/trip/:tripId/invite ──
const tripInviteRouter = Router({ mergeParams: true })
const basepath = '/apis/trip/:tripId/invite' as const

tripInviteRouter.route('/')
    .post(isLoggedInController, postTripInviteController)
    .get(isLoggedInController, getTripInvitesController)


tripInviteRouter.route('/:inviteId')
    .delete(isLoggedInController, deleteTripInviteController)
    .get(isLoggedInController, getTripInviteByIdController)

export const tripInviteRoute = { basepath, router: tripInviteRouter }

// ── Public route: /apis/trip-invite/:token ──
const tokenRouter = Router()

tokenRouter.route('/:token')
     .get(getTripInviteByTokenController)

tokenRouter.route('/:token/decline')
    .post(declineTripInviteController)

export const tripInviteTokenRoute = { basepath: '/apis/trip-invite', router: tokenRouter }