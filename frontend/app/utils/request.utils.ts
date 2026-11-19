import type { Status } from "~/utils/interfaces/Status";
import type { SignedInUser } from "~/utils/session.server";

/**
 * Where the Express API lives, read from REST_API_URL in .env.development.
 * This is the only place that reads it: every model function builds its
 * request URL from this constant, e.g. `${REST_URL}/thread`.
 */
export const REST_URL = readRestUrl();

/**
 * Reads REST_API_URL from the environment.
 *
 * Environment variables only exist on the server. This file is also loaded in
 * the browser (the models that import it hold the schemas the forms validate
 * with), and there `process` does not exist, so the browser gets an empty
 * string. That is fine: only loaders and actions make requests to the API.
 *
 * @returns the API's base URL on the server, an empty string in the browser
 */
function readRestUrl(): string {
    if (typeof process === "undefined") {
        return "";
    }

    // fail loudly at startup: without it every request would go to "undefined/..."
    const restUrl = process.env.REST_API_URL;
    if (!restUrl) {
        throw new Error(
            "REST_API_URL is not set. Add it to frontend/.env.development (see frontend/README.md).",
        );
    }

    return restUrl;
}

/** How long a request to the API may take before it is abandoned. */
export const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Turns a rejected fetch into a Status, so a model function can return it
 * instead of throwing. fetch rejects when the API never answered: it could not
 * be reached, or it took longer than REQUEST_TIMEOUT_MS.
 *
 * @param error what fetch rejected with
 * @returns 504 when the request timed out, otherwise 503
 */
export function failedRequestStatus(error: unknown): Status {
    const timedOut = error instanceof Error && error.name === "TimeoutError";

    if (timedOut) {
        return {
            status: 504,
            data: null,
            message: "The server took too long to respond. Please try again.",
        };
    }

    return {
        status: 503,
        data: null,
        message: "Unable to reach the server. Please check your connection and try again.",
    };
}

/**
 * Reads from the API: sends a GET request and normalizes the answer into a
 * Status. A network failure or a timeout is caught, so this function never
 * throws.
 *
 * Pass the signed-in user for a guarded route. The request then carries both
 * proofs of who the user is: the API's session cookie (`Cookie`) and the CSRF
 * token (`Authorization`). Leave it out for a public route.
 *
 * @param path the API path to GET, e.g. `/thread/following`
 * @param user the signed-in user, from requireSignedInUser (guarded routes only)
 * @returns `200` with the parsed body in `data`, otherwise the failure's status and message
 */
export async function getRequest(path: string, user?: SignedInUser): Promise<Status> {
    const headers = new Headers();
    if (user) {
        headers.set("Authorization", user.authorization);
        headers.set("Cookie", user.cookie);
    }

    try {
        const response = await fetch(`${REST_URL}${path}`, {
            headers,
            // give up when the API does not answer in time, instead of waiting forever
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        // parse the body defensively: an error response may not carry JSON
        const body = await response.json().catch(() => null);

        if (response.status === 200) {
            return { status: 200, data: body, message: null };
        }

        return {
            status: response.status,
            data: null,
            message: body?.message ?? "Failed to load. Please try again.",
        };
    } catch (error) {
        // fetch itself rejected: the server was not reached, or did not answer in time
        console.error(`GET ${path} failed:`, error);
        return failedRequestStatus(error);
    }
}

/**
 * Writes to the API: sends a POST request with a JSON body and normalizes the
 * answer into a Status. Like getRequest, it never throws.
 *
 * @param path the API path to POST to, e.g. `/trip/123/invite`
 * @param body the value to send, serialized as JSON
 * @param user the signed-in user, from requireSignedInUser (guarded routes only)
 * @returns the response's status with the parsed body in `data` when it is 200 or 201, otherwise the failure's status and message
 */
export async function postRequest(path: string, body: unknown, user?: SignedInUser): Promise<Status> {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (user) {
        headers.set("Authorization", user.authorization);
        headers.set("Cookie", user.cookie);
    }

    try {
        const response = await fetch(`${REST_URL}${path}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        const responseBody = await response.json().catch(() => null);

        if (response.status === 200 || response.status === 201) {
            return { status: response.status, data: responseBody, message: null };
        }

        return {
            status: response.status,
            data: null,
            message: responseBody?.message ?? "Failed to save. Please try again.",
        };
    } catch (error) {
        console.error(`POST ${path} failed:`, error);
        return failedRequestStatus(error);
    }
}
