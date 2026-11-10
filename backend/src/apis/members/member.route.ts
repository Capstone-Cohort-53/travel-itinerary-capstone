import {Router} from 'express'
import {getMemberController} from './member.controller.ts'

const basePath = '/apis/member' as const
const router = Router()

router.route('/me')
    .get(getMemberController)

export const profileRoute = {basePath, router}