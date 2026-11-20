import {Router} from 'express'
import {
    getActivityRsvpsController,
    postActivityRsvpController,
    deleteActivityRsvpController
} from "./activity-rsvp.controller.ts"
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts"

// ── Activity RSVP routes: /apis/activity/:activityId/rsvp ──
// mergeParams lets the controllers read :activityId from the basepath
const router = Router({mergeParams: true})
const basepath = '/apis/activity/:activityId/rsvp' as const

router.route('/')
    .get(isLoggedInController, getActivityRsvpsController)
    .post(isLoggedInController, postActivityRsvpController)
    .delete(isLoggedInController, deleteActivityRsvpController)

export const activityRsvpRoute = {basepath, router}
