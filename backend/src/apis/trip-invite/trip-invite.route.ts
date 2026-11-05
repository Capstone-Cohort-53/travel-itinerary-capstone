import { Router } from 'express'
import { postTripInviteController} from "./trip-invite.controller.ts"

export const tripInviteRoute = Router()

tripInviteRoute.post(
    `/trips/:tripId/invites`,
    postTripInviteController
)