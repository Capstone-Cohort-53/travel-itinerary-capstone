import { z } from 'zod/v4'

/**
 * Google sign-in without a library.
 *
 * The client (the React app, Insomnia, the JetBrains HTTP client, curl...)
 * obtains a token from Google and hands it to us. We never trust the token's
 * contents directly: we ask Google's `tokeninfo` endpoint to validate it, which
 * checks the signature/expiry for us and tells us which OAuth client (`aud`)
 * the token was issued to. Two kinds of token are accepted:
 *
 *   - an **access token** (`ya29....`): what Insomnia's OAuth 2.0 auth helper
 *     and `google.accounts.oauth2.initTokenClient` produce. `tokeninfo` returns
 *     the email but not the name/picture, so we then call `userinfo` for those.
 *   - an **ID token** (a JWT): what the "Sign in with Google" button returns.
 *     `tokeninfo` returns every claim, including name and picture.
 *
 * @see https://developers.google.com/identity/sign-in/web/backend-auth
 * @see https://developers.google.com/identity/protocols/oauth2/openid-connect#validatinganidtoken
 */

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

/** the fields we need from https://oauth2.googleapis.com/tokeninfo (for either token kind) */
const GoogleTokenInfoSchema = z.object({
    aud: z.string(),
    email: z.email(),
    // tokeninfo returns booleans as the strings "true" / "false"
    email_verified: z.enum(['true', 'false']).transform(value => value === 'true'),
    name: z.string().optional(),
    picture: z.url().optional()
})

/** the fields we need from https://openidconnect.googleapis.com/v1/userinfo */
const GoogleUserInfoSchema = GoogleTokenInfoSchema.pick({ name: true, picture: true })

/**
 * The verified identity Google vouches for.
 * @property email the verified email address
 * @property name the display name, if Google shared one
 * @property picture the avatar URL, if Google shared one
 */
export interface GoogleIdentity {
    email: string
    name: string | null
    picture: string | null
}

/**
 * Thrown when the token is missing, invalid, expired, issued to a different
 * application, or belongs to an unverified email. Controllers map this to 401;
 * any other error (Google unreachable, env not set) is a 500.
 */
export class GoogleTokenError extends Error {}

/**
 * Validates a Google token with Google and returns the identity it belongs to.
 *
 * @param token a Google access token or ID token
 * @returns the verified identity
 * @throws GoogleTokenError when the token must be rejected (map to 401)
 * @throws Error for configuration/network problems (map to 500)
 */
export async function fetchGoogleIdentity (token: string): Promise<GoogleIdentity> {
    const clientIds = allowedClientIds()

    // ask Google to validate the token; it checks signature + expiry and tells us the audience.
    // Google ID tokens are JWTs (three dot-separated segments); access tokens are opaque "ya29...." strings
    const tokenKind = token.split('.').length === 3 ? 'id_token' : 'access_token'
    const tokenInfoResponse = await fetch(`${TOKENINFO_URL}?${tokenKind}=${encodeURIComponent(token)}`)
    if (!tokenInfoResponse.ok) {
        throw new GoogleTokenError('Google token is invalid or expired.')
    }
    const tokenInfo = GoogleTokenInfoSchema.parse(await tokenInfoResponse.json())

    // the token must have been issued to THIS application, otherwise any Google
    // token from any other app could be replayed here to sign in as its owner
    if (!clientIds.includes(tokenInfo.aud)) {
        throw new GoogleTokenError('Google token was not issued for this application.')
    }

    // we key profiles on email, so only accept an email Google has verified
    if (!tokenInfo.email_verified) {
        throw new GoogleTokenError('Google account email is not verified.')
    }

    // an access token's tokeninfo has no name/picture, so fetch them from userinfo
    const { name, picture } = tokenKind === 'access_token' ? await fetchOptionalUserInfo(token) : tokenInfo

    return { email: tokenInfo.email, name: name ?? null, picture: picture ?? null }
}

/**
 * Extracts the token from a `Bearer <token>` Authorization header.
 *
 * @param header the raw Authorization header, if any
 * @returns the token, or null when the header is missing or not a Bearer token
 */
export function bearerToken (header: string | undefined): string | null {
    const match = header?.match(/^bearer\s+(\S+)$/i)
    return match?.[1] ?? null
}

/**
 * The OAuth client ids this server accepts tokens for. `GOOGLE_CLIENT_ID` may be
 * a comma-separated list, so the React app's web client and a desktop/Insomnia
 * client can both sign in.
 */
function allowedClientIds (): string[] {
    const raw = process.env.GOOGLE_CLIENT_ID ?? ''
    const clientIds = raw.split(',').map(id => id.trim()).filter(id => id !== '')
    if (clientIds.length === 0) {
        throw new Error('GOOGLE_CLIENT_ID is not set in project.env')
    }
    return clientIds
}

/**
 * Fetches the display name and picture for an access token. Best effort: if
 * Google refuses (e.g. the `profile` scope was not granted) both come back
 * undefined and the profile falls back to defaults.
 *
 * @param accessToken a Google access token
 */
async function fetchOptionalUserInfo (accessToken: string): Promise<z.infer<typeof GoogleUserInfoSchema>> {
    const userInfoResponse = await fetch(USERINFO_URL, { headers: { authorization: `Bearer ${accessToken}` } })
    if (!userInfoResponse.ok) {
        // not fatal — identity was already proven by tokeninfo — but worth seeing in
        // the logs, otherwise every Google user silently ends up with a fallback name
        console.warn(`Google userinfo request failed (${userInfoResponse.status} ${userInfoResponse.statusText}); signing in without name/picture.`)
        return {}
    }
    return GoogleUserInfoSchema.parse(await userInfoResponse.json())
}