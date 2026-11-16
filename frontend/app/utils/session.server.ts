import { createCookieSessionStorage } from "react-router";
import type { Profile } from "~/utils/models/profile.model";

/**
 * What the React app remembers about a signed-in user, stored in a signed,
 * httpOnly cookie that only server-side code (loaders and actions) can read.
 *
 * - profile: the signed-in user's public profile
 * - authorization: the CSRF token the API issued at sign-in. Guarded API routes
 *   expect it back in the `Authorization` request header
 */
type SessionData = { profile: Profile; authorization: string };

type SessionFlashData = { error: string };

// fail loudly at startup: without a secret the cookie could not be signed
const sessionSecret = process.env.SESSION_SECRET_1;
if (!sessionSecret) {
    throw new Error(
        "SESSION_SECRET_1 is not set. Add it to frontend/.env.development (see frontend/README.md).",
    );
}

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
    SessionData,
    SessionFlashData
>({
    cookie: {
        name: "earl-grey",
        httpOnly: true,
        // three hours, the same lifetime as the API's CSRF token
        maxAge: 10800,
        path: "/",
        sameSite: "strict",
        // signs the cookie so it cannot be edited in the browser
        secrets: [sessionSecret],
        // https only once deployed: the dev server runs on plain http
        secure: process.env.NODE_ENV === "production",
    },
});

export { getSession, commitSession, destroySession };