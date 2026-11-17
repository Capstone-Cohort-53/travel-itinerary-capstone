import {z} from "zod";
import type {Status} from "~/utils/interfaces/Status";
import {failedRequestStatus, REQUEST_TIMEOUT_MS, REST_URL} from "~/utils/request.utils";

export const GoogleSignInSchema = z.object({
    credential: z.string("a Google credential is required").min(1, "a Google credential is required"),
});

export async function postGoogleSignIn(credential:string): Promise <{status:Status, headers:Headers} > {
    try {
        const response = await fetch(`${REST_URL}/sign-in`, {
            method: "POST",
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${credential}`,
            }
        })
        const body = await response.json().catch(error => error)
        if (response.status === 200) {
            return {status: {status: 200, data: body, message: null}, headers: response.headers}
        }

        return {
            status: {
                status: response.status,
                data: null,
                message: body?.message ?? 'Failed to sign in. Please try again.',
            },
            headers: response.headers,
        };

    } catch (error) {
        // fetch itself rejected: the server was not reached, or did not answer in time
        console.error('sign-in request failed:', error);
        return { status: failedRequestStatus(error), headers: new Headers() };
    }
}