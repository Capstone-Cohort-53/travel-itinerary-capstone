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
import {card, chip, Crown, emphasis, eyebrow, Gem, GemDivider, headline, input, outlineButton, Parchment, RoyalPage, WaxSealButton} from "~/components/royal";


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

const tileClass = "rounded-[14px] border-[1.5px] border-navy bg-white"
const tileLabelClass = "text-[10px] font-bold uppercase tracking-[0.18em] text-bay"
const linkFocus = "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
// the navy side panels: a navy card with a thin lilac inner frame, like the design
const navyPanelClass = "rounded-[20px] bg-navy p-1.5 text-white"
const navyPanelInnerClass = "rounded-2xl border border-lilac p-5"
// "Not going" carries diagonal stripes, so it doesn't depend on hue alone to tell it from "Maybe"
const notGoingStripes = {backgroundImage: 'repeating-linear-gradient(135deg, rgba(3,17,54,0.35) 0 3px, transparent 3px 7px)'}

// Leaflet only works in a browser, so its code is fetched only after the page mounts there
const ActivityMap = lazy(() => import("~/routes/activity/activity-map"))

/** The Leaflet map, rendered in the browser only; during server rendering a placeholder holds its place. Fills its parent. */
function ClientOnlyMap(props: { lat: number, lng: number, label: string }) {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => setIsMounted(true), [])

    const placeholder = <div className="h-full w-full bg-mist" aria-hidden="true"/>
    if (!isMounted) {
        return placeholder
    }
    return (
        <Suspense fallback={placeholder}>
            <ActivityMap {...props}/>
        </Suspense>
    )
}

/** The activity's name as a Playfair headline, with its last word in italic watermelon pink. */
function ActivityName({name}: { name: string }) {
    const split = name.trimEnd().lastIndexOf(' ')
    if (split <= 0) {
        return <>{name}</>
    }
    return <>{name.slice(0, split + 1)}<em className={emphasis}>{name.slice(split + 1)}</em></>
}

function InfoTile({label, value}: { label: string, value: string }) {
    return (
        <div className={`${tileClass} px-4 py-3`}>
            <p className={tileLabelClass}>{label}</p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-navy">{value}</p>
        </div>
    )
}


export default function ActivityDetails({loaderData}: Route.ComponentProps) {
    const {trip, activity, isOrganizer, attendance, canRsvp, hasAnswered, rsvpValues, organizer} = loaderData
    const typeLabel = activity.mandatory ? 'Required' : 'Optional'

    return (
        <RoyalPage>
            <Parchment>

                {/* ── heading ── */}
                <Link to={`/trip-itinerary/${trip.id}`}
                      className={`inline-flex min-h-11 items-center text-sm font-bold text-bay hover:underline ${linkFocus}`}>
                    ← Back to itinerary
                </Link>

                <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <span className={activity.mandatory ? chip.replace('bg-lilac', 'bg-gold') : chip}>
                            {typeLabel}
                        </span>
                        <h1 className={`${headline} mt-3 text-4xl break-words sm:text-[54px]`}>
                            <ActivityName name={activity.name}/>
                        </h1>
                        <p className="mt-2 text-[15px] text-bay">{trip.title}</p>
                    </div>
                    {isOrganizer && (
                        <Link to={`/travel-itinerary/${trip.id}/activity/${activity.id}/edit`}
                              className={`${outlineButton} w-full shrink-0 sm:w-auto`}>
                            Edit Activity
                        </Link>
                    )}
                </div>

                <div className="my-8"><GemDivider/></div>

                <div className="grid gap-6 lg:grid-cols-[1fr_minmax(17rem,24rem)] lg:items-start">

                    {/* ── the activity ── */}
                    <div className="min-w-0 space-y-6">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <InfoTile label="Date" value={describeDate(activity)}/>
                            <InfoTile label="Time" value={describeTime(activity)}/>
                            <div className="hidden sm:block"><InfoTile label="Type" value={typeLabel}/></div>
                        </div>

                        {(activity.location || activity.address) && (
                            // phones: the map is a short strip under the address. Wider screens: a small square on the right
                            <div className={`${tileClass} flex flex-col overflow-hidden sm:flex-row`}>
                            <div className="flex flex-1 items-center gap-4 p-4">
                                <span aria-hidden="true"
                                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-navy bg-lilac">
                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#031136"
                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>
                                        <circle cx="12" cy="10" r="2.5"/>
                                    </svg>
                                </span>
                                {/* the name and address open the place in Google Maps (the app, on phones) */}
                                <div className="min-w-0">
                                    <p className={tileLabelClass}>Where</p>
                                    <a href={googleMapsUrl(activity.location, activity.address) ?? undefined}
                                       target="_blank" rel="noreferrer" className={`group block ${linkFocus}`}>
                                        {activity.location && <p className="font-display text-2xl font-bold text-navy break-words group-hover:underline">{activity.location}</p>}
                                        {activity.address && <p className="text-sm text-navy whitespace-pre-line break-words group-hover:underline">{activity.address}</p>}
                                        <span className="mt-1 inline-flex min-h-11 items-center text-sm font-bold text-bay underline">
                                            Open in Google Maps ↗<span className="sr-only"> (opens in a new tab)</span>
                                        </span>
                                    </a>
                                </div>
                            </div>
                            {activity.lat !== null && activity.lng !== null && (
                                <div className="h-40 shrink-0 border-t-[1.5px] border-navy sm:h-auto sm:w-52 sm:aspect-square sm:border-t-0 sm:border-l-[1.5px]">
                                    <ClientOnlyMap lat={activity.lat} lng={activity.lng}
                                                   label={activity.location ?? activity.address ?? activity.name}/>
                                </div>
                            )}
                            </div>
                        )}

                        {activity.description && (
                            <div>
                                <p className={eyebrow}>Description</p>
                                <p className="mt-1.5 text-[15px] leading-relaxed text-navy whitespace-pre-line break-words">{activity.description}</p>
                            </div>
                        )}

                        <section className={card}>
                            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-navy">
                                <Gem color="lilac" size={20}/>
                                Cost &amp; logistics
                            </h2>
                            <dl className="mt-4 grid gap-x-6 gap-y-3 text-[15px] text-navy sm:grid-cols-[10rem_1fr]">
                                <dt className={`${tileLabelClass} sm:pt-1`}>Cost per person</dt>
                                <dd>{describeCost(activity.cost)}</dd>
                                {activity.notes && <>
                                    <dt className={`${tileLabelClass} sm:pt-1`}>What to bring</dt>
                                    <dd className="whitespace-pre-line break-words">{activity.notes}</dd>
                                </>}
                            </dl>
                        </section>

                        <section>
                            <h2 className="font-display text-2xl font-bold text-navy">The organizer</h2>
                            {isOrganizer ? (
                                <p className="mt-1 text-[15px] text-navy">
                                    You are the organizer of this trip. Travelers see your contact details here.
                                </p>
                            ) : organizer && (
                                <div className={`${tileClass} mt-3 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Crown size={26}/>
                                        <div className="min-w-0">
                                            <p className="font-bold text-navy break-words">{organizer.name}</p>
                                            <p className="text-xs text-bay break-all">{organizer.email}</p>
                                        </div>
                                    </div>
                                    <a href={`mailto:${organizer.email}`}
                                       className={`inline-flex min-h-11 items-center text-sm font-bold text-navy underline ${linkFocus}`}>
                                        Contact organizer
                                    </a>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── side panel: Attendance for the organizer, RSVP for travelers (both above the details on mobile) ── */}
                    {attendance && (
                        <aside className="order-first min-w-0 lg:order-none">
                            <AttendancePanel attendance={attendance}/>
                        </aside>
                    )}
                    {canRsvp && (
                        <aside className="order-first min-w-0 lg:order-none">
                            <RsvpPanel defaultValues={rsvpValues} hasAnswered={hasAnswered}/>
                        </aside>
                    )}
                </div>
            </Parchment>
        </RoyalPage>
    )
}


/** The organizer's counts, in people (adults + children). */
function AttendancePanel({attendance}: { attendance: Attendance }) {
    const total = attendance.going + attendance.maybe + attendance.notGoing + attendance.notResponded
    // each tile carries its label; "Not going" is also striped so it doesn't rely on hue to differ from "Maybe"
    const tiles = [
        {label: 'Going', count: attendance.going, className: 'bg-bay text-white', bar: 'bg-bay', style: undefined},
        {label: 'Maybe', count: attendance.maybe, className: 'bg-lilac text-navy', bar: 'bg-lilac', style: undefined},
        {label: 'Not going', count: attendance.notGoing, className: 'bg-pink text-navy', bar: 'bg-pink', style: notGoingStripes},
        {label: 'Not responded', count: attendance.notResponded, className: 'bg-mist text-navy', bar: 'bg-mist', style: undefined},
    ]

    return (
        <section aria-labelledby="attendance-heading" className={navyPanelClass}>
            <div className={`${navyPanelInnerClass} space-y-4`}>
                <div className="flex items-center gap-3">
                    <Crown size={30} outline="#ffffff"/>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac">For the queen's eyes only</p>
                        <h2 id="attendance-heading" className="font-display text-2xl font-bold italic text-white">The Royal Headcount</h2>
                    </div>
                </div>

                {/* one bar split by answer */}
                <div className="flex h-4 overflow-hidden rounded-full border-[1.5px] border-white bg-mist" aria-hidden="true">
                    {total > 0 && tiles.map((tile) => (
                        <div key={tile.label} className={tile.bar} style={{width: `${(tile.count / total) * 100}%`, ...tile.style}}/>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                    {tiles.map((tile) => (
                        <div key={tile.label} className={`rounded-[14px] px-3.5 py-3 ${tile.className}`}>
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                                {tile.style && <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm border border-navy/60" style={tile.style}/>}
                                {tile.label}
                            </p>
                            <p className="font-display text-[32px] font-semibold leading-none">{tile.count}</p>
                        </div>
                    ))}
                </div>
                <p className="text-xs leading-relaxed text-mist">
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
    // the shared label style, in lilac so it stays readable on the navy panel
    const navyLabel = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-lilac"

    return (
        <section aria-labelledby="rsvp-heading" className={navyPanelClass}>
            <div className={navyPanelInnerClass}>
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <Crown size={30} outline="#ffffff"/>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac">Your presence is requested</p>
                    <h2 id="rsvp-heading" className="font-display text-[26px] font-bold italic leading-tight text-white">
                        Will you attend, Your Majesty?
                    </h2>
                    <p className="text-sm text-mist">Answer for your household, and say how many adults and children are coming.</p>
                </div>

                <form
                    className="mt-4 space-y-4 border-t border-bay pt-4"
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
                                <div className="grid grid-cols-3 gap-1.5">
                                    {GOING_OPTIONS.map((option) => {
                                        const checked = field.state.value === option
                                        return (
                                            <label key={option}
                                                   className={`flex min-h-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] px-1 text-center text-[11px] font-bold uppercase tracking-[0.08em] transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-navy ${checked ? 'border-lilac bg-lilac text-navy' : 'border-bay bg-navy text-white hover:bg-white/10'}`}>
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
                                    <p className="mt-1 text-sm text-pink">{field.state.meta.errors[0].message}</p>
                                )}
                            </fieldset>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-2 gap-3">
                        {(['adults', 'children'] as const).map((name) => (
                            <form.Field key={name} name={name}>
                                {(field) => (
                                    <div>
                                        <label htmlFor={`rsvp-${name}`} className={navyLabel}>{name}</label>
                                        <input id={`rsvp-${name}`} name={field.name} type="number" min="0" step="1" inputMode="numeric"
                                               value={field.state.value}
                                               onBlur={field.handleBlur}
                                               onChange={(event) => field.handleChange(event.target.value)}
                                               className={`${input} min-h-11 text-center font-bold`}/>
                                        {field.state.meta.isTouched && field.state.meta.errors[0] && (
                                            <p className="mt-1 text-xs text-pink">{field.state.meta.errors[0].message}</p>
                                        )}
                                    </div>
                                )}
                            </form.Field>
                        ))}
                    </div>

                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <div className="flex justify-center pt-2 pb-1">
                                <WaxSealButton type="submit" disabled={!canSubmit || isSaving}>
                                    {isSaving ? 'Saving…' : hasAnswered ? <>Update{' '}<br/>my{' '}<br/>RSVP</> : <>Seal{' '}<br/>my{' '}<br/>RSVP</>}
                                </WaxSealButton>
                            </div>
                        )}
                    </form.Subscribe>
                </form>

                {saved ? (
                    <div role="status" className="mt-4 rounded-[14px] bg-bay p-4 text-center">
                        <p className="font-display text-lg font-semibold">Your RSVP is sealed.</p>
                        <p className="text-sm text-mist">Change a response anytime and seal it again.</p>
                    </div>
                ) : (
                    // the shared message is styled for parchment: give it a cream background on this navy panel
                    <div className="[&>div]:bg-parchment">
                        <StatusMessage actionData={fetcher.data}/>
                    </div>
                )}
            </div>
        </section>
    )
}
