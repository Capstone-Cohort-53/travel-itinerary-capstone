import type {Route} from "./+types/create-trip";
import {requireSignedInUser} from "~/utils/session.server";
import {postTrip} from "~/utils/models/trip.model";
import {emptyTrip, TripFormPage} from "~/routes/create-trip/trip-form";
import {handleTripForm} from "~/routes/create-trip/trip-form.server";

// Retro Sunset colors
const navy = "#031136";

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
            heading="Create a New Trip"
            defaultValues={emptyTrip}
            submitLabel="Save Trip"
            backTo="/my-trips"
            backLabel="My Trips"
            aside={<NextUpCard/>}
        />
    );
}

/** The sunset card beside the form: what happens after the trip is saved. */
function NextUpCard() {
    return (
        <div className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-[#434A90]">
            {/* a half sun setting behind the horizon, with two coral bands across it */}
            <svg viewBox="0 0 256 130" className="block w-full bg-[#031136]" aria-hidden="true">
                <defs>
                    <clipPath id="sun">
                        <circle cx="128" cy="130" r="86"/>
                    </clipPath>
                </defs>
                <g clipPath="url(#sun)">
                    <rect x="0" y="0" width="256" height="130" fill="#FF5903"/>
                    <rect x="0" y="92" width="256" height="12" fill="#FF6B6C"/>
                    <rect x="0" y="108" width="256" height="4" fill={navy}/>
                    <rect x="0" y="112" width="256" height="10" fill="#FF6B6C"/>
                </g>
            </svg>
            <div className="px-5 py-5 text-white">
                <h2 className="text-xl font-extrabold">Next up</h2>
                <p className="mt-1 text-sm">After you save, add activities to each day and invite your travelers.</p>
            </div>
        </div>
    );
}
