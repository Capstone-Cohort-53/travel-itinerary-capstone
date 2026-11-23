import {lazy, Suspense, useEffect, useState} from "react";
import {Link, useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import type {Route} from "./+types/activity-details";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {getActivity, type Activity} from "~/utils/models/activity.model";
import {getProfileByProfileId} from "~/utils/models/profile.model";
import {
    countAttendance,
    getActivityRsvps,
    getTripMembers,
    GOING_OPTIONS,
    postActivityRsvp,
    RsvpFormSchema,
    type Attendance,
    type RsvpForm
} from "~/utils/models/activity-rsvp.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";
import {googleMapsUrl} from "~/utils/google-maps";


/**
 * One activity, for anyone on the trip. The organizer sees the Attendance
 * panel and an Edit button; travelers see "Will you attend?" and answer for
 * their household. Everything comes from the API: the trip, the activity,
 * everyone's RSVPs, the member list and the organizer's profile.
 */
export async function loader({request, params}: Route.LoaderArgs) {
    const signedInUser = await requireSignedInUser(request)

    // the API only returns the trip to its owner and members who accepted an invite
    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        throw new Response(null, {status: 404, statusText: 'Trip not found.'})
    }

    const [activity, rsvps, members, organizerResult] = await Promise.all([
        getActivity(params.id, params.activityId, signedInUser),
        getActivityRsvps(params.activityId, signedInUser),
        getTripMembers(params.id, signedInUser),
        getProfileByProfileId(trip.ownerId, signedInUser),
    ])
    if (activity === null) {
        throw new Response(null, {status: 404, statusText: 'Activity not found.'})
    }

    const isOrganizer = trip.ownerId === signedInUser.profile.id
    const myMember = members.find((member) => member.profileId === signedInUser.profile.id) ?? null
    const myRsvp = myMember === null ? null : rsvps.find((rsvp) => rsvp.memberId === myMember.id) ?? null

    // what the RSVP form starts with: the saved answer, or the household size from the invite
    const rsvpValues: RsvpForm = {
        going: myRsvp?.going ?? ('' as RsvpForm['going']),
        adults: String(myRsvp?.adults ?? myMember?.adults ?? 1),
        children: String(myRsvp?.children ?? myMember?.children ?? 0),
    }

    const organizer = organizerResult.profile
    return {
        trip,
        activity,
        isOrganizer,
        // only the organizer gets the counts ("Travelers never see this panel")
        attendance: isOrganizer ? countAttendance(rsvps, members) : null,
        canRsvp: !isOrganizer && myMember !== null,
        hasAnswered: myRsvp !== null,
        rsvpValues,
        organizer: organizer === null ? null : {name: organizer.name, email: organizer.email},
    }
}


export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    // never trust the browser: validate again with the same schema the form used
    const result = RsvpFormSchema.safeParse(formData)
    if (!result.success) {
        return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
    }

    // 201 the first time, 200 when the answer changes
    const status = await postActivityRsvp(params.activityId, result.data, signedInUser)
    if (status.status !== 200 && status.status !== 201) {
        return {success: false, status}
    }
    return {success: true, status: {...status, message: 'Your RSVP has been saved.'}}
}


// ── formatting: activity times are saved as the destination's clock time, marked UTC ──

function formatDate(date: Date, weekday: 'long' | 'short' = 'long'): string {
    return date.toLocaleDateString('en-US', {timeZone: 'UTC', weekday, month: weekday === 'long' ? 'long' : 'short', day: 'numeric', year: 'numeric'})
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {timeZone: 'UTC', hour: 'numeric', minute: '2-digit'})
}

/** "Saturday, October 24, 2026", or a range when the activity runs over several days. */
function describeDate(activity: Activity): string {
    const {startDatetime: start, endDatetime: end} = activity
    if (start === null) {
        return 'Not set yet'
    }
    const sameDay = end === null || end.toISOString().slice(0, 10) === start.toISOString().slice(0, 10)
    return sameDay ? formatDate(start) : `${formatDate(start, 'short')} – ${formatDate(end, 'short')}`
}

/** "6:00 – 8:00 PM", "6:00 PM", or "Not set yet". */
function describeTime(activity: Activity): string {
    const {startDatetime: start, endDatetime: end} = activity
    if (start === null) {
        return 'Not set yet'
    }
    return end === null ? formatTime(start) : `${formatTime(start)} – ${formatTime(end)}`
}

function describeCost(cost: number): string {
    return cost === 0 ? 'Free' : `${cost.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} per person`
}


// ── shared pieces ──

const cardClass = "rounded-3xl border-2 border-[#031136] bg-white"
const tileLabelClass = "text-xs font-bold uppercase tracking-wider text-[#434A90]"

// Leaflet only works in a browser, so its code is fetched only after the page mounts there
const ActivityMap = lazy(() => import("~/routes/activity/activity-map"))

/** The Leaflet map, rendered in the browser only; during server rendering a same-sized placeholder holds its place. */
function ClientOnlyMap(props: { lat: number, lng: number, label: string }) {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => setIsMounted(true), [])

    const placeholder = <div className="h-64 w-full bg-[#FBF3FA] sm:h-72" aria-hidden="true"/>
    if (!isMounted) {
        return placeholder
    }
    return (
        <Suspense fallback={placeholder}>
            <ActivityMap {...props}/>
        </Suspense>
    )
}

function SunsetStripes() {
    return (
        <div aria-hidden="true">
            <div className="h-1.5 bg-[#FF5903]"/>
            <div className="h-1.5 bg-[#FF6B6C]"/>
            <div className="h-1.5 bg-[#C9A3CB]"/>
        </div>
    )
}

function InfoTile({label, value}: { label: string, value: string }) {
    return (
        <div className={`${cardClass} px-4 py-3`}>
            <p className={tileLabelClass}>{label}</p>
            <p className="mt-1 font-bold text-[#031136]">{value}</p>
        </div>
    )
}


export default function ActivityDetails({loaderData}: Route.ComponentProps) {
    const {trip, activity, isOrganizer, attendance, canRsvp, hasAnswered, rsvpValues, organizer} = loaderData
    const typeLabel = activity.mandatory ? 'Required' : 'Optional'

    return (
        <div className="bg-[#FBF3FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* ── heading ── */}
                <Link to={`/trip-itinerary/${trip.id}`} className="text-sm font-bold text-[#434A90] hover:underline">
                    ← Back to itinerary
                </Link>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className={`inline-block rounded-full border-2 border-[#031136] px-3 py-0.5 text-xs font-bold text-[#031136] ${activity.mandatory ? 'bg-[#FF5903]' : 'bg-[#C9A3CB]'}`}>
                            {typeLabel}
                        </span>
                        <h1 className="mt-2 font-display text-4xl sm:text-6xl font-bold tracking-tight break-words text-[#031136]">{activity.name}</h1>
                        <p className="mt-1 text-sm text-[#434A90]">{trip.title}</p>
                    </div>
                    {isOrganizer && (
                        <Link to={`/travel-itinerary/${trip.id}/activity/${activity.id}/edit`}
                              className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] bg-white text-center text-sm font-bold text-[#031136] hover:bg-[#031136]/5 transition">
                            Edit Activity
                        </Link>
                    )}
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_17rem] lg:items-start">

                    {/* ── the activity ── */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                            <InfoTile label="Date" value={describeDate(activity)}/>
                            <InfoTile label="Time" value={describeTime(activity)}/>
                            <div className="hidden sm:block"><InfoTile label="Type" value={typeLabel}/></div>
                        </div>

                        {(activity.location || activity.address) && (
                            <div className={`${cardClass} overflow-hidden`}>
                            <div className="flex items-center gap-4 p-4">
                                <span aria-hidden="true"
                                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#C9A3CB]">
                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#031136"
                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>
                                        <circle cx="12" cy="10" r="2.5"/>
                                    </svg>
                                </span>
                                {/* the name and address open the place in Google Maps (the app, on phones) */}
                                <div className="min-w-0">
                                    <p className={tileLabelClass}>Location</p>
                                    <a href={googleMapsUrl(activity.location, activity.address) ?? undefined}
                                       target="_blank" rel="noreferrer" className="group block">
                                        {activity.location && <p className="font-display text-2xl font-semibold text-[#031136] break-words group-hover:underline">{activity.location}</p>}
                                        {activity.address && <p className="text-sm text-[#031136] whitespace-pre-line group-hover:underline">{activity.address}</p>}
                                        <span className="mt-1 inline-block text-sm font-bold text-[#434A90] underline">
                                            Open in Google Maps ↗<span className="sr-only"> (opens in a new tab)</span>
                                        </span>
                                    </a>
                                </div>
                            </div>
                            {activity.lat !== null && activity.lng !== null && (
                                <div className="border-t-2 border-[#031136]">
                                    <ClientOnlyMap lat={activity.lat} lng={activity.lng}
                                                   label={activity.location ?? activity.address ?? activity.name}/>
                                </div>
                            )}
                            </div>
                        )}

                        {activity.description && (
                            <div>
                                <p className={tileLabelClass}>Description</p>
                                <p className="mt-1 text-[#031136] whitespace-pre-line">{activity.description}</p>
                            </div>
                        )}

                        <div className={`${cardClass} p-6`}>
                            <h2 className="font-display text-2xl font-semibold text-[#434A90]">Cost &amp; logistics</h2>
                            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm text-[#031136] sm:grid-cols-[10rem_1fr]">
                                <dt className="font-bold">Cost per person</dt>
                                <dd>{describeCost(activity.cost)}</dd>
                                {activity.notes && <>
                                    <dt className="font-bold">What to bring</dt>
                                    <dd className="whitespace-pre-line">{activity.notes}</dd>
                                </>}
                            </dl>
                        </div>

                        <div>
                            <h2 className="font-display text-2xl font-semibold text-[#031136]">Organizer</h2>
                            {isOrganizer ? (
                                <p className="mt-1 text-sm text-[#031136]">
                                    You are the organizer of this trip. Travelers see your contact details here.
                                </p>
                            ) : organizer && (
                                <div className={`${cardClass} mt-2 flex items-center justify-between gap-4 px-4 py-3`}>
                                    <div>
                                        <p className="font-bold text-[#031136]">{organizer.name}</p>
                                        <p className="text-xs text-[#434A90]">{organizer.email}</p>
                                    </div>
                                    <a href={`mailto:${organizer.email}`} className="text-sm font-bold text-[#031136] underline">
                                        Contact organizer
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── side panel: Attendance for the organizer (above the details on mobile), RSVP for travelers ── */}
                    {attendance && (
                        <aside className="order-first lg:order-none">
                            <AttendancePanel attendance={attendance}/>
                        </aside>
                    )}
                    {canRsvp && (
                        <aside>
                            <RsvpPanel defaultValues={rsvpValues} hasAnswered={hasAnswered}/>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    )
}


/** The organizer's counts, in people (adults + children). */
function AttendancePanel({attendance}: { attendance: Attendance }) {
    const total = attendance.going + attendance.maybe + attendance.notGoing + attendance.notResponded
    const tiles = [
        {label: 'Going', count: attendance.going, className: 'bg-[#434A90] text-white', bar: 'bg-[#434A90]'},
        {label: 'Maybe', count: attendance.maybe, className: 'bg-[#C9A3CB] text-[#031136]', bar: 'bg-[#C9A3CB]'},
        {label: 'Not going', count: attendance.notGoing, className: 'bg-[#FF6B6C] text-[#031136]', bar: 'bg-[#FF6B6C]'},
        {label: 'Not responded', count: attendance.notResponded, className: 'bg-[#ECE9F3] text-[#031136]', bar: 'bg-[#ECE9F3]'},
    ]

    return (
        <section aria-labelledby="attendance-heading" className={`${cardClass} overflow-hidden`}>
            <div className="bg-[#031136] px-5 pt-4 pb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C9A3CB]">Organizer only</p>
                <h2 id="attendance-heading" className="font-display text-3xl font-bold text-white">Attendance</h2>
            </div>
            <SunsetStripes/>
            <div className="space-y-3 p-4">
                {/* one bar split by answer */}
                <div className="flex h-4 overflow-hidden rounded-full border-2 border-[#031136] bg-[#ECE9F3]" aria-hidden="true">
                    {total > 0 && tiles.map((tile) => (
                        <div key={tile.label} className={tile.bar} style={{width: `${(tile.count / total) * 100}%`}}/>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {tiles.map((tile) => (
                        <div key={tile.label} className={`rounded-2xl px-3 py-2 ${tile.className}`}>
                            <p className="text-xs font-bold">{tile.label}</p>
                            <p className="font-display text-4xl font-bold">{tile.count}</p>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-[#031136]">
                    Counts are people: each answer includes its adults and children. Travelers never see this panel.
                </p>
            </div>
        </section>
    )
}


/** "Will you attend?": the traveler's answer for their household, saved with POST /activity/:activityId/rsvp. */
function RsvpPanel({defaultValues, hasAnswered}: { defaultValues: RsvpForm, hasAnswered: boolean }) {
    const fetcher = useFetcher<FormActionResponse>()
    const isSaving = fetcher.state !== 'idle'
    const labels: Record<RsvpForm['going'], string> = {yes: 'Going', maybe: 'Maybe', no: 'Not going'}

    const form = useForm({
        defaultValues,
        validators: {onChange: RsvpFormSchema, onSubmit: RsvpFormSchema},
        onSubmit: async ({value}) => {
            await fetcher.submit(value, {method: 'post'})
        },
    })

    // after saving, the loader reloads; keep the form showing the saved answer
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.success) {
            form.reset(form.state.values)
        }
    }, [fetcher.state, fetcher.data, form])

    const saved = fetcher.data?.success === true
    const numberClass = "w-full px-3 py-2 rounded-xl border-2 border-[#434A90] bg-[#031136] text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5903]"

    return (
        <section aria-labelledby="rsvp-heading" className="rounded-3xl bg-[#031136] p-5 text-white">
            <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                <div className="h-1.5 rounded-full bg-[#FF5903]"/>
                <div className="h-1.5 rounded-full bg-[#FF6B6C]"/>
                <div className="h-1.5 rounded-full bg-[#C9A3CB]"/>
                <div className="h-1.5 rounded-full bg-[#434A90]"/>
            </div>
            <h2 id="rsvp-heading" className="mt-5 font-display text-3xl font-bold leading-tight">Will you attend?</h2>
            <p className="mt-2 text-sm">Answer for your household, and say how many adults and children are coming.</p>

            <form
                className="mt-4 space-y-4 border-t border-white/20 pt-4"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >
                <form.Field name="going">
                    {(field) => (
                        <fieldset>
                            <legend className="sr-only">Will you attend?</legend>
                            <div className="grid grid-cols-3 gap-2">
                                {GOING_OPTIONS.map((option) => {
                                    const checked = field.state.value === option
                                    return (
                                        <label key={option}
                                               className={`cursor-pointer rounded-full border-2 py-2 text-center text-sm font-bold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white ${checked ? 'border-[#FF5903] bg-[#FF5903] text-[#031136]' : 'border-[#434A90] text-white hover:bg-white/10'}`}>
                                            <input type="radio" name={field.name} value={option} checked={checked}
                                                   onBlur={field.handleBlur}
                                                   onChange={() => field.handleChange(option)}
                                                   className="sr-only"/>
                                            {labels[option]}
                                        </label>
                                    )
                                })}
                            </div>
                            {field.state.meta.isTouched && field.state.meta.errors[0] && (
                                <p className="mt-1 text-sm text-[#FF6B6C]">{field.state.meta.errors[0].message}</p>
                            )}
                        </fieldset>
                    )}
                </form.Field>

                <div className="grid grid-cols-2 gap-3">
                    {(['adults', 'children'] as const).map((name) => (
                        <form.Field key={name} name={name}>
                            {(field) => (
                                <div>
                                    <label htmlFor={`rsvp-${name}`} className="mb-1 block text-sm font-bold capitalize">{name}</label>
                                    <input id={`rsvp-${name}`} name={field.name} type="number" min="0" step="1" inputMode="numeric"
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           className={numberClass}/>
                                    {field.state.meta.isTouched && field.state.meta.errors[0] && (
                                        <p className="mt-1 text-xs text-[#FF6B6C]">{field.state.meta.errors[0].message}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>
                    ))}
                </div>

                <form.Subscribe selector={(state) => state.canSubmit}>
                    {(canSubmit) => (
                        <button type="submit" disabled={!canSubmit || isSaving}
                                className="w-full rounded-full border-2 border-[#031136] bg-[#FF5903] py-3 font-bold text-[#031136] shadow-[4px_4px_0_#FF6B6C] transition hover:bg-[#FF5903]/90 disabled:opacity-50">
                            {isSaving ? 'Saving…' : hasAnswered ? 'Update RSVP' : 'Submit RSVP'}
                        </button>
                    )}
                </form.Subscribe>
            </form>

            {saved ? (
                <div role="status" className="mt-4 rounded-2xl bg-[#434A90] p-4">
                    <p className="font-bold">Your RSVP has been saved.</p>
                    <p className="text-sm">Change a response anytime and submit again.</p>
                </div>
            ) : (
                <StatusMessage actionData={fetcher.data}/>
            )}
        </section>
    )
}
