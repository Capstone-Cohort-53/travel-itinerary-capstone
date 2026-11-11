import {Router} from 'express'
import {isLoggedInController} from "../../utils/controllers/is-logged-in.controller.ts";
import {postMemberController} from "./member.controller.ts";

const basepath = '/apis/member' as const
const router = Router()

router.route('/')
    .post(isLoggedInController, postMemberController)

export const memberRoute = {basepath, router}