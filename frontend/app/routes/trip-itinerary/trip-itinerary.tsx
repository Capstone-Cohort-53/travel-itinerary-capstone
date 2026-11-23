import {Link} from "react-router";
import {z} from "zod";
import type {Route} from "./+types/trip-itinerary";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {getTrip, type Trip} from "~/utils/models/trip.model";
import {type Activity, getActivitiesByTripId} from "~/utils/models/activity.model";
import {googleMapsUrl} from "~/utils/google-maps";
import {chip, emphasis, eyebrow, Gem, goldButton, headline, outlineButton, Parchment, RoyalPage} from "~/components/royal";

export function meta({}: Route.MetaArgs) {
    return [{title: "Trip Itinerary | TripsQueen"}];
}

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

/** The trip's name as a Playfair headline, its last word in italic watermelon pink like the design ("Weekend in *Santa Fe*"). */
function TripTitle({title}: { title: string }) {
    const words = title.trim().split(/\s+/);
    const last = words.pop() ?? "";
    return (
        <h1 className={`${headline} mt-2 break-words text-4xl sm:text-5xl`}>
            {words.length > 0 && `${words.join(" ")} `}<em className={emphasis}>{last}</em>
        </h1>
    );
}

const backLinkClass = "inline-flex min-h-11 items-center rounded-md text-sm font-bold text-bay hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export default function TripItinerary(props: Route.ComponentProps) {
    const {trip, activities, isOwner, message, activitiesMessage} = props.loaderData;

    if (trip === null) {
        return (
            <RoyalPage width="max-w-3xl">
                <Parchment compact>
                    <Link to="/my-trips" className={backLinkClass}>← My Trips</Link>
                    <p className={`${eyebrow} mt-2`}>The royal itinerary</p>
                    <p role="alert" className="mt-4 rounded-2xl border-[1.5px] border-royal-red bg-royal-red/5 p-5 font-medium text-royal-red">{message}</p>
                </Parchment>
            </RoyalPage>
        );
    }

    const days = groupByDay(activities);
    const length = tripLength(trip);

    return (
        <RoyalPage>
            <Parchment>
                {/* header: back link, title and the trip's details, with the actions on the right */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <Link to="/my-trips" className={backLinkClass}>← My Trips</Link>
                        <p className={`${eyebrow} mt-2`}>The royal itinerary</p>
                        <TripTitle title={trip.title}/>
                        <p className="mt-2 text-[15px] text-bay">
                            {trip.destination} · {formatTripDate(trip.startDate)} – {formatTripDate(trip.endDate)} · {length} {length === 1 ? "day" : "days"}
                        </p>
                    </div>

                    {/* phones: the buttons stacked full width (Edit trip and Add activity for the organizer only); wider screens: side by side on the right */}
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                        {isOwner && (
                            <Link to={`/trip-itinerary/${trip.id}/edit`} className={outlineButton}>
                                Edit trip
                            </Link>
                        )}
                        <Link to={`/travel-itinerary/${trip.id}`} className={outlineButton}>
                            Travelers &amp; Invites
                        </Link>
                        {isOwner && (
                            <Link to={`/travel-itinerary/${trip.id}/activity/new`} className={goldButton}>
                                + Add activity
                            </Link>
                        )}
                    </div>
                </div>

                {/* About this trip: a full-width card right under the trip's name and dates */}
                <div className="mt-6">
                    <TripCard trip={trip}/>
                </div>

                {/*
                  phones: one column, attendance (organizer only), then the itinerary.
                  wide screens: the itinerary on the left, attendance on the right.
                  Non-organizers have no attendance card, so the itinerary takes the full width.
                */}
                <div className={`mt-6 sm:mt-8 grid gap-6 lg:items-start ${isOwner ? "lg:grid-cols-[1fr_18rem]" : ""}`}>
                    {isOwner && (
                        <div className="order-1 lg:order-2">
                            <AttendanceCard counts={null}/>
                        </div>
                    )}

                    {/* the itinerary, one section per day */}
                    <div className="order-2 min-w-0 space-y-8 lg:order-1">
                        {activitiesMessage && (
                            <p role="alert" className="rounded-2xl border-[1.5px] border-royal-red bg-royal-red/5 p-5 font-medium text-royal-red">{activitiesMessage}</p>
                        )}

                        {days.map((day, index) => (
                            <section key={day.key} className="space-y-3">
                                {/* the day's name beside a gem, with a thin rule running to the edge */}
                                <h2 className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.22em] text-navy">
                                    <Gem color={index % 2 === 0 ? "pink" : "lilac"} size={22}/>
                                    <span>{day.label}</span>
                                    <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-navy"/>
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
            </Parchment>
        </RoyalPage>
    );
}

type AttendanceCounts = { going: number; maybe: number; notGoing: number; noResponse: number };

/**
 * RSVP totals across all of the trip's activities.
 *
 * PLACEHOLDER: there are no activity RSVP endpoints yet, so the page passes
 * `counts={null}` and the card shows "#" in place of each number. Once the
 * ACTIVITY RSVP endpoints exist, load the totals in the loader and pass them in.
 */
function AttendanceCard({counts}: { counts: AttendanceCounts | null }) {
    const total = counts ? counts.going + counts.maybe + counts.notGoing + counts.noResponse : 0;
    // bar: the segment's color; box: the matching tile, with text dark or light enough to read on it
    const segments = [
        {label: "Going", value: counts?.going, bar: "bg-bay", box: "bg-bay text-white"},
        {label: "Maybe", value: counts?.maybe, bar: "bg-lilac", box: "bg-lilac text-navy"},
        {label: "Not going", value: counts?.notGoing, bar: "bg-pink", box: "bg-pink text-navy"},
        {label: "No response", value: counts?.noResponse, bar: "bg-mist", box: "bg-mist text-navy"},
    ];

    return (
        <aside className="rounded-2xl border-[1.5px] border-navy bg-lilac/10 p-5">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-2xl font-extrabold text-navy">Royal Headcount</h2>
                    <span className="inline-flex items-center rounded-full bg-navy px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        Organizer only
                    </span>
                </div>
                <p className="hidden text-sm text-bay lg:block">Across all activities · {counts ? total : "#"} invited</p>

                {/* one bar split by how people answered; empty mist until there are RSVPs */}
                <div className="flex h-4 overflow-hidden rounded-full border-[1.5px] border-navy bg-mist">
                    {counts && total > 0 && segments.map((segment) => (
                        <div
                            key={segment.label}
                            className={segment.bar}
                            style={{width: `${((segment.value ?? 0) / total) * 100}%`}}
                        />
                    ))}
                </div>

                {/* phones: one short line under the bar instead of the four boxes */}
                <p className="text-xs text-bay lg:hidden">
                    {segments.map((segment) => `${segment.value ?? "#"} ${segment.label.toLowerCase()}`).join(" · ")}
                </p>

                <dl className="hidden grid-cols-2 gap-2.5 lg:grid">
                    {segments.map((segment) => (
                        <div key={segment.label} className={`rounded-xl px-3.5 py-3 ${segment.box}`}>
                            <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">{segment.label}</dt>
                            <dd className="mt-1 font-display text-2xl font-extrabold">{segment.value ?? "#"}</dd>
                        </div>
                    ))}
                </dl>

                {counts === null && (
                    <p className="text-xs text-bay">Totals will show here once travelers can RSVP to activities.</p>
                )}
            </div>
        </aside>
    );
}

/** The full-width card under the trip's header: its description. */
function TripCard({trip}: { trip: Trip }) {
    return (
        <section className="rounded-2xl border-[1.5px] border-navy bg-white p-5 sm:p-6">
            <h2 className={eyebrow}>About this trip</h2>
            <p className="mt-2 break-words whitespace-pre-line text-lg leading-relaxed text-navy">{trip.description ?? "No description yet."}</p>
        </section>
    );
}

const activityLinkClass = "inline-flex min-h-11 items-center rounded-md underline underline-offset-2 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

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
        <article className="flex flex-col gap-1 rounded-2xl border-[1.5px] border-navy bg-white px-4 py-4 sm:flex-row sm:gap-5 sm:px-5">
            <div className="flex items-start justify-between gap-2 sm:block sm:w-20 sm:shrink-0">
                {/* the time in Playfair italic, royal red so it stays readable at this size */}
                <p className="pt-0.5 font-display text-lg font-semibold italic text-royal-red">
                    {start ?? "—"}
                    {end && (
                        <span className="sm:block sm:text-sm sm:font-medium">
                            <span className="sm:hidden"> – </span>
                            <span className="hidden sm:inline">to </span>
                            {end}
                        </span>
                    )}
                </p>
                {activity.mandatory && (
                    <span className={`${chip} sm:hidden`}>Required</span>
                )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
                {/* the name opens the activity's details page, where its map is */}
                <h3 className="break-words font-display text-[22px] font-semibold leading-tight text-navy">
                    <Link to={detailsTo} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">{activity.name}</Link>
                </h3>
                <p className="text-sm text-bay">
                    {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-sm underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                            📍 {place}<span className="sr-only"> (opens Google Maps in a new tab)</span>
                        </a>
                    )}
                    {mapsUrl && " · "}{formatCost(activity.cost)}
                </p>
                {activity.description && <p className="text-sm text-navy">{activity.description}</p>}
                {activity.notes && <p className="text-sm italic text-bay">Note: {activity.notes}</p>}
                <div className="flex flex-wrap gap-x-5 text-sm font-bold text-bay">
                    <Link to={detailsTo} className={activityLinkClass}>View details &amp; map</Link>
                    {editTo && <Link to={editTo} className={activityLinkClass}>Edit</Link>}
                </div>
            </div>

            {activity.mandatory && (
                <span className="hidden self-start sm:block"><span className={chip}>Required</span></span>
            )}
        </article>
    );
}
