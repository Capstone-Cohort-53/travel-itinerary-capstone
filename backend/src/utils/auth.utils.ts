import * as argon2 from 'argon2'
import pkg from 'jsonwebtoken'
import * as crypto from 'crypto'
import type { Request } from 'express'
import { ProfileSchema, type Profile } from '../apis/profile/profile.model.ts'

const { sign } = pkg

/**
 * Establishes the signed-in session for a profile. Shared by every sign-in
 * method (password, Google) so they all produce an identical session.
 *
 * Stores the public profile in the session (identity, carried by the cookie)
 * and mints the CSRF token. The caller is responsible for sending that token in
 * the `Authorization` response header; guarded routes must echo it back (see
 * isLoggedInController).
 *
 * @param request the Express request whose session is being established
 * @param profile the PUBLIC profile only — never the hash/email/activationToken
 * @returns the CSRF token (JWT) to send as the `Authorization` response header
 * @throws ZodError if the profile is not a complete public profile
 */
export function establishSession (request: Request, profile: Profile): string {
    // parse, don't just trust the type: zod strips any non-public keys (hash,
    // email, activationToken) so they can never reach the session or the JWT
    const publicProfile: Profile = ProfileSchema.parse(profile)

    const signature: string = crypto.randomUUID()
    const authorization: string = generateJwt(publicProfile, signature)

    request.session.profile = publicProfile
    request.session.jwt = authorization
    request.session.signature = signature

    return authorization
}

export function generateJwt (payload: object, signature: string): string {
    const setExpInSecondsSinceEpoch = (currentTimestamp: number): number => {
        const oneHourInMilliseconds: number = 3600000 * 3
        const futureTimestamp: number = Math.round(currentTimestamp) + oneHourInMilliseconds
        const futureTimestampInSeconds: number = futureTimestamp / 1000
        return Math.round(futureTimestampInSeconds)
    }

    const iat = new Date().getTime()
    const exp = setExpInSecondsSinceEpoch(iat)
    return sign({ exp, auth: payload, iat }, signature)
}

export function setActivationToken (): string {
    return crypto.randomBytes(16).toString('hex')
}
