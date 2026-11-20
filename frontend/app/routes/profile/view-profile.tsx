import {Card} from "flowbite-react";
import {Link, redirect} from "react-router";
import {z} from "zod";
import type {Route} from "./+types/view-profile";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getProfileByProfileId} from "~/utils/models/profile.model";

// a read-only view of someone else's profile, e.g. a fellow traveler on a trip
export async function loader({request, params}: Route.LoaderArgs) {
    const user = await requireSignedInUser(request);

    // check the id before asking the API, so a mistyped URL gets a clear message
    const idResult = z.uuidv7().safeParse(params.id);
    if (!idResult.success) {
        return {profile: null, message: "That is not a valid profile link."};
    }

    // your own profile has its own page, with the edit form
    if (idResult.data === user.profile.id) {
        throw redirect("/profile");
    }

    const {status, profile} = await getProfileByProfileId(idResult.data, user);

    if (status.status === 401 || status.status === 403) {
        throw await endSession(request);
    }

    if (status.status === 404) {
        return {profile: null, message: "This traveler could not be found."};
    }

    return {profile, message: profile === null ? status.message : null};
}

export default function ViewProfile(props: Route.ComponentProps) {
    const {profile, message} = props.loaderData;

    return (
        <div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-right bg-no-repeat">
            <main className="min-h-screen container mx-auto max-w-3xl px-4 py-8">
                <h1 className="text-4xl font-bold tracking-wider text-white mb-6">Traveler Profile</h1>

                <Card>
                    {profile === null
                        ? <p role="alert" className="text-red-700">{message ?? "Could not load this profile."}</p>
                        : <div className="flex items-center gap-6">
                            <img src={profile.image} alt="" className="h-20 w-20 rounded-full object-cover"/>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-wider text-gray-700">{profile.name}</h2>
                                <p className="text-gray-700">✉️ <a href={`mailto:${profile.email}`} className="underline">{profile.email}</a></p>
                                <p className="text-gray-700">📱 {profile.cellNumber ?? "No cell number"}</p>
                                <p className="text-sm text-gray-500">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    }
                </Card>

                <Link to="/my-trips" className="mt-6 inline-block text-white underline">← Back to My Trips</Link>
            </main>
        </div>
    );
}
