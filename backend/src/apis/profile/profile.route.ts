import {Router} from 'express'
import {
    getProfileByProfileIdController,
    getProfileByProfileNameController,
    getProfileMeController,
    putProfileController
} from './profile.controller.ts'
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts";

const basePath = '/apis/profile' as const
const router = Router()

// '/me' must come before '/:id' or express would treat "me" as an id
router.route('/me')
    .get(getProfileMeController)

router.route('/name/:name')
    .get(getProfileByProfileNameController)

router.route('/:id')
    .get(getProfileByProfileIdController)
    .put(isLoggedInController, putProfileController)

export const profileRoute = {basePath, router}
