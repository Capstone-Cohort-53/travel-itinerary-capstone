import {redirect} from "react-router";
import type {Route} from "./+types/accept-invitation";
import {getTripInviteByToken} from "~/utils/models/trip-invite.model";
import {AcceptInviteFormSchema, MemberSchema, postMember} from "~/utils/models/member.model";
import {getSession, requireSignedInUser} from "~/utils/session.server";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {GoogleSignInButton} from "~/components/google-sign-in";
import {AcceptInviteForm} from "~/routes/accept-invitation/accept-invite-form";
// reuse the roster's colored status badge so both pages match
import {InviteStatusBadge} from "~/routes/travel-itinerary/traveler-row";
import {Crown, Gem, GemDivider, Parchment, RoyalPage, emphasis, headline} from "~/components/royal";


// public page: the invitee usually has no account yet, so no requireSignedInUser.
// the secret token in the URL identifies the invitation instead.
export async function loader({request, params}: Route.LoaderArgs) {
    const invitation = await getTripInviteByToken(params.token)
    const session = await getSession(request.headers.get("Cookie"))
    const profile = session.get("profile")
    return {
        invitation,
        token: params.token,
        signedInName: profile?.name ?? null,
        googleClientId: process.env.GOOGLE_CLIENT_ID ?? null,
    }
}


// the RSVP: only reachable once signed in, since the form only shows then
export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse | Response> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    // never trust the browser: validate again with the same schema the form used
    const result = AcceptInviteFormSchema.safeParse(formData)
    if (!result.success) {
        return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
    }

    const status = await postMember({...result.data, token: params.token}, signedInUser)
    const member = MemberSchema.safeParse(status.data)
    if (status.status !== 201 || !member.success) {
        return {success: false, status}
    }
    return redirect(`/travel-itinerary/${member.data.tripId}`)
}


/** The crown flanked by two gems, above the summons (from the design). */
function SummonsCrest() {
    return (
        <div aria-hidden="true" className="flex items-end gap-2.5">
            <Gem color="lilac" size={24}/>
            <Crown size={48}/>
            <Gem color="pink" size={24}/>
        </div>
    )
}

/** The trip title as the headline, with its last word in italic watermelon ("Destination *Wedding*"). */
function TripTitle({title}: { title: string }) {
    const words = title.trim().split(/\s+/)
    const last = words.pop()
    return (
        <h1 className={`${headline} break-words text-center text-4xl sm:text-6xl lg:text-7xl`}>
            {words.length > 0 && <>{words.join(' ')}{' '}</>}<em className={emphasis}>{last}</em>
        </h1>
    )
}

export default function AcceptInvite(props: Route.ComponentProps) {
    const {invitation, token, signedInName, googleClientId} = props.loaderData

    if (invitation === null) {
        return (
            <RoyalPage width="max-w-xl">
                <Parchment compact>
                    <div className="flex flex-col items-center gap-4 text-center">
                        <SummonsCrest/>
                        <h1 className={`${headline} text-3xl sm:text-4xl`}>Invitation <em className={emphasis}>not found</em></h1>
                        <p className="text-bay">This royal summons could not be found. Please check the link you were sent.</p>
                    </div>
                </Parchment>
            </RoyalPage>
        )
    }

    const {trip} = invitation
    const statusMessages = {
        accepted: 'This invitation has already been accepted.',
        declined: 'This invitation was declined.',
        expired: 'This invitation has expired.',
    }

    return (
        <RoyalPage width="max-w-4xl">
        <Parchment>
        <div className="flex flex-col gap-8">

            {/* the summons: crest, greeting, the trip title as the headline, destination and dates.
                timeZone UTC matches the itinerary page so dates don't show a day early */}
            <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
                <SummonsCrest/>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-royal-red sm:text-sm">
                    You have been summoned
                </p>
                <p className="break-words font-display text-lg italic text-bay sm:text-2xl">
                    Dear {invitation.inviteeName}, {invitation.organizerName} requests the pleasure of your company at
                </p>
                <TripTitle title={trip.title}/>
                <p className="break-words text-xs font-bold uppercase tracking-[0.2em] text-bay">
                    {trip.destination}
                    <span aria-hidden="true"> · </span>
                    <span className="sr-only">, </span>
                    {trip.startDate.toLocaleDateString('en-US', {timeZone: 'UTC'})} – {trip.endDate.toLocaleDateString('en-US', {timeZone: 'UTC'})}
                </p>
                <div className="w-full max-w-md">
                    <GemDivider/>
                </div>
            </div>

            <div className="mx-auto w-full max-w-lg">
            {invitation.status !== 'pending' ? (
                // the message plus the same colored badge the roster uses
                <div className="flex flex-col items-center gap-3 text-center">
                    <InviteStatusBadge status={invitation.status}/>
                    <p className="font-display text-xl font-bold italic text-navy sm:text-2xl">
                        {statusMessages[invitation.status]}
                    </p>
                </div>
            ) : (
                signedInName === null ? (
                    // sign in first: heading and helper line, centered Google button
                    <div className="flex flex-col items-center gap-3 text-center">
                        <h2 className="font-display text-2xl font-bold italic text-navy sm:text-[26px]">
                            Accept your invitation
                        </h2>
                        <p className="break-words text-bay">
                            Sign in with Google to accept your invitation to {trip.title}. New here? Signing in with Google creates your account.
                        </p>
                        {googleClientId && (
                            <div className="mt-2 flex justify-center">
                                <GoogleSignInButton clientId={googleClientId} text="signup_with"
                                                    redirectTo={`/accept-invitation/${token}`}/>
                            </div>
                        )}
                    </div>
                ) : (
                    <AcceptInviteForm tripTitle={trip.title} signedInName={signedInName}/>
                )
            )}
            </div>

        </div>
        </Parchment>
        </RoyalPage>
    )
}
