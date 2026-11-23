import {Link} from "react-router";
import {createTheme, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow} from "flowbite-react";
// TravelerRow = table row (tablet/desktop), TravelerCard = stacked row (phones)
import {TravelerCard, TravelerRow} from "~/routes/travel-itinerary/traveler-row";
import {InviteForm} from "~/routes/travel-itinerary/invite-form";
import type {Route} from "./+types/travel-itinerary";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {
    deleteTripInvite,
    getTripInviteKitchenSink,
    postTripInvite,
    putTripInvite,
    TripInviteEditFormSchema,
    TripInviteFormSchema
} from "~/utils/models/trip-invite.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {AcceptInviteFormSchema, putMember} from "~/utils/models/member.model";
import {UpdateRsvpForm} from "~/routes/travel-itinerary/update-rsvp-form";
// table colors from the mockup: navy header with white uppercase text,
// white rows separated by a thin lavender line (no stripes)
const navyTableTheme = createTheme({
    table: {
        head: {
            base: "text-xs uppercase text-white",
            cell: {
                base: "bg-[#0B1533] px-3 py-3 text-white"
            }
        },
        // less padding than Flowbite's default (px-6 py-4) so the table fits beside the Attendance sidebar
        body: {
            cell: {
                base: "px-3 py-3"
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
        return {trip, travelers: [], myMember: null, isOwner: false}
    }

    const travelers = await getTripInviteKitchenSink(trip.id,signedInUser )


    const myMember = travelers.find(
        (t) => t.invite.acceptedProfileId === signedInUser.profile.id
    )?.member ?? null
    // only the trip owner sees the roster's Edit and Remove buttons
    const isOwner = trip.ownerId === signedInUser.profile.id
        return {trip, travelers, myMember, isOwner}
}


export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    // roster Edit row: fix a pending invite's name, email or cell number
    if (formData.intent === 'edit-invite') {
        const result = TripInviteEditFormSchema.safeParse(formData)
        if (!result.success) {
            return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
        }
        const status = await putTripInvite(params.id, String(formData.inviteId), result.data, signedInUser)
        if (status.status !== 200) {
            return {success: false, status}
        }
        return {success: true, status: {...status, message: 'Traveler updated!'}}
    }

    // roster Remove button: delete the invite (and their spot on the trip, if they accepted)
    if (formData.intent === 'remove-traveler') {
        const status = await deleteTripInvite(params.id, String(formData.inviteId), signedInUser)
        if (status.status !== 200) {
            return {success: false, status}
        }
        return {success: true, status: {...status, message: 'Traveler removed.'}}
    }

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
const {trip, travelers, myMember, isOwner} = props.loaderData
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

    // the four RSVP answers, in the same order and colors as the trip itinerary's Attendance card
    const segments = [
        {label: 'Going', value: totalGoing, color: 'bg-[#434A90]'},
        {label: 'Maybe', value: totalMaybe, color: 'bg-[#C9A3CB]'},
        {label: 'Not going', value: totalNotGoing, color: 'bg-[#FF6B6C]'},
        {label: 'No response', value: totalPending, color: 'bg-gray-200 border border-[#031136]'},
    ]
    const totalAnswers = segments.reduce((sum, segment) => sum + segment.value, 0)
    const goingNames = going.map((t) => t.profile?.name ?? t.invite.name).join(', ')

    return (
        // flat lavender page background (replaces the bg_reduced.jpeg photo)
        <div className="min-h-screen bg-[#F7EEF6] py-8">
        {/* px-4 keeps content off the screen edges on phones */}
        {/* wider on large screens to make room for the Attendance sidebar */}
        <main className="container mx-auto max-w-3xl px-4 sm:px-0 lg:max-w-5xl">
            {/* header: titles on the left, a button back to the trip's activities on the right.
                phones: the button sits under the titles at full width */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    {/* small indigo trip title, big navy page title, then destination and dates */}
                    <p className={'text-sm font-bold tracking-wider text-[#3A4187] mb-1'}>{trip.title}</p>
                    <h1 className={'text-3xl sm:text-4xl font-bold tracking-wider text-[#0B1533] mb-2'}>Travelers & Invites</h1>
                    <h2 className = {'text-base sm:text-xl font-bold tracking-wider text-[#0B1533]'}>
                        {trip.destination} · {trip.startDate.toLocaleDateString('en-US', {timeZone:'UTC'})} - {trip.endDate.toLocaleDateString('en-US', {timeZone:'UTC'})}</h2>
                </div>
                {/* white pill, same style as the trip itinerary's "Travelers & Invites" button */}
                <Link
                    to={`/trip-itinerary/${trip.id}`}
                    className="shrink-0 px-4 py-2.5 rounded-full border-2 border-[#031136] bg-white text-center text-sm font-bold text-[#031136] hover:bg-[#031136]/5"
                >
                    ← Back to activities
                </Link>
            </div>
            {/* large screens: page content on the left, a narrow Attendance sidebar on the right (like the trip itinerary) */}
            <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">
            <div className="min-w-0">
            {myMember && <UpdateRsvpForm member={myMember}/>}

            {/* white roster card with a navy border, like the mockup */}
            <section className="mb-6 overflow-hidden rounded-2xl border border-[#0B1533] bg-white">
                <h2 className="px-4 py-4 text-xl sm:text-2xl font-bold text-[#0B1533]">Traveler Roster</h2>

                {/* phones and small tablets: stacked rows */}
                <ul className="md:hidden border-t border-[#0B1533]">
                    {travelers.length === 0
                        ? <li className="px-4 py-3 text-sm text-[#0B1533]">No travelers invited yet</li>
                        : travelers.map((traveler) => <TravelerCard key={traveler.invite.id} traveler={traveler} isOwner={isOwner}/>)}
                </ul>

                {/* md and up: full table, sized to fit its card (no sideways scrolling).
                    the short columns (RSVP, Status, Adults, Children, actions) shrink to their content with w-px,
                    so the leftover room goes to Traveler and Contact */}
                <div className="hidden md:block">
                <Table theme={navyTableTheme.table}>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>Traveler</TableHeadCell>
                            {/* email and phone share one column, stacked, so the table fits beside the Attendance sidebar */}
                            <TableHeadCell>Contact</TableHeadCell>
                            {/* RSVP = yes/no/maybe; Status = color-coded invite badge */}
                            <TableHeadCell className="w-px whitespace-nowrap">RSVP</TableHeadCell>
                            <TableHeadCell className="w-px whitespace-nowrap">Status</TableHeadCell>
                            <TableHeadCell className="w-px whitespace-nowrap text-center">Adults</TableHeadCell>
                            <TableHeadCell className="w-px whitespace-nowrap text-center">Children</TableHeadCell>
                            {isOwner && <TableHeadCell className="w-px"><span className="sr-only">Actions</span></TableHeadCell>}
                        </TableRow>
                    </TableHead>

                    <TableBody className={'text-sm text-[#0B1533]'}>
                        {travelers.length === 0
                            ? <TableRow><TableCell colSpan={isOwner ? 7 : 6 /* 6 columns, plus Actions for the trip owner */}>No travelers invited yet</TableCell></TableRow>
                            : travelers.map((traveler) => <TravelerRow key={traveler.invite.id} traveler={traveler} isOwner={isOwner}/>)}

                    </TableBody>
                </Table>
                </div>
            </section>


            <section>
                <InviteForm/>
            </section>
            </div>

            {/* Attendance card: white with sunset stripes, matching the trip itinerary's Attendance card.
                phones and tablets: shown first, above the RSVP form; large screens: a sticky sidebar on the right */}
            <aside className="order-first overflow-hidden rounded-3xl border-2 border-[#031136] bg-white lg:order-none lg:sticky lg:top-6">
                <div aria-hidden="true">
                    <div className="h-2 bg-[#FF5903]"/>
                    <div className="h-1.5 bg-[#FF6B6C]"/>
                    <div className="h-1.5 bg-[#C9A3CB]"/>
                </div>
                <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold text-[#031136]">Attendance</h2>
                        <span className="rounded-full bg-[#031136] px-2.5 py-1 text-[10px] font-bold uppercase leading-tight text-white">
                            Organizer only
                        </span>
                    </div>
                    <p className="text-sm text-[#434A90]">Trip RSVPs · {travelers.length} invited</p>

                    {/* one bar split by how people answered; empty grey until someone is invited */}
                    <div className="flex h-4 overflow-hidden rounded-full border-2 border-[#031136] bg-gray-100">
                        {totalAnswers > 0 && segments.map((segment) => (
                            <div key={segment.label} className={segment.color}
                                 style={{width: `${(segment.value / totalAnswers) * 100}%`}}/>
                        ))}
                    </div>

                    {/* 2x2, like the mockup; one row of four on tablets, where the card spans the page */}
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                        {segments.map((segment) => (
                            <div key={segment.label} className="rounded-2xl border-2 border-[#031136] p-3">
                                <dt className="flex items-center gap-2 text-xs text-[#031136]">
                                    <span className={`h-3 w-3 shrink-0 rounded-full ${segment.color}`}/>
                                    {segment.label}
                                </dt>
                                <dd className="mt-2 text-lg font-extrabold text-[#031136]">{segment.value}</dd>
                            </div>
                        ))}
                    </dl>

                    {/* headcount of everyone going (was the Total / Adult / Children cards) */}
                    <p className="break-words text-xs text-gray-500">
                        Headcount: <span className="font-bold text-[#031136]">{totalTravelers}</span>
                        {' '}({totalAdults} {totalAdults === 1 ? 'adult' : 'adults'}, {totalChildren} {totalChildren === 1 ? 'child' : 'children'})
                        {goingNames && <> · {goingNames}</>}
                    </p>
                </div>
            </aside>
            </div>


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