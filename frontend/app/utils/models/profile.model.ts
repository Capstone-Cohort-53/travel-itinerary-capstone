import {z} from "zod";
import type {Status} from "~/utils/interfaces/Status";
import {failedRequestStatus, getRequest, REQUEST_TIMEOUT_MS, REST_URL} from "~/utils/request.utils";
import type {SignedInUser} from "~/utils/session.server";

//STEP 1: the whole profile, mirroring the backend's ProfileSchema (backend/src/apis/profile/profile.model.ts)
export const ProfileSchema =
    z.object({
        id: z.uuidv7('please provide a valid uuid for id'),
        email: z
            .email('please provide a valid email')
            .max(255,'please provide a valid email (255 characters)'),
        cellNumber: z.string('please provide a valid cellNumber')
            .max(20,'please provide 20 characters').nullable(),
        createdAt: z.coerce.date('please provide a valid created at'),
        name:z.string('please provide a valid name')
            .max(255,'please provide a valid name (255 characters)'),
        image: z.url('please provide a valid image')
            .max(255,'please provide a valid image (255 characters)')
    })
export type Profile = z.infer<typeof ProfileSchema>

//STEP 2: only what the edit profile form lets the user type.
// id, email and createdAt are owned by the server and are never sent.
// cellNumber is a plain string here because an <input> always holds a string;
// putProfile turns an empty one into null.
export const EditProfileSchema = z.object({
    name: z.string('please provide a valid name')
        .trim()
        .min(1, 'please provide a name')
        .max(255, 'please provide a valid name (255 characters)'),
    cellNumber: z.string('please provide a valid cell number')
        .trim()
        .max(20, 'please provide a cell number of 20 characters or less'),
    image: z.url('please provide a valid image url')
        .max(255, 'please provide a valid image url (255 characters)'),
})

//STEP 3: the type the form's defaultValues use
export type EditProfile = z.infer<typeof EditProfileSchema>

export type ProfileResult = { status: Status; profile: Profile | null }
export type ProfilesResult = { status: Status; profiles: Profile[] }

/**
 * GET /apis/profile/me: the signed-in user's own profile, fresh from the database.
 * Never throws: every failure comes back as a Status.
 */
export async function getProfileMe(user: SignedInUser): Promise<ProfileResult> {
    const status = await getRequest('/profile/me', user)
    if (status.status !== 200) {
        return {status, profile: null}
    }

    const validationResult = ProfileSchema.safeParse(status.data)
    if (!validationResult.success) {
        return {
            status: {status: 502, data: null, message: 'Could not read your profile. Please try again.'},
            profile: null
        }
    }
    return {status, profile: validationResult.data}
}

/**
 * GET /apis/profile/:id: anyone's profile, by id.
 * A 404 means no profile has that id. Never throws: every failure comes back as a Status.
 */
export async function getProfileByProfileId(id: string, user?: SignedInUser): Promise<ProfileResult> {
    const status = await getRequest(`/profile/${id}`, user)
    if (status.status !== 200) {
        return {status, profile: null}
    }

    const validationResult = ProfileSchema.safeParse(status.data)
    if (!validationResult.success) {
        return {
            status: {status: 502, data: null, message: 'Could not read this profile. Please try again.'},
            profile: null
        }
    }
    return {status, profile: validationResult.data}
}

/**
 * GET /apis/trip/:tripId/member: the profiles of everyone on a trip.
 * The API only answers members of the trip (403 otherwise).
 */
export async function getProfilesByTripId(tripId: string, user: SignedInUser): Promise<ProfilesResult> {
    const status = await getRequest(`/trip/${tripId}/member`, user)
    if (status.status !== 200) {
        return {status, profiles: []}
    }

    const validationResult = ProfileSchema.array().safeParse(status.data)
    if (!validationResult.success) {
        return {
            status: {status: 502, data: null, message: 'Could not read the trip members. Please try again.'},
            profiles: []
        }
    }
    return {status, profiles: validationResult.data}
}

export type PutProfileResult = { status: Status; profile: Profile | null; authorization: string | null }

/**
 * PUT /apis/profile/:id: saves the signed-in user's edits.
 *
 * The id comes from the session, never from the form. The API also checks that
 * it matches its own session, so nobody can edit someone else's profile.
 *
 * On success the API mints a new CSRF token and sends it in the Authorization
 * response header; the old token stops working. The caller has to store it.
 * Never throws: every failure comes back as a Status.
 */
export async function putProfile(data: EditProfile, user: SignedInUser): Promise<PutProfileResult> {
    // serverValidate hands back the raw form values, so trim here
    const cellNumber = data.cellNumber.trim()
    const body = {
        name: data.name.trim(),
        cellNumber: cellNumber === '' ? null : cellNumber,
        image: data.image.trim(),
    }

    try {
        const response = await fetch(`${REST_URL}/profile/${user.profile.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: user.authorization,
                Cookie: user.cookie,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })

        // parse the body defensively: an error response may not carry JSON
        const responseBody = await response.json().catch(() => null)

        if (response.status !== 200) {
            return {
                status: {
                    status: response.status,
                    data: null,
                    message: responseBody?.message ?? 'Could not update your profile. Please try again.'
                },
                profile: null,
                authorization: null,
            }
        }

        const validationResult = ProfileSchema.safeParse(responseBody)
        if (!validationResult.success) {
            return {
                status: {status: 502, data: null, message: 'Could not read your updated profile. Please try again.'},
                profile: null,
                authorization: null,
            }
        }

        return {
            status: {status: 200, data: validationResult.data, message: 'Profile updated!'},
            profile: validationResult.data,
            authorization: response.headers.get('Authorization'),
        }
    } catch (error) {
        console.error(`PUT /profile/${user.profile.id} failed:`, error)
        return {status: failedRequestStatus(error), profile: null, authorization: null}
    }
}
