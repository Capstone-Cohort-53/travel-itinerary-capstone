import type {Route} from "./+types/edit-trip";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getTrip, putTrip, toTripForm} from "~/utils/models/trip.model";
import {TripFormPage} from "~/routes/create-trip/trip-form";
import {handleTripForm} from "~/routes/create-trip/trip-form.server";
import {emphasis} from "~/components/royal";

export function meta({}: Route.MetaArgs) {
    return [{title: "Edit Trip | TripsQueen"}];
}

/**
 * Only the trip's owner may edit it (the API enforces the same rule). The saved
 * trip is turned into form values here, so the form starts out showing it.
 */
export async function loader({request, params}: Route.LoaderArgs) {
    const user = await requireSignedInUser(request);
    const {status, trip} = await getTrip(params.tripId, user);

    // the API no longer knows this user: its session ended before ours did
    if (status.status === 401 || status.status === 403) {
        throw await endSession(request);
    }
    if (trip === null) {
        throw new Response(null, {status: 404, statusText: "Trip not found."});
    }
    if (trip.ownerId !== user.profile.id) {
        throw new Response(null, {status: 403, statusText: "Only the trip's organizer can edit it."});
    }

    return {tripId: trip.id, values: toTripForm(trip)};
}

// the form and its checks live in trip-form.tsx, shared with Create Trip
export async function action({request, params}: Route.ActionArgs) {
    return handleTripForm(
        request,
        async (data, user) => {
            // the API replaces every field, image included: keep the trip's current image
            const {status, trip} = await getTrip(params.tripId, user);
            if (trip === null) return status;
            return putTrip(params.tripId, data, trip.image, user);
        },
        // back to the itinerary, which shows the change
        () => `/trip-itinerary/${params.tripId}`,
    );
}

export default function EditTrip({loaderData}: Route.ComponentProps) {
    const {tripId, values} = loaderData;
    return (
        <TripFormPage
            eyebrowText="Amend the decree"
            heading={<>Edit <em className={emphasis}>this trip</em></>}
            intro="Change the name, place, dates or description, then seal it to save."
            defaultValues={values}
            submitLabel={<>Seal it<br/>Save<br/>changes</>}
            backTo={`/trip-itinerary/${tripId}`}
            backLabel="Back to trip"
        />
    );
}
