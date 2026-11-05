import {Router} from 'express'
import {getProfileMeController} from './profile.controller.ts'

const basePath = '/apis/profile' as const
const router = Router()

router.route('/me')
.get(getProfileMeController)

export const profileRoute = {basePath, router}