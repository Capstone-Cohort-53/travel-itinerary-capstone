import {redirect} from "react-router";
import type {Route} from "./+types/activity";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {
    ActivityFormSchema,
    coordinatesFromForm,
    firstPin,
    getActivitiesByTripId,
    postActivity,
    toActivityRequest
} from "~/utils/models/activity.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {geocodeAddress} from "~/utils/geocode.server";
import {
    ActivityFormPage,
    defaultActivityDate,
    emptyActivityValues,
    isDuringTrip,
    toDateString
} from "~/routes/activity/activity-form";
import {emphasis} from "~/components/royal";


/**
 * Only the trip's owner may add activities (the API enforces the same rule).
 * The trip is loaded so the header can show its title and the date picker can
 * be limited to the trip's dates.
 */
export async function loader({request, params}: Route.LoaderArgs) {
    const signedInUser = await requireSignedInUser(request)

    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        throw new Response(null, {status: 404, statusText: 'Trip not found.'})
    }
    if (trip.ownerId !== signedInUser.profile.id) {
        throw new Response(null, {status: 403, statusText: 'Only the trip owner can add activities.'})
    }

    // worked out here, on the server, so the page renders the same date in the browser
    const startDate = defaultActivityDate(toDateString(trip.startDate), toDateString(trip.endDate))

    // a pin on the trip helps the place search tell apart destinations with the same name
    const {activities} = await getActivitiesByTripId(trip.id, signedInUser)

    return {trip, startDate, searchNear: firstPin(activities)}
}


export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse | Response> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

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

    // the pin of the place picked from the suggestions, or else look the address up;
    // if that fails too, the activity still saves without a pin
    const coordinates = coordinatesFromForm(result.data) ?? await geocodeAddress(result.data.address || null)
    const status = await postActivity(params.id, toActivityRequest(result.data, coordinates), signedInUser)
    if (status.status !== 201) {
        return {success: false, status}
    }

    // back to the trip's itinerary, which lists its activities
    return redirect(`/trip-itinerary/${params.id}`)
}


export default function Activity({loaderData}: Route.ComponentProps) {
    const {trip, startDate, searchNear} = loaderData
    return (
        <ActivityFormPage
            trip={trip}
            // starts on the default day at 9:00 AM; the organizer can change or clear it
            defaultValues={{...emptyActivityValues, startDatetime: `${startDate}T09:00`}}
            eyebrowText="Add to the decree"
            heading={<>Add an <em className={emphasis}>activity</em></>}
            intro="Add an event to your shared trip itinerary."
            submitLabel={<>Add to<br/>the<br/>decree</>}
            searchNear={searchNear}
            showIdeas
        />
    )
}
