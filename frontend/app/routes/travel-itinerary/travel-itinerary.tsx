import {createTheme, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";
// TravelerRow = table row (tablet/desktop), TravelerCard = stacked row (phones)
import {TravelerCard, TravelerRow} from "~/routes/travel-itinerary/traveler-row";
import {InviteForm} from "~/routes/travel-itinerary/invite-form";
import type {Route} from "./+types/travel-itinerary";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {getTripInviteKitchenSink, postTripInvite, TripInviteFormSchema} from "~/utils/models/trip-invite.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
// table colors from the mockup: navy header with white uppercase text,
// white rows separated by a thin lavender line (no stripes)
const navyTableTheme = createTheme({
    table: {
        head: {
            base: "text-xs uppercase text-white",
            cell: {
                base: "bg-[#0B1533] px-4 py-3 text-white"
            }
        },
        row: {
            base: "bg-white border-b border-[#F7EEF6] text-[#0B1533]"
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
}


export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

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
const {trip, travelers } = props.loaderData
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

    // shared look for every stat card: rounded, navy border and text.
    // min-w-0 + break-words keep long text (like traveler names) inside the card on small screens
    const cardBase = 'min-w-0 break-words rounded-2xl border border-[#0B1533] p-3 sm:p-4 text-[#0B1533]'

    return (
        // flat lavender page background (replaces the bg_reduced.jpeg photo)
        <div className="min-h-screen bg-[#F7EEF6] py-8">
        {/* px-4 keeps content off the screen edges on phones */}
        <main className="container mx-auto max-w-3xl px-4 sm:px-0">
            {/* header: small indigo trip title, big navy page title, then destination and dates */}
            <p className={'text-sm font-bold tracking-wider text-[#3A4187] mb-1'}>{trip.title}</p>
            <h1 className={'text-3xl sm:text-4xl font-bold tracking-wider text-[#0B1533] mb-2'}>Travelers & Invites</h1>
            <h2 className = {'text-base sm:text-xl font-bold tracking-wider text-[#0B1533] mb-6'}>
                {trip.destination} · {trip.startDate.toLocaleDateString('en-US', {timeZone:'UTC'})} - {trip.endDate.toLocaleDateString('en-US', {timeZone:'UTC'})}</h2>


            {/* stat cards: three across at every width; Status spans the full row underneath */}
            <section className={'grid grid-cols-3 items-start gap-2 sm:gap-4 mb-6'}>

                {/* orange card: total attending plus the names of everyone going */}
                <div className={`${cardBase} bg-[#FFA06B]`}>
                    <p className="text-2xl sm:text-4xl font-bold">{totalTravelers}</p>
                    <h5 className="text-xs sm:text-sm font-bold">Total Attendance</h5>
                    <p className="mt-2 text-xs">
                        Traveler Names:  {going.map((t) => t.profile?.name ?? t.invite.name).join(', ')}
                    </p>
                </div>

                {/* purple card: adults going */}
                <div className={`${cardBase} bg-[#C19AC5]`}>
                    <p className="text-2xl sm:text-4xl font-bold">{totalAdults}</p>
                    <p className="text-xs sm:text-sm font-bold">Adult Count</p>
                </div>

                {/* coral card: children going */}
                <div className={`${cardBase} bg-[#FF8A85]`}>
                    <p className="text-2xl sm:text-4xl font-bold">{totalChildren}</p>
                    <p className="text-xs sm:text-sm font-bold">Children Count</p>
                </div>

                {/* white Status card (matches the roster card): spans all three columns so it fills the row under the stat cards */}
                <div className={`${cardBase} bg-white col-span-3`}>
                    <h5 className="text-xs sm:text-sm font-bold mb-2">Status</h5>
                    {/* horizontal: 2x2 on phones, all four counts in one row on tablet and up */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                        <p>Going: <span className="font-bold">{totalGoing}</span></p>
                        <p>Not Going: <span className="font-bold">{totalNotGoing}</span></p>
                        <p>Maybe: <span className="font-bold">{totalMaybe}</span></p>
                        <p>Pending: <span className="font-bold">{totalPending}</span></p>
                    </div>
                </div>
            </section>


            {/* white roster card with a navy border, like the mockup */}
            <section className="mb-6 overflow-hidden rounded-2xl border border-[#0B1533] bg-white">
                <h2 className="px-4 py-4 text-xl sm:text-2xl font-bold text-[#0B1533]">Traveler Roster</h2>

                {/* phones: stacked rows */}
                <ul className="sm:hidden border-t border-[#0B1533]">
                    {travelers.length === 0
                        ? <li className="px-4 py-3 text-sm text-[#0B1533]">No travelers invited yet</li>
                        : travelers.map((traveler) => <TravelerCard key={traveler.invite.id} traveler={traveler}/>)}
                </ul>

                {/* tablet and up: full table */}
                <div className="hidden sm:block overflow-x-auto">
                <Table theme={navyTableTheme.table}>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>Traveler Name</TableHeadCell>
                            <TableHeadCell>Phone Number</TableHeadCell>
                            <TableHeadCell> Email </TableHeadCell>
                            {/* RSVP = yes/no/maybe; Invite Status = color-coded badge (new column) */}
                            <TableHeadCell>RSVP</TableHeadCell>
                            <TableHeadCell>Invite Status</TableHeadCell>
                            <TableHeadCell>Adults</TableHeadCell>
                            <TableHeadCell>Children</TableHeadCell>
                        </TableRow>
                    </TableHead>

                    <TableBody className={'text-sm text-[#0B1533]'}>
                        {travelers.length === 0
                            ? <TableRow><TableCell colSpan={7 /* 7 columns now that Invite Status was added */}>No travelers invited yet</TableCell></TableRow>
                            : travelers.map((traveler) => <TravelerRow key={traveler.invite.id} traveler={traveler}/>)}

                    </TableBody>
                </Table>
                </div>
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