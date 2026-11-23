import {Link, redirect} from "react-router";
import {z} from "zod";
import type {Route} from "./+types/view-profile";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getProfileByProfileId} from "~/utils/models/profile.model";
import {GemDivider, Parchment, RoyalPage, card, emphasis, eyebrow, headline, outlineButton} from "~/components/royal";

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
        <RoyalPage width="max-w-3xl">
            <Parchment>
                <div className="text-center sm:text-left">
                    <p className={eyebrow}>A member of the court</p>
                    <h1 className={`${headline} mt-3 text-4xl sm:text-5xl`}>Traveler <em className={emphasis}>Profile</em></h1>
                </div>

                <div className="mt-8">
                    {profile === null
                        ? <p role="alert" className="rounded-xl border-[1.5px] border-royal-red bg-royal-red/5 p-5 font-medium text-royal-red">{message ?? "Could not load this profile."}</p>
                        : <div className={`${card} flex flex-col items-center gap-6 bg-white text-center sm:flex-row sm:text-left`}>
                            <img src={profile.image} alt="" className="h-24 w-24 shrink-0 rounded-2xl border-[3px] border-gold bg-lilac object-cover"/>
                            <div className="min-w-0 space-y-2">
                                <h2 className="break-words font-display text-2xl font-bold text-navy sm:text-3xl">{profile.name}</h2>
                                <p className="break-all text-navy">
                                    <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.16em] text-bay">Email</span>
                                    <a href={`mailto:${profile.email}`} className="underline decoration-gold decoration-2 underline-offset-4 hover:text-bay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{profile.email}</a>
                                </p>
                                <p className="text-navy">
                                    <span className="mr-2 text-[11px] font-bold uppercase tracking-[0.16em] text-bay">Cell</span>
                                    {profile.cellNumber ?? "No cell number"}
                                </p>
                                <p className="text-sm text-bay">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    }
                </div>

                <div className="mt-8">
                    <GemDivider/>
                </div>
                <Link to="/my-trips" className={`${outlineButton} mt-6 w-full sm:w-auto`}>← Back to My Trips</Link>
            </Parchment>
        </RoyalPage>
    );
}
