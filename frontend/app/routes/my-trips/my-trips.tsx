import {Link} from "react-router";
import type {Route} from "./+types/my-trips";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getMyTrips} from "~/utils/models/trip.model";
import {getProfileByProfileId} from "~/utils/models/profile.model";

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

// rotating colors from the sunset palette: trip icon circles and "Planned by" pills
const iconColors = ['bg-[#FF5A1F]', 'bg-[#FF8A85]', 'bg-[#C19AC5]']
const pillColors = ['bg-[#C19AC5]', 'bg-[#FF8A85]']

// the "Create a new trip" button: orange with a thick navy outline, bold text that never wraps.
// Full width on phones; sized to its text on wide screens
const primaryButtonClasses = 'flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[3px] border-[#0B1533] bg-[#FF5A1F] px-6 py-3 text-base font-bold text-[#0B1533] hover:bg-[#FF7A45] lg:py-2.5'


// picture placeholder, same as the landing page; swap for the trip's photo later
function ImageIcon({className}: { className: string }) {
    return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4"/>
            <circle cx="15.5" cy="8.5" r="1.5"/>
            <path strokeLinejoin="round" d="m3 16 5-5 4 4 2-2 7 7"/>
        </svg>
    )
}



export default function MyTrips({loaderData}: Route.ComponentProps) {
    const {planned, invited, upNextId, message} = loaderData

    return (
        // same lavender page background as the travel itinerary page
        <main className="min-h-full bg-[#F7EEF6] text-[#0B1533]">
            <div className="mx-auto max-w-[1248px] px-5 py-6 sm:px-8 lg:py-10">

                {message && (
                    <p role="alert" className="mb-6 rounded-2xl border-[3px] border-[#FF5A1F] bg-white p-4 font-medium">{message}</p>
                )}

                {/* phones: one column. Wide screens: trips on the left, buttons + invites in a fixed right column */}
                {/* grid-cols-1 caps the phone column at the screen width, so long one-line text truncates instead of overflowing */}
                <div className="grid grid-cols-1 gap-x-9 gap-y-6 lg:grid-cols-[minmax(0,1fr)_468px] lg:gap-y-8">

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none">My Trips</h1>

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
                        <Link to="/create-trip" className={primaryButtonClasses}>+ Create a new trip</Link>
                    </div>

                    {/* trips the signed-in user owns */}
                    <section aria-labelledby="planned-heading">
                        <h2 id="planned-heading" className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#3A4187] lg:mb-4">
                            Planned by you
                        </h2>

                        {planned.length === 0 ? (
                            <p className="rounded-3xl border-[3px] border-[#0B1533] bg-white p-5">
                                You haven't planned a trip yet. Create one to get started!
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-3 lg:gap-4">
                                {planned.map((trip, index) => (
                                    <li key={trip.id}>
                                        <Link to={`/trip-itinerary/${trip.id}`}
                                              className="flex items-center gap-4 rounded-full border-[3px] border-[#0B1533] bg-white p-2 pr-4 transition-colors hover:bg-[#FFF5F0] lg:gap-5 lg:p-2.5 lg:pr-6">
                                            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full lg:h-16 lg:w-16 ${iconColors[index % iconColors.length]}`}>
                                                <ImageIcon className="h-6 w-6 lg:h-7 lg:w-7"/>
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-xl font-extrabold tracking-tight leading-tight lg:text-3xl">{trip.title}</span>
                                                <span className="block truncate text-sm text-[#3A4187] lg:text-base">
                                                    {trip.destination} · {trip.dates}
                                                </span>
                                            </span>
                                            {trip.id === upNextId && (
                                                <span className="shrink-0 whitespace-nowrap rounded-full bg-[#FF8A85] px-3 py-1 text-sm font-bold">Up next</span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* trips someone else planned that the user has joined */}
                    <section aria-labelledby="invites-heading"
                             className="mt-3 self-start overflow-hidden rounded-[28px] border-[3px] border-[#0B1533] bg-[#434A8E] text-white lg:mt-0">
                        <div aria-hidden="true">
                            <div className="h-2 bg-[#FF5A1F]"/>
                            <div className="h-1.5 bg-[#FF8A85]"/>
                            <div className="h-1.5 bg-[#C19AC5]"/>
                        </div>
                        <div className="px-4 pb-5 pt-5 lg:px-7 lg:pb-7 lg:pt-6">
                            <h2 id="invites-heading" className="text-3xl font-extrabold tracking-tight lg:text-4xl">Trip Invites</h2>
                            <p className="mt-3 text-white/90">
                                Trips other people have invited you to. Open one to see the plan and RSVP.
                            </p>

                            {invited.length === 0 ? (
                                <p className="mt-4 rounded-2xl bg-white/10 p-4 text-white/90">No invites yet.</p>
                            ) : (
                                <ul className="mt-4 flex flex-col gap-3">
                                    {invited.map((trip, index) => (
                                        <li key={trip.id}>
                                            <Link to={`/trip-itinerary/${trip.id}`}
                                                  className="flex items-center justify-between gap-3 rounded-full bg-white py-2.5 pl-5 pr-3 text-[#0B1533] transition-colors hover:bg-[#FFF5F0]">
                                                <span className="min-w-0 truncate text-lg font-extrabold tracking-tight lg:text-xl">{trip.title}</span>
                                                {trip.ownerName && (
                                                    <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold lg:text-sm ${pillColors[index % pillColors.length]}`}>
                                                        <span className="lg:hidden">By</span>
                                                        <span className="hidden lg:inline">Planned by</span> {trip.ownerName}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
