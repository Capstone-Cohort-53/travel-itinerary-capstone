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
import {Crown, Gem, Parchment, RoyalPage, eyebrow, emphasis, headline, outlineButton} from "~/components/royal";
// roster table in the Royal Decree look: white rows, small Blue Bay capitals
// over a navy rule for the header, rows split by a thin mist line (no stripes)
const royalTableTheme = createTheme({
    table: {
        root: {
            base: "w-full text-left text-sm text-navy",
            shadow: "hidden",
        },
        head: {
            base: "text-[11px] uppercase tracking-[0.16em] text-bay",
            cell: {
                base: "bg-white px-3 py-3 font-bold text-bay border-b-[1.5px] border-navy"
            }
        },
        // less padding than Flowbite's default (px-6 py-4) so the table fits beside the Attendance sidebar
        body: {
            cell: {
                base: "px-3 py-3"
            }
        },
        row: {
            base: "bg-white border-b border-mist text-navy"
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
        return (
            <RoyalPage width="max-w-xl">
                <Parchment compact>
                    <div className="text-center">
                        <p className={eyebrow}>Travelers & Invites</p>
                        <h1 className={`${headline} mt-3 text-4xl`}>Trip <em className={emphasis}>not found</em></h1>
                    </div>
                </Parchment>
            </RoyalPage>
        )

    }

    const going = travelers.filter((t) => t.member?.going === 'yes')
    const totalGoing = going.length
    const totalNotGoing = travelers.filter((t) => t.member?.going === 'no' || t.invite.status === 'declined').length
    const totalMaybe = travelers.filter((t) => t.member?.going === 'maybe').length
    const totalPending = travelers.filter((t) => t.invite.status === 'pending').length
    const totalAdults = going.reduce((sum, t) => sum + (t.member?.adults ?? 0), 0)
    const totalChildren = going.reduce((sum, t) => sum + (t.member?.children ?? 0), 0)
    const totalTravelers = totalAdults + totalChildren

    // the four RSVP answers, in the design's tile colors: peach (kept on this page), lilac, watermelon, mist
    const segments = [
        {label: 'Going', value: totalGoing, color: 'bg-peach'},
        {label: 'Maybe', value: totalMaybe, color: 'bg-lilac'},
        {label: 'Not going', value: totalNotGoing, color: 'bg-pink'},
        {label: 'No response', value: totalPending, color: 'bg-mist'},
    ]
    const totalAnswers = segments.reduce((sum, segment) => sum + segment.value, 0)
    const goingNames = going.map((t) => t.profile?.name ?? t.invite.name).join(', ')

    return (
        <RoyalPage>
        <Parchment>
            {/* header: titles on the left, a button back to the trip's activities on the right.
                phones: the button sits under the titles at full width */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    {/* small Blue Bay eyebrow with the trip title, big Playfair page title, then destination and dates */}
                    <p className={`${eyebrow} break-words`}>Travelers & Invites · {trip.title}</p>
                    <h1 className={`${headline} mt-3 text-4xl sm:text-5xl lg:text-6xl`}>Your <em className={emphasis}>Royal Court</em></h1>
                    <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-bay">
                        {trip.destination} · {trip.startDate.toLocaleDateString('en-US', {timeZone:'UTC'})} - {trip.endDate.toLocaleDateString('en-US', {timeZone:'UTC'})}</p>
                </div>
                <Link
                    to={`/trip-itinerary/${trip.id}`}
                    className={`${outlineButton} w-full shrink-0 sm:w-auto`}
                >
                    ← Back to activities
                </Link>
            </div>
            {/* large screens: page content on the left, a narrow Attendance sidebar on the right (like the trip itinerary) */}
            <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">
            <div className="min-w-0">
            {myMember && <UpdateRsvpForm member={myMember}/>}

            {/* white roster card with a navy border, like the design */}
            <section className="mb-6 overflow-hidden rounded-[18px] border-[1.5px] border-navy bg-white">
                <div className="flex items-center gap-2 px-4 py-4 sm:px-5">
                    <Crown size={24}/>
                    <h2 className="font-display text-2xl font-bold italic text-navy">The Royal Court</h2>
                </div>

                {/* phones and small tablets: stacked rows */}
                <ul className="md:hidden border-t-[1.5px] border-navy">
                    {travelers.length === 0
                        ? <li className="px-4 py-4 text-sm text-bay">No travelers summoned yet</li>
                        : travelers.map((traveler) => <TravelerCard key={traveler.invite.id} traveler={traveler} isOwner={isOwner}/>)}
                </ul>

                {/* md and up: full table. The short columns (RSVP, Status, Adults, Children, actions) shrink to
                    their content with w-px, so the leftover room goes to Traveler and Contact; if it still
                    doesn't fit, it scrolls sideways inside this card instead of the page */}
                <div className="hidden overflow-x-auto md:block">
                <Table theme={royalTableTheme.table}>
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

                    <TableBody className={'text-sm text-navy'}>
                        {travelers.length === 0
                            ? <TableRow><TableCell colSpan={isOwner ? 7 : 6 /* 6 columns, plus Actions for the trip owner */} className="text-bay">No travelers summoned yet</TableCell></TableRow>
                            : travelers.map((traveler) => <TravelerRow key={traveler.invite.id} traveler={traveler} isOwner={isOwner}/>)}

                    </TableBody>
                </Table>
                </div>
            </section>


            <section>
                <InviteForm/>
            </section>
            </div>

            {/* Attendance card: parchment with a navy border and a gem.
                phones and tablets: shown first, above the RSVP form; large screens: a sticky sidebar on the right */}
            <aside className="order-first rounded-2xl border-[1.5px] border-navy bg-white lg:order-none lg:sticky lg:top-6">
                <div className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Gem color="lilac" size={22}/>
                        <h2 className="font-display text-2xl font-bold italic text-navy">Attendance</h2>
                        <span className="rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-white">
                            Organizer only
                        </span>
                    </div>
                    <p className="text-sm text-bay">Trip RSVPs · {travelers.length} invited</p>

                    {/* one bar split by how people answered; empty mist until someone is invited */}
                    <div className="flex h-4 overflow-hidden rounded-full border-[1.5px] border-navy bg-mist">
                        {totalAnswers > 0 && segments.map((segment) => (
                            <div key={segment.label} className={segment.color}
                                 style={{width: `${(segment.value / totalAnswers) * 100}%`}}/>
                        ))}
                    </div>

                    {/* colored tiles with Playfair numbers, like the design; 2x2, one row of four on tablets */}
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                        {segments.map((segment) => (
                            <div key={segment.label} className={`rounded-[14px] px-3.5 py-3 text-navy ${segment.color}`}>
                                <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">
                                    {segment.label}
                                </dt>
                                <dd className="mt-1 font-display text-3xl font-semibold leading-none">{segment.value}</dd>
                            </div>
                        ))}
                    </dl>

                    {/* headcount of everyone going (was the Total / Adult / Children cards) */}
                    <p className="break-words text-xs text-bay">
                        Headcount: <span className="font-bold text-navy">{totalTravelers}</span>
                        {' '}({totalAdults} {totalAdults === 1 ? 'adult' : 'adults'}, {totalChildren} {totalChildren === 1 ? 'child' : 'children'})
                        {goingNames && <> · {goingNames}</>}
                    </p>
                </div>
            </aside>
            </div>


        </Parchment>
        </RoyalPage>
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