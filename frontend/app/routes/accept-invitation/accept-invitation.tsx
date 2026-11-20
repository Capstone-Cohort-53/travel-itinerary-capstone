import {Card} from "flowbite-react";
import {redirect} from "react-router";
import type {Route} from "./+types/accept-invitation";
import {getTripInviteByToken} from "~/utils/models/trip-invite.model";
import {AcceptInviteFormSchema, MemberSchema, postMember} from "~/utils/models/member.model";
import {getSession, requireSignedInUser} from "~/utils/session.server";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {GoogleSignInButton} from "~/components/google-sign-in";
import {AcceptInviteForm} from "~/routes/accept-invitation/accept-invite-form";


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

    if (invitation === null) {
        return (
            <div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-right bg-no-repeat">
                <section className={'gap-6 auto rounded-xl min-h-screen container mx-auto max-w-md '}>
                    <h1 className={'text-4xl font-bold tracking-wider text-white'}>Invitation not found</h1>
                </section>
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

<div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-right bg-no-repeat">



{/*need to link title for You are invited to text*/}
        <section className={'gap-6 auto rounded-xl min-h-screen container mx-auto max-w-md '}>

            <h1 className={'text-4xl font-bold tracking-wider text-white'}>Accept Invitation</h1>

            <Card href="#" className=" mt-8 hover:bg-[#FFF0F1]">
                <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                    Hi {invitation.inviteeName}, you are invited!
                </h5>

                <p className="font-bold text-lg text-gray-700">
                    {trip.title}
                </p>
                <p className="font-bold text-lg text-gray-700">
                    Invited by {invitation.organizerName}
                </p>
                <div className="flex gap-4">
                    <p className="font-bold text-lg text-gray-700  ">
                        Destination: {trip.destination}
                    </p>
                </div>
                <div>
                    <p className="font-normal text-lg text-gray-700 ">
                        Trip Start Date: {trip.startDate.toLocaleDateString()}
                    </p>
                    <p className="font-normal text-lg text-gray-700 ">
                        Trip End Date: {trip.endDate.toLocaleDateString()}
                    </p>
                </div>


            </Card>

            {invitation.status !== 'pending' ? (
                <Card className=" mt-8 mx-auto max-w-md">
                    <p className="font-bold text-lg text-gray-700">
                        {statusMessages[invitation.status]}
                    </p>
                </Card>
            ) : (
                signedInName === null ? (
                    <Card className="mt-8 mx-auto max-w-md hover:bg-[#FFF0F1]">
                        <h5 className="text-2xl font-bold tracking-tight text-gray-500">
                            Sign in with Google to accept your invitation to {trip.title}!
                        </h5>
                        <p className="font-normal text-gray-700">
                            New here? Signing in with Google creates your account.
                        </p>
                        {googleClientId && (
                            <GoogleSignInButton clientId={googleClientId} text="signup_with"
                                                redirectTo={`/accept-invitation/${token}`}/>
                        )}
                    </Card>
                ) : (
                    <AcceptInviteForm tripTitle={trip.title} signedInName={signedInName}/>
                )
            )}


        </section>
        </div>
    )
}
