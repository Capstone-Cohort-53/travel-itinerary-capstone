import { createCookieSessionStorage, redirect } from "react-router";
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

/**
 * What a guarded loader or action knows about the signed-in user.
 *
 * - profile: who the user is, for the page to display
 * - authorization: the CSRF token, sent to the API in the `Authorization` header
 * - cookie: the `Cookie` header the browser sent. It carries the API's own
 *   session cookie, which is how the API knows who is making the request
 */
export type SignedInUser = { profile: Profile; authorization: string; cookie: string };

/**
 * Guards a loader or an action: call it first, in every route that needs a
 * signed-in user. When there is no session it throws a redirect to the sign-in
 * page, which stops the loader or action right there.
 *
 * @param request the request the loader or action received
 * @returns the signed-in user's profile, plus what the API needs to trust a request
 */
export async function requireSignedInUser(request: Request): Promise<SignedInUser> {
    const cookie = request.headers.get("Cookie") ?? "";
    const session = await getSession(cookie);

    const profile = session.get("profile");
    const authorization = session.get("authorization");

    if (!profile || !authorization) {
        // there is no sign-in page: signing in is the Google button in the navbar on the home page
        throw redirect("/");
    }

    return { profile, authorization, cookie };
}

/**
 * Ends the React app's session and sends the user to the sign-in page. For when
 * the API answers that it no longer knows the user (401 or 403): its session
 * ended before this one did.
 *
 * The session has to be destroyed, not just left behind: the sign-in page sends
 * anyone who still has one straight back to the feed.
 *
 * @param request the request the action received (it carries the current cookies)
 * @returns a redirect to the sign-in page that also deletes the session cookie
 */
export async function endSession(request: Request): Promise<Response> {
    const session = await getSession(request.headers.get("Cookie"));

    return redirect("/", {
        headers: { "Set-Cookie": await destroySession(session) },
    });
}