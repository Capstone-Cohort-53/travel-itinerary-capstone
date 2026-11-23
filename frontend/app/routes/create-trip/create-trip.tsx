import type {Route} from "./+types/create-trip";
import {requireSignedInUser} from "~/utils/session.server";
import {postTrip} from "~/utils/models/trip.model";
import {emptyTrip, TripFormPage} from "~/routes/create-trip/trip-form";
import {handleTripForm} from "~/routes/create-trip/trip-form.server";
import {Crown, emphasis} from "~/components/royal";

export function meta({}: Route.MetaArgs) {
    return [{title: "Create Trip | TripsQueen"}];
}

//STEP 4: the loader. Only signed-in users can create a trip
export async function loader({request}: Route.LoaderArgs) {
    await requireSignedInUser(request);
    return null;
}

// the form and its checks live in trip-form.tsx, shared with Edit Trip
export async function action({request}: Route.ActionArgs) {
    // the API requires an image and the form does not ask for one, so every trip gets the site's background photo
    const image = new URL("/bg_reduced.jpeg", request.url).href;
    return handleTripForm(
        request,
        (data, user) => postTrip(data, user, image),
        // the new trip's itinerary
        (status) => `/trip-itinerary/${(status.data as { id: string }).id}`,
    );
}

export default function CreateTrip() {
    return (
        <TripFormPage
            eyebrowText="A new decree"
            heading={<>Proclaim a <em className={emphasis}>new trip</em></>}
            intro="Name it, place it, date it. Activities and invitations come next."
            defaultValues={emptyTrip}
            submitLabel={<>Seal it<br/>Save<br/>trip</>}
            backTo="/my-trips"
            backLabel="My Trips"
            aside={<NextUpCard/>}
        />
    );
}

/** The small card beside the form: what happens after the trip is saved. */
function NextUpCard() {
    return (
        <div className="rounded-2xl border-[1.5px] border-navy bg-lilac/25 p-5">
            <Crown size={28}/>
            <h2 className="mt-2 font-display text-xl font-extrabold text-navy">Next up</h2>
            <p className="mt-1 text-sm text-navy">After you save, add activities to each day and invite your travelers.</p>
        </div>
    );
}
