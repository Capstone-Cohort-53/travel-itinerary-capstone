import {redirect, useFetcher} from "react-router";
import type {Route} from "./+types/edit-activity";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {
    ActivityFormSchema,
    deleteActivity,
    getActivity,
    putActivity,
    toActivityForm,
    toActivityRequest
} from "~/utils/models/activity.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";
import {geocodeAddress} from "~/utils/geocode.server";
import {ActivityFormPage, isDuringTrip} from "~/routes/activity/activity-form";


/**
 * Only the trip's owner may edit or delete activities (the API enforces the
 * same rule). The saved activity is turned back into form values here, on the
 * server, so the form starts out showing what was saved.
 */
export async function loader({request, params}: Route.LoaderArgs) {
    const signedInUser = await requireSignedInUser(request)

    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        throw new Response(null, {status: 404, statusText: 'Trip not found.'})
    }
    if (trip.ownerId !== signedInUser.profile.id) {
        throw new Response(null, {status: 403, statusText: 'Only the trip owner can edit activities.'})
    }

    const activity = await getActivity(params.id, params.activityId, signedInUser)
    if (activity === null) {
        throw new Response(null, {status: 404, statusText: 'Activity not found.'})
    }

    return {trip, values: toActivityForm(activity)}
}


/**
 * Both buttons post here. The delete button sends `intent=delete`; the form's
 * Save button sends the activity's fields.
 */
export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse | Response> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    if (formData.intent === 'delete') {
        const status = await deleteActivity(params.id, params.activityId, signedInUser)
        if (status.status !== 200) {
            return {success: false, status}
        }
        return redirect(`/trip-itinerary/${params.id}`)
    }

    // never trust the browser: validate again with the same schema the form used
    const result = ActivityFormSchema.safeParse(formData)
    if (!result.success) {
        return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
    }

    // the activity has to fall within the trip
    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        return {success: false, status: {status: 404, data: null, message: 'Trip not found.'}}
    }
    if (!isDuringTrip(result.data, trip)) {
        return {success: false, status: {status: 400, data: null, message: 'The start and end must be during the trip.'}}
    }

    // PUT replaces every field, so look the address up again: it may have changed
    const coordinates = await geocodeAddress(result.data.address || null)
    const status = await putActivity(params.id, params.activityId, toActivityRequest(result.data, coordinates), signedInUser)
    if (status.status !== 200) {
        return {success: false, status}
    }

    // back to the trip's itinerary, which shows the change
    return redirect(`/trip-itinerary/${params.id}`)
}


export default function EditActivity({loaderData}: Route.ComponentProps) {
    const {trip, values} = loaderData
    return (
        <ActivityFormPage
            trip={trip}
            defaultValues={values}
            heading="Edit Activity"
            intro={`Update “${values.name}” on your shared trip itinerary.`}
            submitLabel="Save Changes"
            footer={<DeleteActivityButton activityName={values.name}/>}
        />
    )
}


/** Asks first, then deletes the activity and returns to the itinerary. */
function DeleteActivityButton({activityName}: { activityName: string }) {
    const fetcher = useFetcher<FormActionResponse>()
    const isDeleting = fetcher.state !== 'idle'

    return (
        <section className="flex flex-col gap-3 rounded-3xl border-2 border-dashed border-[#031136]/40 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#031136]">
                <p className="font-bold">Delete this activity</p>
                <p>It's removed from the itinerary for everyone. This can't be undone.</p>
            </div>
            <fetcher.Form
                method="post"
                onSubmit={(event) => {
                    if (!window.confirm(`Delete “${activityName}”? This can't be undone.`)) {
                        event.preventDefault()
                    }
                }}
            >
                <input type="hidden" name="intent" value="delete"/>
                <button
                    type="submit"
                    disabled={isDeleting}
                    className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] bg-[#FF6B6C] text-[#031136] font-bold text-sm hover:bg-[#FF6B6C]/90 transition disabled:opacity-50"
                >
                    {isDeleting ? 'Deleting…' : 'Delete Activity'}
                </button>
            </fetcher.Form>
            <StatusMessage actionData={fetcher.data}/>
        </section>
    )
}
