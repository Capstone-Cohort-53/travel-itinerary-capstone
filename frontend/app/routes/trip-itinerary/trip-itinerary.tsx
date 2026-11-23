import {Link} from "react-router";
import {z} from "zod";
import type {Route} from "./+types/trip-itinerary";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getTrip, type Trip} from "~/utils/models/trip.model";
import {type Activity, getActivitiesByTripId} from "~/utils/models/activity.model";
import {googleMapsUrl} from "~/utils/google-maps";

// loads one trip and everything planned for it
export async function loader({request, params}: Route.LoaderArgs) {
    const user = await requireSignedInUser(request);

    // check the id before asking the API, so a mistyped URL gets a clear message
    const idResult = z.uuidv7().safeParse(params.tripId);
    if (!idResult.success) {
        return {trip: null, activities: [], isOwner: false, message: "That is not a valid trip link.", activitiesMessage: null};
    }
    const tripId = idResult.data;

    // fetch the trip and its activities at the same time instead of one after the other
    const [tripResult, activitiesResult] = await Promise.all([
        getTrip(tripId, user),
        getActivitiesByTripId(tripId, user),
    ]);

    // the API no longer knows this user: its session ended before ours did
    if (tripResult.status.status === 401 || tripResult.status.status === 403) {
        throw await endSession(request);
    }

    // no trip, or not one this user belongs to: there is no page without it
    if (tripResult.trip === null) {
        const message = tripResult.status.status === 404
            ? "This trip could not be found, or you are not a member of it."
            : tripResult.status.message;
        return {trip: null, activities: [], isOwner: false, message, activitiesMessage: null};
    }

    // the trip still shows when only the activities failed, and says why they are missing
    const activitiesMessage = activitiesResult.status.status === 200 ? null : activitiesResult.status.message;

    return {
        trip: tripResult.trip,
        activities: activitiesResult.activities,
        isOwner: tripResult.trip.ownerId === user.profile.id,
        message: null,
        activitiesMessage,
    };
}

type Day = { key: string; label: string; activities: Activity[] };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// trip dates are calendar dates with no time zone, so show them as UTC to avoid slipping a day
function formatTripDate(date: Date | string): string {
    return new Date(date).toLocaleDateString(undefined, {timeZone: "UTC", month: "short", day: "numeric", year: "numeric"});
}

/** How many days the trip lasts, counting both the first and the last day. */
function tripLength(trip: Trip): number {
    return Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / ONE_DAY_MS) + 1;
}

// activity times are saved as the clock time at the destination, marked UTC, so read them back in UTC
function formatTime(date: Date | string | null): string | null {
    return date === null ? null : new Date(date).toLocaleTimeString(undefined, {timeZone: "UTC", hour: "numeric", minute: "2-digit"});
}

function formatCost(cost: number): string {
    return cost === 0 ? "Free" : cost.toLocaleString(undefined, {style: "currency", currency: "USD"});
}

/** Groups activities into days by their start time, in order. Activities with no start time go last. */
function groupByDay(activities: Activity[]): Day[] {
    const sorted = [...activities].sort((a, b) => {
        if (a.startDatetime === null) return 1;
        if (b.startDatetime === null) return -1;
        return new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime();
    });

    const days: Day[] = [];
    for (const activity of sorted) {
        const start = activity.startDatetime === null ? null : new Date(activity.startDatetime);
        const key = start === null ? "unscheduled" : start.toISOString().slice(0, 10);

        const lastDay = days[days.length - 1];
        if (lastDay && lastDay.key === key) {
            lastDay.activities.push(activity);
            continue;
        }

        const label = start === null
            ? "Not scheduled yet"
            : `Day ${days.length + 1} · ${start.toLocaleDateString(undefined, {timeZone: "UTC", weekday: "short", month: "short", day: "numeric"})}`;
        days.push({key, label, activities: [activity]});
    }
    return days;
}

export default function TripItinerary(props: Route.ComponentProps) {
    const {trip, activities, isOwner, message, activitiesMessage} = props.loaderData;

    if (trip === null) {
        return (
            <main className="min-h-screen bg-[#FBF3FA] px-4 py-10">
                <div className="max-w-5xl mx-auto">
                    <Link to="/my-trips" className="text-sm font-bold text-[#434A90] hover:underline">← My Trips</Link>
                    <p role="alert" className="mt-4 rounded-2xl border-2 border-[#031136] bg-white p-5 text-red-700">{message}</p>
                </div>
            </main>
        );
    }

    const days = groupByDay(activities);
    const length = tripLength(trip);

    return (
        <main className="min-h-screen bg-[#FBF3FA] px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* header: back link, title and the trip's details, with the actions on the right */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Link to="/my-trips" className="text-sm font-bold text-[#434A90] hover:underline">← My Trips</Link>
                        <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight break-words text-[#031136]">{trip.title}</h1>
                        <p className="mt-1 text-sm text-[#434A90]">
                            {trip.destination} · {formatTripDate(trip.startDate)} – {formatTripDate(trip.endDate)} · {length} {length === 1 ? "day" : "days"}
                        </p>
                    </div>

                    {/* phones: two equal buttons filling the width; wider screens: side by side on the right */}
                    <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
                        <Link
                            to={`/travel-itinerary/${trip.id}`}
                            className={`${isOwner ? "" : "col-span-2"} px-4 py-2.5 rounded-full border-2 border-[#031136] bg-white text-center text-sm font-bold text-[#031136] hover:bg-[#031136]/5`}
                        >
                            👥 Travelers &amp; Invites
                        </Link>
                        {isOwner && (
                            <Link
                                to={`/travel-itinerary/${trip.id}/activity/new`}
                                className="px-4 py-2.5 rounded-full border-2 border-[#031136] bg-[#FF5903] text-center text-sm font-bold text-[#031136] hover:bg-[#FF5903]/90"
                            >
                                + Add activity
                            </Link>
                        )}
                    </div>
                </div>

                {/*
                  phones: one column, About this trip, attendance (organizer only), then the itinerary.
                  wide screens: the itinerary on the left; About this trip above attendance on the right.
                */}
                <div className="mt-6 sm:mt-8 grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">
                    <div className="order-1 space-y-6 lg:order-2">
                        <TripCard trip={trip}/>
                        {isOwner && <AttendanceCard counts={null}/>}
                    </div>

                    {/* the itinerary, one section per day */}
                    <div className="order-2 space-y-6 lg:order-1">
                        {activitiesMessage && (
                            <p role="alert" className="rounded-2xl border-2 border-[#031136] bg-white p-5 text-red-700">{activitiesMessage}</p>
                        )}

                        {days.map((day) => (
                            <section key={day.key} className="space-y-3">
                                <h2 className="inline-block rounded-full bg-[#031136] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                    {day.label}
                                </h2>
                                {day.activities.map((activity) => (
                                    <ActivityCard key={activity.id} activity={activity}
                                                  detailsTo={`/travel-itinerary/${trip.id}/activity/${activity.id}`}
                                                  editTo={isOwner ? `/travel-itinerary/${trip.id}/activity/${activity.id}/edit` : undefined}/>
                                ))}
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

type AttendanceCounts = { going: number; maybe: number; notGoing: number; noResponse: number };

/** The sunset stripes along the top of the side cards. */
function Stripes() {
    return (
        <div aria-hidden="true">
            <div className="h-2 bg-[#FF5903]"/>
            <div className="h-1.5 bg-[#FF6B6C]"/>
            <div className="h-1.5 bg-[#C9A3CB]"/>
        </div>
    );
}

/**
 * RSVP totals across all of the trip's activities.
 *
 * PLACEHOLDER: there are no activity RSVP endpoints yet, so the page passes
 * `counts={null}` and the card shows "#" in place of each number. Once the
 * ACTIVITY RSVP endpoints exist, load the totals in the loader and pass them in.
 */
function AttendanceCard({counts}: { counts: AttendanceCounts | null }) {
    const total = counts ? counts.going + counts.maybe + counts.notGoing + counts.noResponse : 0;
    const segments = [
        {label: "Going", value: counts?.going, color: "bg-[#434A90]"},
        {label: "Maybe", value: counts?.maybe, color: "bg-[#C9A3CB]"},
        {label: "Not going", value: counts?.notGoing, color: "bg-[#FF6B6C]"},
        {label: "No response", value: counts?.noResponse, color: "bg-gray-200 border border-[#031136]"},
    ];

    return (
        <aside className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-white">
            <Stripes/>
            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 lg:justify-start">
                    <h2 className="text-xl font-extrabold text-[#031136]">Attendance</h2>
                    <span className="rounded-full bg-[#031136] px-2.5 py-1 text-[10px] font-bold uppercase leading-tight text-white">
                        Organizer only
                    </span>
                </div>
                <p className="hidden text-sm text-[#434A90] lg:block">Across all activities · {counts ? total : "#"} invited</p>

                {/* one bar split by how people answered; empty grey until there are RSVPs */}
                <div className="flex h-4 overflow-hidden rounded-full border-2 border-[#031136] bg-gray-100">
                    {counts && total > 0 && segments.map((segment) => (
                        <div
                            key={segment.label}
                            className={segment.color}
                            style={{width: `${((segment.value ?? 0) / total) * 100}%`}}
                        />
                    ))}
                </div>

                {/* phones: one short line under the bar instead of the four boxes */}
                <p className="text-xs text-[#434A90] lg:hidden">
                    {segments.map((segment) => `${segment.value ?? "#"} ${segment.label.toLowerCase()}`).join(" · ")}
                </p>

                <dl className="hidden grid-cols-2 gap-3 lg:grid">
                    {segments.map((segment) => (
                        <div key={segment.label} className="rounded-2xl border-2 border-[#031136] p-3">
                            <dt className="flex items-center gap-2 text-xs text-[#031136]">
                                <span className={`h-3 w-3 shrink-0 rounded-full ${segment.color}`}/>
                                {segment.label}
                            </dt>
                            <dd className="mt-2 text-lg font-extrabold text-[#031136]">{segment.value ?? "#"}</dd>
                        </div>
                    ))}
                </dl>

                {counts === null && (
                    <p className="text-xs text-gray-500">Totals will show here once travelers can RSVP to activities.</p>
                )}
            </div>
        </aside>
    );
}

/** The card above attendance: the trip's description, under the sunset stripes. */
function TripCard({trip}: { trip: Trip }) {
    return (
        <section className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-white">
            <Stripes/>
            <div className="p-5">
                <h2 className="text-xl font-extrabold text-[#031136]">About this trip</h2>
                <p className="mt-1 break-words whitespace-pre-line text-sm text-[#434A90]">{trip.description ?? "No description yet."}</p>
            </div>
        </section>
    );
}

function ActivityCard({activity, detailsTo, editTo}: { activity: Activity; detailsTo: string; editTo?: string }) {
    const start = formatTime(activity.startDatetime);
    const end = formatTime(activity.endDatetime);
    // the one-line summary under the name: only the parts this activity has
    // the place opens in Google Maps (the app, on phones); the cost follows it
    const place = [activity.location, activity.address].filter(Boolean).join(" · ");
    const mapsUrl = googleMapsUrl(activity.location, activity.address);

    return (
        // phones: the time on its own line above the name, with Required beside it.
        // wider screens: the time in a column on the left and Required on the far right.
        <article className="flex flex-col gap-1 rounded-2xl border-2 border-[#031136] bg-white px-4 py-4 sm:flex-row sm:gap-5 sm:px-5">
            <div className="flex items-start justify-between gap-2 sm:block sm:w-20 sm:shrink-0">
                <p className="pt-0.5 text-sm font-bold text-[#FF5903]">
                    {start ?? "—"}
                    {end && (
                        <span className="sm:block sm:text-xs sm:font-medium">
                            <span className="sm:hidden"> – </span>
                            <span className="hidden sm:inline">to </span>
                            {end}
                        </span>
                    )}
                </p>
                {activity.mandatory && (
                    <span className="rounded-full bg-[#C9A3CB] px-3 py-1 text-xs font-bold text-[#031136] sm:hidden">Required</span>
                )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                {/* the name opens the activity's details page, where its map is */}
                <h3 className="font-bold text-[#031136]"><Link to={detailsTo} className="hover:underline">{activity.name}</Link></h3>
                <p className="text-sm text-[#434A90]">
                    {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                            📍 {place}<span className="sr-only"> (opens Google Maps in a new tab)</span>
                        </a>
                    )}
                    {mapsUrl && " · "}{formatCost(activity.cost)}
                </p>
                {activity.description && <p className="text-sm text-gray-700">{activity.description}</p>}
                {activity.notes && <p className="text-sm italic text-gray-500">Note: {activity.notes}</p>}
                <div className="flex gap-4 pt-1 text-sm font-bold text-[#434A90]">
                    <Link to={detailsTo} className="underline">View details &amp; map</Link>
                    {editTo && <Link to={editTo} className="underline">Edit</Link>}
                </div>
            </div>

            {activity.mandatory && (
                <span className="hidden self-start rounded-full bg-[#C9A3CB] px-3 py-1 text-xs font-bold text-[#031136] sm:inline-block">Required</span>
            )}
        </article>
    );
}
