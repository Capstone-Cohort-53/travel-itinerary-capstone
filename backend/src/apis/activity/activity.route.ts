import {Router} from 'express'
import {
    postActivityController,
    getActivitiesByTripIdController,
    getActivityByIdController,
    putActivityController,
    deleteActivityController
} from "./activity.controller.ts"
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts"

// ── Activity routes: /apis/trip/:tripId/activity ──
// mergeParams lets the controllers read :tripId from the basepath
const router = Router({mergeParams: true})
const basepath = '/apis/trip/:tripId/activity' as const

router.route('/')
    .post(isLoggedInController, postActivityController)
    .get(isLoggedInController, getActivitiesByTripIdController)

router.route('/:activityId')
    .get(isLoggedInController, getActivityByIdController)
    .put(isLoggedInController, putActivityController)
    .delete(isLoggedInController, deleteActivityController)

export const activityRoute = {basepath, router}
