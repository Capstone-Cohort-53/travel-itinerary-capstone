import type { Status } from "~/utils/interfaces/Status";

/** How long a request to the API may take before it is abandoned. */
export const REQUEST_TIMEOUT_MS = 10_000;

export const REST_URL = process.env.REST_API_URL;

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