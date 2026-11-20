import {Router} from 'express'
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts";
import {
    deleteMemberController,
    getMemberByIdController,
    getMembersByTripIdController,
    postMemberController, putMemberController
} from "./member.controller.ts";

const basepath = '/apis/member' as const
const router = Router()

router.route('/')
    .post(isLoggedInController, postMemberController)

router.route('/:id')
    .get(isLoggedInController, getMemberByIdController)
    .delete(isLoggedInController, deleteMemberController)
    .put(isLoggedInController, putMemberController)

router.route('/trip/:tripId')
    .get(isLoggedInController, getMembersByTripIdController)

export const memberRoute = {basepath, router}