import {Link} from "react-router";
import type {Route} from "./+types/my-trips";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getMyTrips} from "~/utils/models/trip.model";

const DAY_MS = 24 * 60 * 60 * 1000

// short text for the trip card: how long until the trip, or whether it is on now or over.
// Worked out here on the server so the browser shows exactly the same text
function getCountdown(startDate: Date, endDate: Date, now: Date) {
    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / DAY_MS)
    if (daysUntilStart > 1) return `${daysUntilStart} days to go`
    if (daysUntilStart === 1) return '1 day to go'
    // the end date is the trip's last day, so the trip lasts until the end of that day
    if (now.getTime() < endDate.getTime() + DAY_MS) return 'Happening now!'
    return 'Trip ended'
}

// loads every trip the user owns or has joined
export async function loader({request}: Route.LoaderArgs) {
    const user = await requireSignedInUser(request)
    const {status, trips} = await getMyTrips(user)

    // the API no longer knows this user: its session ended before ours did
    if (status.status === 401 || status.status === 403) {
        throw await endSession(request)
    }

    const now = new Date()
    return {
        trips: trips.map((trip) => ({
            id: trip.id,
            title: trip.title,
            destination: trip.destination,
            countdown: getCountdown(trip.startDate, trip.endDate, now),
        })),
        message: status.status === 200 ? null : status.message,
    }
}

export default function myTrips ({loaderData}: Route.ComponentProps) {
    const {trips, message} = loaderData
    return (
        <>
            <section className={'px-45 py-25 font-serif grid grid-cols-1 md:grid-cols-2 gap-4'}>
                    <div className="md:col-span-1">
                        <section className={'my-10'}>
                            <h1 className={'text-3xl font-bold underline'}> My Trips </h1>
                            <Link to="/create-trip" className="w-full max-w-lg overflow-hidden rounded-xl flex items-center mt-10 hover:underline">
                                <img className={'size-10 border-2 border-black rounded-xl mr-3'}
                                     src="/plus-icon.png"
                                     alt=""
                                />
                                <h2 className={'text-2xl'}> Create a New Trip! </h2>
                            </Link>
                            <div className="w-full max-w-lg overflow-hidden rounded-xl flex items-center mt-5">
                                <img className={'size-10 border-2 border-black rounded-xl mr-3'}
                                     src="plus-icon.png"
                                     alt="Add Icon"
                                />
                                <h2 className={'text-2xl'}> Re-use a past itinerary! </h2>
                            </div>
                        </section>

                        <section className={'mt-10'}>
                            {/* the user's real trips: each card opens that trip's itinerary */}
                            {message && <p className="text-red-700">{message}</p>}
                            {!message && trips.length === 0 && (
                                <p className="text-lg text-gray-600">You have no trips yet. Create one to get started!</p>
                            )}
                            <ul className="max-w-sm">
                                {trips.map((trip, index) => (
                                    <li key={trip.id}>
                                        <Link to={`/trip-itinerary/${trip.id}`}
                                              className={`flex h-20 w-100 items-center justify-between gap-3 rounded-2xl p-4 my-2 font-medium text-blue-900 transition-colors ${
                                                  index % 2 === 0 ? 'bg-blue-100 hover:bg-blue-300' : 'bg-green-100 hover:bg-green-300'
                                              }`}>
                                            <span>{trip.title} * {trip.destination} * {trip.countdown}</span>
                                            {/* arrow pointing right: this opens the trip */}
                                            <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                            </svg>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    <div className="px-25">
                        <section className="md:col-span-2">
                            <h1 className={'text-3xl font-bold my-10 align-right justify-items-start max-w-[50%] underline'}> Trip Invites </h1>
                        </section>

                        <section>
                            <div className="max-w-sm">
                                <button
                                        className="w-100 h-20 flex items-center text-center justify-center p-4 bg-red-100 rounded-2xl my-10 hover:bg-red-300 transition-colors">
                                    <span
                                        className="flex items-center text-center justify-center font-medium text-blue-900"> Trip Name * Location * Countdown  </span>
                                    <svg id="arrow"
                                         className="w-5 h-5 text-gray-500 align-right transition-transform duration-300"
                                         fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                                <div id="contentBox"
                                     className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                                    <div className="p-4 text-gray-600 border-t border-gray-100 text-sm">
                                        This is the hidden container. It uses overflow-hidden to prevent layout jumps
                                        and max-height
                                        transitions to seamlessly roll down when triggered.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
            </section>
        </>
    )
}