import {createTheme, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";
import { Card } from "flowbite-react";
import {TravelerRow} from "~/routes/travel-itinerary/traveler-row";
import {InviteForm} from "~/routes/travel-itinerary/invite-form";
import type {Route} from "./+types/travel-itinerary";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {getTripInviteKitchenSink, postTripInvite, TripInviteFormSchema} from "~/utils/models/trip-invite.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {AcceptInviteFormSchema, putMember} from "~/utils/models/member.model";
import {UpdateRsvpForm} from "~/routes/travel-itinerary/update-rsvp-form";
const coralTableTheme = createTheme({
    table: {
        head: {
            base: "text-sm text-white",
            cell: {
                base: "bg-[#FD6B6C] px-6 py-3 text-white"
            }
        },
        row: {
            striped: "odd:bg-white even:bg-[#FFF0F1]"
        }
    }
});



export async function loader ({request, params}: Route.LoaderArgs) {
// console.log(params.id)
    const signedInUser= await requireSignedInUser(request)
    // grab the trip by trip Id

    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        return {trip, travelers: []}
    }

    const travelers = await getTripInviteKitchenSink(trip.id,signedInUser )
        return {trip, travelers}

    const myMember = travelers.find(
        (t) => t.invite.acceptedProfileId === signedInUser.profile.id
    )?.member ?? null
        return {trip, travelers, myMember}
}


export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    if (formData.intent === 'update-rsvp') {
        const result = AcceptInviteFormSchema.safeParse(formData)
        if (!result.success) {
            return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
        }
        const status = await putMember(String(formData.memberId), result.data, signedInUser)
        if (status.status !== 200) {
            return {success: false, status}
        }
        return {success: true, status: {...status, message: 'Your RSVP was updated!'}}
    }

    // never trust the browser: validate again with the same schema the form used
    const result = TripInviteFormSchema.safeParse(formData)
    if (!result.success) {
        return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
    }

    const {name, email, cellNumber, expiresAt} = result.data
    const status = await postTripInvite(params.id, {
        name,
        email: email || undefined,          // '' means not provided
        cellNumber: cellNumber || undefined,
        expiresAt: expiresAt || null,
    }, signedInUser)

    if (status.status !== 201) {
        return {success: false, status}
    }
    return {success: true, status: {...status, message: `Invitation sent to ${name}!`}}

}



export default function TravelItinerary(props: Route.ComponentProps) {
const {trip, travelers, myMember } = props.loaderData
    if (trip === null) {
        return <>
        <h1> trip not found</h1>

        </>

    }

    const going = travelers.filter((t) => t.member?.going === 'yes')
    const totalGoing = going.length
    const totalNotGoing = travelers.filter((t) => t.member?.going === 'no' || t.invite.status === 'declined').length
    const totalMaybe = travelers.filter((t) => t.member?.going === 'maybe').length
    const totalPending = travelers.filter((t) => t.invite.status === 'pending').length
    const totalAdults = going.reduce((sum, t) => sum + (t.member?.adults ?? 0), 0)
    const totalChildren = going.reduce((sum, t) => sum + (t.member?.children ?? 0), 0)
    const totalTravelers = totalAdults + totalChildren

    return (

        <div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-right bg-no-repeat">

        <main className="min-h-screen container mx-auto max-w-3xl">
            <h1 className={'text-4xl font-bold tracking-wider text-white mb-6'}>Travelers & Invites</h1>

            <h1 className={'text-xl font-bold tracking-wider text-white mb-2'}>{trip.title}</h1>
            {myMember && <UpdateRsvpForm member={myMember}/>}
            <h2 className = {'text-xl font-bold tracking-wider text-white mb-6'}>
                {trip.destination} · {trip.startDate.toLocaleDateString('en-US', {timeZone:'UTC'})} - {trip.endDate.toLocaleDateString('en-US', {timeZone:'UTC'})}</h2>


            <section className={''}>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                <Table striped theme={coralTableTheme.table}>
                    <TableHead className={'text-bold'}>
                        <TableRow>
                            <TableHeadCell>Traveler Name</TableHeadCell>
                            <TableHeadCell>Phone Number</TableHeadCell>
                            <TableHeadCell> Email </TableHeadCell>
                            <TableHeadCell>Status</TableHeadCell>
                            <TableHeadCell>Adults</TableHeadCell>
                            <TableHeadCell>Children</TableHeadCell>
                        </TableRow>
                    </TableHead>

                    <TableBody className={'text-center text-bold text-sm text-gray-700'}>
                        {travelers.length === 0
                            ? <TableRow><TableCell colSpan={6}>No travelers invited yet</TableCell></TableRow>
                            : travelers.map((traveler) => <TravelerRow key={traveler.invite.id} traveler={traveler}/>)}

                    </TableBody>
                </Table>
            </div>


            </section>


            <section className={'gap-6 overflow-x-auto flex rounded-xl my-8'}>

                <Card href="#" className=" space-y-4 w-sm hover:bg-[#FFF0F1]">
                    <h5 className="text-2xl font-bold tracking-wider text-gray-500">
                        Status 📊:
                    </h5>
                    <p className="leading-loose font-normal text-gray-700">
                        🟢 Going: {totalGoing}
                    </p>


                    <p className=" leading-loose font-normal text-gray-700">
                        🔴 Not Going: {totalNotGoing}
                    </p>
                    <p className="leading-loose font-normal text-gray-700">
                        ⚪ Maybe: {totalMaybe}
                    </p>
                    <p className="leading-loose font-normal text-gray-700">
                        ⏳ Pending: {totalPending}
                    </p>
                </Card>

                <Card href="#" className="w-sm hover:bg-[#FFF0F1]">
                    <h5 className="leading-loose text-2xl font-bold tracking-wider text-gray-500">
                        Total Attendance 👥:  {totalTravelers}
                    </h5>

                    <p className=" leading-loose font-normal text-gray-700">
                        Traveler Names:  {going.map((t) => t.profile?.name ?? t.invite.name).join(', ')}
                    </p>

                    <p className="leading-loose font-normal text-gray-700">
                        Adult Count: {totalAdults}

                    </p>

                    <p className=" leading-loose font-normal text-gray-700">
                        Children Count: {totalChildren}
                    </p>


                </Card>

            </section>



            <section>
                <InviteForm/>
            </section>


        </main>
        </div>
    )
}
// Might want to incorporate for final submission:
//Breadcrumbs or a "Back" Button: Since this is a specific trip's roster, a simple link at the very top left (like ← Back to Dashboard or Trips / Summer Vacation / Invites) helps users orient themselves.
//
// Table Action Buttons: Your Traveler Roster displays data, but there is no way to manage it. Adding an "Actions" column with Edit (✏️) and Delete (🗑️) icons would allow users to update RSVPs or remove guests.
//
// Manual "Add Guest" Option: You have a form to send email invitations, but you may want a button to manually add a traveler to the roster (e.g., for children or guests without email).
//
// Success Notifications (Toasts): When a user clicks "Send Invitations," there is currently no placeholder for a success message. Adding a temporary pop-up (toast) confirming the emails were sent provides necessary user feedback.