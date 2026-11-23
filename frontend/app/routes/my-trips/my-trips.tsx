import {Link} from "react-router";
import type {Route} from "./+types/my-trips";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getMyTrips} from "~/utils/models/trip.model";
import {getProfileByProfileId} from "~/utils/models/profile.model";
import {Gem, Parchment, chip, emphasis, eyebrow, goldButton, headline} from "~/components/royal";

export function meta({}: Route.MetaArgs) {
    return [{title: "My Trips | TripsQueen"}]
}

const DAY_MS = 24 * 60 * 60 * 1000

// "Jun 3 – Jun 9, 2027". Dates are stored as midnight UTC, so format in UTC
// or the browser's time zone can shift them back a day
function formatDates(startDate: Date, endDate: Date) {
    const short = {month: 'short', day: 'numeric', timeZone: 'UTC'} as const
    const year = endDate.getUTCFullYear()
    return `${startDate.toLocaleDateString('en-US', short)} – ${endDate.toLocaleDateString('en-US', short)}, ${year}`
}

// the end date is the trip's last day, so a trip is over once that whole day has passed
function hasEnded(endDate: Date, now: Date) {
    return now.getTime() >= endDate.getTime() + DAY_MS
}

// loads every trip the user owns or has joined, split into the two lists on the page
export async function loader({request}: Route.LoaderArgs) {
    const user = await requireSignedInUser(request)
    const {status, trips} = await getMyTrips(user)

    // the API no longer knows this user: its session ended before ours did
    if (status.status === 401 || status.status === 403) {
        throw await endSession(request)
    }

    const now = new Date()
    const toCard = (trip: typeof trips[number]) => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        dates: formatDates(trip.startDate, trip.endDate),
        ended: hasEnded(trip.endDate, now),
    })

    const planned = trips.filter((trip) => trip.ownerId === user.profile.id).map(toCard)
    const invitedTrips = trips.filter((trip) => trip.ownerId !== user.profile.id)

    // look up each trip owner's name once for the "Planned by" pills
    const ownerIds = [...new Set(invitedTrips.map((trip) => trip.ownerId))]
    const owners = await Promise.all(ownerIds.map((id) => getProfileByProfileId(id, user)))
    const ownerNames = new Map(ownerIds.map((id, index) => [id, owners[index].profile?.name ?? null]))

    const invited = invitedTrips.map((trip) => ({
        ...toCard(trip),
        ownerName: ownerNames.get(trip.ownerId) ?? null,
    }))

    // trips arrive soonest first, so the first one not over yet is next
    const upNextId = planned.find((trip) => !trip.ended)?.id ?? null

    return {
        planned,
        invited,
        upNextId,
        message: status.status === 200 ? null : status.message,
    }
}

// rotating gems for the trip icon circles, and chip colors for the "Summoned by" tags
const gemColors = ['pink', 'lilac', 'sapphire'] as const
const pillColors = ['bg-lilac!', 'bg-peach!']

// a trip row: white card with a navy outline, gold focus ring
const rowClasses = 'flex min-h-11 items-center gap-3 rounded-2xl border-[1.5px] border-navy bg-white transition-colors hover:bg-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment'


// a navy rule with a gem in the middle, under the heading
function HeadingRule() {
    return (
        <div aria-hidden="true" className="flex w-full items-center gap-2.5">
            <span className="h-px flex-1 bg-navy"/>
            <Gem color="pink" size={20}/>
            <span className="h-px flex-1 bg-navy"/>
        </div>
    )
}


export default function MyTrips({loaderData}: Route.ComponentProps) {
    const {planned, invited, upNextId, message} = loaderData

    return (
        // flex-1 fills the space down to the footer (min-h-full can't, since the parent has no fixed height)
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-14 pt-4 sm:px-8 sm:pt-6">
            <Parchment>
                <div className="flex flex-col gap-7">

                    {message && (
                        <p role="alert" className="rounded-2xl border-[1.5px] border-royal-red bg-white p-4 font-medium text-royal-red">{message}</p>
                    )}

                    {/* heading and the gold "new trip" button: stacked on phones, side by side on wider screens */}
                    <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-2.5">
                            <p className={eyebrow}>The royal archives</p>
                            <h1 className={`${headline} text-[40px] sm:text-6xl`}>
                                My <em className={emphasis}>Royal</em> Trips
                            </h1>
                        </div>
                        <Link to="/create-trip" className={`${goldButton} w-full whitespace-nowrap sm:w-auto`}>+ Decree a new trip</Link>
                    </div>

                    <HeadingRule/>

                    {/* phones: one column. Wide screens: trips on the left, invites in a right column */}
                    {/* grid-cols-1 caps the phone column at the screen width, and long trip names wrap instead of overflowing */}
                    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_400px]">

                        {/* trips the signed-in user owns */}
                        <section aria-labelledby="planned-heading">
                            <h2 id="planned-heading" className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-bay">
                                Planned by you
                            </h2>

                            {planned.length === 0 ? (
                                <p className="rounded-2xl border-[1.5px] border-navy bg-white p-5 text-bay">
                                    No trips proclaimed yet. Decree one to get started!
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {planned.map((trip, index) => (
                                        <li key={trip.id}>
                                            <Link to={`/trip-itinerary/${trip.id}`}
                                                  className={`${rowClasses} p-2.5 pr-4 sm:gap-4 sm:p-3 sm:pr-5`}>
                                                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy sm:h-14 sm:w-14">
                                                    <Gem color={gemColors[index % gemColors.length]} size={26} outline="#ffffff"/>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    {/* phones: the "Up next" tag sits above the name, so the name gets the full width */}
                                                    {trip.id === upNextId && (
                                                        <span className={`${chip} mb-1 whitespace-nowrap bg-pink! sm:hidden`}>Up next</span>
                                                    )}
                                                    <span className="block break-words font-display text-xl font-semibold leading-tight sm:text-[26px]">{trip.title}</span>
                                                    <span className="block text-[13px] text-bay">
                                                        {trip.destination} · {trip.dates}
                                                    </span>
                                                </span>
                                                {trip.id === upNextId && (
                                                    <span className={`${chip} shrink-0 self-start whitespace-nowrap bg-pink! max-sm:hidden`}>Up next</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* trips someone else planned that the user has joined */}
                        <section aria-labelledby="invites-heading"
                                 className="self-start rounded-2xl border-[1.5px] border-navy bg-lilac/15 p-5 sm:p-6">
                            <h2 id="invites-heading" className="font-display text-[26px] font-bold italic leading-tight">Royal Summons</h2>
                            <p className="mt-2 text-[15px] leading-normal text-bay">
                                Trips other queens have invited you to. Open one to see the plan and RSVP.
                            </p>

                            {invited.length === 0 ? (
                                <p className="mt-4 rounded-2xl border-[1.5px] border-dashed border-navy/40 bg-white p-4 text-bay">No summons yet.</p>
                            ) : (
                                <ul className="mt-4 flex flex-col gap-3">
                                    {invited.map((trip, index) => (
                                        <li key={trip.id}>
                                            <Link to={`/trip-itinerary/${trip.id}`}
                                                  className={`${rowClasses} justify-between py-3 pl-4 pr-3`}>
                                                <span className="min-w-0 break-words font-display text-xl font-semibold">{trip.title}</span>
                                                {trip.ownerName && (
                                                    <span className={`${chip} shrink-0 whitespace-nowrap ${pillColors[index % pillColors.length]}`}>
                                                        <span className="lg:hidden">By</span>
                                                        <span className="hidden lg:inline">Summoned by</span>&nbsp;{trip.ownerName}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </div>
            </Parchment>
        </main>
    )
}
