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


export default function AcceptInvite(props: Route.ComponentProps) {
    const {invitation, token, signedInName, googleClientId} = props.loaderData

    // shared look for every card, same as cardBase on the travel itinerary page:
    // rounded, navy border and text; min-w-0 + break-words keep long text inside the card on phones
    const cardBase = 'min-w-0 break-words rounded-2xl border border-[#0B1533] p-4 text-[#0B1533]'

    if (invitation === null) {
        return (
            // flat lavender page background (replaces the bg_reduced.jpeg photo)
            <div className="min-h-screen bg-[#F7EEF6] py-8">
                {/* px-4 keeps content off the screen edges on phones */}
                <main className="container mx-auto max-w-md px-4 sm:px-0">
                    {/* purple bordered card with navy text */}
                    <div className={`${cardBase} bg-[#C19AC5]`}>
                        <h1 className={'text-2xl sm:text-3xl font-bold tracking-wider'}>Invitation not found</h1>
                    </div>
                </main>
            </div>
        )
    }

    const {trip} = invitation
    const statusMessages = {
        accepted: 'This invitation has already been accepted.',
        declined: 'This invitation was declined.',
        expired: 'This invitation has expired.',
    }

    return (
        // flat lavender page background (replaces the bg_reduced.jpeg photo)
        <div className="min-h-screen bg-[#F7EEF6] py-8">

{/*need to link title for You are invited to text*/}
        {/* px-4 keeps content off the screen edges on phones; cards stack with space between */}
        <main className="container mx-auto flex max-w-md flex-col gap-6 px-4 sm:px-0">

            {/* navy page title, same style as "Travelers & Invites" */}
            <h1 className={'text-3xl sm:text-4xl font-bold tracking-wider text-[#0B1533]'}>Accept Invitation</h1>

            {/* purple trip details card, styled like the Adult Count card (was a Flowbite Card linking to "#") */}
            <div className={`${cardBase} bg-[#C19AC5] flex flex-col gap-2`}>
                {/* greeting names the trip; trip-title size (large on phones, larger on tablet and up).
                    the separate trip title line was removed since the greeting now includes it */}
                <h5 className="text-2xl sm:text-3xl font-bold">
                    Hi {invitation.inviteeName}, you are invited to {trip.title}!
                </h5>
                <p className="text-lg font-bold">
                    Invited by {invitation.organizerName}
                </p>
                <p className="text-lg font-bold">
                    Destination: {trip.destination}
                </p>

                {/* dates stack on phones and sit side by side on wider screens;
                    timeZone UTC matches the itinerary page so dates don't show a day early */}
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <p className="text-base">
                        Trip Start Date: {trip.startDate.toLocaleDateString('en-US', {timeZone: 'UTC'})}
                    </p>
                    <p className="text-base">
                        Trip End Date: {trip.endDate.toLocaleDateString('en-US', {timeZone: 'UTC'})}
                    </p>
                </div>
            </div>

            {invitation.status !== 'pending' ? (
                // coral status card: the message plus the same colored badge the roster uses
                <div className={`${cardBase} bg-[#FF8A85] flex flex-col items-start gap-2`}>
                    <InviteStatusBadge status={invitation.status}/>
                    <p className="text-lg font-bold">
                        {statusMessages[invitation.status]}
                    </p>
                </div>
            ) : (
                signedInName === null ? (
                    // coral sign-in card: navy heading and helper line, centered Google button
                    <div className={`${cardBase} bg-[#FF8A85] flex flex-col gap-3`}>
                        <h5 className="text-xl sm:text-2xl font-bold">
                            Sign in with Google to accept your invitation to {trip.title}!
                        </h5>
                        {/* navy (not indigo) so it stays readable on coral */}
                        <p className="text-[#0B1533]">
                            New here? Signing in with Google creates your account.
                        </p>
                        {googleClientId && (
                            <div className="flex justify-center">
                                <GoogleSignInButton clientId={googleClientId} text="signup_with"
                                                    redirectTo={`/accept-invitation/${token}`}/>
                            </div>
                        )}
                    </div>
                ) : (
                    <AcceptInviteForm tripTitle={trip.title} signedInName={signedInName}/>
                )
            )}

        </main>
        </div>
    )
}
