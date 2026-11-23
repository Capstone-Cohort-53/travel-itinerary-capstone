import {Link} from "react-router";
import {z} from "zod";
import type {Route} from "./+types/trip-itinerary";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getTrip, type Trip} from "~/utils/models/trip.model";
import {type Activity, getActivitiesByTripId} from "~/utils/models/activity.model";

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

type Day = { key: string; title: string; activities: Activity[] };

// trip dates are calendar dates with no time zone, so show them as UTC to avoid slipping a day
function formatTripDate(date: Date | string): string {
    return new Date(date).toLocaleDateString(undefined, {timeZone: "UTC", month: "short", day: "numeric", year: "numeric"});
}

function formatTime(date: Date | string | null): string | null {
    return date === null ? null : new Date(date).toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"});
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
        const key = start === null ? "unscheduled" : start.toDateString();
        const title = start === null
            ? "Not scheduled yet"
            : start.toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"});

        const lastDay = days[days.length - 1];
        if (lastDay && lastDay.key === key) {
            lastDay.activities.push(activity);
        } else {
            days.push({key, title, activities: [activity]});
        }
    }
    return days;
}

export default function TripItinerary(props: Route.ComponentProps) {
    const {trip, activities, isOwner, message, activitiesMessage} = props.loaderData;

    if (trip === null) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{message}</p>
                    <Link to="/my-trips" className="mt-6 inline-block text-[#434A90] underline">← Back to My Trips</Link>
                </div>
            </main>
        );
    }

    const days = groupByDay(activities);

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <nav className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <Link to="/my-trips" className="text-[#434A90] underline">← Back to My Trips</Link>
                    <Link
                        to={`/travel-itinerary/${trip.id}`}
                        className="px-4 py-2 rounded-lg border border-[#434A90] text-[#434A90] font-medium hover:bg-[#434A90]/5"
                    >
                        👥 Travelers &amp; Invites
                    </Link>
                </nav>

                <TripHeader trip={trip}/>

                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#031136]">Itinerary</h2>
                    {isOwner && (
                        <Link to={`/travel-itinerary/${trip.id}/activity/new`} className="px-4 py-2 rounded-lg bg-[#FF5903] text-white text-sm font-medium hover:bg-[#FF5903]/90">
                            + Add Activity
                        </Link>
                    )}
                </div>

                {activitiesMessage && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{activitiesMessage}</p>
                )}

                {!activitiesMessage && days.length === 0 && (
                    <p className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
                        Nothing is planned for this trip yet.
                    </p>
                )}

                {days.map((day) => (
                    <section key={day.key} className="space-y-3">
                        <h3 className="text-lg font-semibold text-[#434A90]">{day.title}</h3>
                        {day.activities.map((activity) => (
                            <ActivityCard key={activity.id} activity={activity}
                                          detailsTo={`/travel-itinerary/${trip.id}/activity/${activity.id}`}
                                          editTo={isOwner ? `/travel-itinerary/${trip.id}/activity/${activity.id}/edit` : undefined}/>
                        ))}
                    </section>
                ))}
            </div>
        </main>
    );
}

function TripHeader({trip}: { trip: Trip }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <img src={trip.image} alt="" className="h-40 w-full object-cover"/>
            <div className="p-5 sm:p-6 space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#031136]">{trip.title}</h1>
                <p className="text-gray-700">📍 {trip.destination}</p>
                <p className="text-gray-700">🗓️ {formatTripDate(trip.startDate)} – {formatTripDate(trip.endDate)}</p>
                {trip.description && <p className="text-gray-600">{trip.description}</p>}
            </div>
        </section>
    );
}

function ActivityCard({activity, detailsTo, editTo}: { activity: Activity; detailsTo: string; editTo?: string }) {
    const start = formatTime(activity.startDatetime);
    const end = formatTime(activity.endDatetime);

    return (
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-bold text-[#031136]"><Link to={detailsTo} className="hover:underline">{activity.name}</Link></h4>
                {activity.mandatory && (
                    <span className="rounded-full bg-[#FF5903]/10 px-3 py-1 text-xs font-medium text-[#FF5903]">Required</span>
                )}
            </div>

            {start && <p className="text-sm text-gray-700">🕒 {start}{end && ` – ${end}`}</p>}
            {(activity.location || activity.address) && (
                <p className="text-sm text-gray-700">
                    📍 {[activity.location, activity.address].filter(Boolean).join(", ")}
                </p>
            )}
            <p className="text-sm text-gray-700">💵 {formatCost(activity.cost)}</p>
            {activity.description && <p className="text-gray-600">{activity.description}</p>}
            {activity.notes && <p className="text-sm italic text-gray-500">Note: {activity.notes}</p>}
            {editTo && <Link to={editTo} className="inline-block text-sm font-medium text-[#434A90] underline">Edit</Link>}
        </article>
    );
}
