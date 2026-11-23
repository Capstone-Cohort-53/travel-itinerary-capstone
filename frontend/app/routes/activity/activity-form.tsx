import {useState, type ChangeEvent, type ReactNode} from "react";
import {Link, useFetcher} from "react-router";
import {useForm, type AnyFieldApi} from "@tanstack/react-form";
import {ActivityFormSchema, type ActivityForm} from "~/utils/models/activity.model";
import type {Trip} from "~/utils/models/trip.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";
import type {Coordinates, PlaceSuggestion} from "~/utils/place-search";
import {PlaceSearchInput} from "~/routes/activity/place-search-input";
import {NeedIdeas} from "~/routes/activity/need-ideas";
import type {TripIdea} from "~/utils/trip-ideas";

/**
 * The activity form the Add and Edit pages share. TanStack Form validates with
 * the Zod schema as the user types; on submit the values go to the page's own
 * action, which validates again and saves. The action redirects to the trip's
 * itinerary on success, or returns a message that shows above the buttons.
 *
 * Styled after the "Retro Sunset · Add Activity" mockup. The mockup splits some
 * fields into several boxes (Date / Start / End, and Street / City, State / ZIP);
 * those boxes are combined here in the browser into the same startDatetime,
 * endDatetime and address values the API has always received.
 */

export const emptyActivityValues: ActivityForm = {
    name: '', mandatory: 'mandatory', startDatetime: '', endDatetime: '',
    description: '', location: '', address: '', cost: '', notes: '', lat: '', lng: '',
}

/** A trip date as YYYY-MM-DD. Trip dates are stored as UTC midnight. */
export function toDateString(date: Date): string {
    return date.toISOString().slice(0, 10)
}

/** A trip date for people to read, e.g. "Dec 1, 2026". */
export function formatTripDate(date: Date): string {
    return date.toLocaleDateString('en-US', {timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric'})
}

/**
 * The date the Add form starts on: today when the trip is underway, otherwise
 * the trip's first day. Either way it falls inside the trip.
 */
export function defaultActivityDate(tripStart: string, tripEnd: string): string {
    const today = toDateString(new Date())
    return today >= tripStart && today <= tripEnd ? today : tripStart
}

/** The server-side check both actions make: a start or end that was filled in has to fall within the trip. */
export function isDuringTrip(form: Pick<ActivityForm, 'startDatetime' | 'endDatetime'>, trip: Trip): boolean {
    const tripStart = toDateString(trip.startDate)
    const tripEnd = toDateString(trip.endDate)
    return [form.startDatetime, form.endDatetime]
        .filter(Boolean)
        .every((dateTime) => dateTime.slice(0, 10) >= tripStart && dateTime.slice(0, 10) <= tripEnd)
}


// ── the address boxes: one saved address, shown as Street / City, State / ZIP ──

type AddressParts = { street: string, cityState: string, zip: string }

/** "905 Alarid St, Santa Fe, NM 87505" → street, "Santa Fe, NM", "87505". Anything unusual stays whole in Street. */
export function splitAddress(address: string): AddressParts {
    const oneLine = address.replace(/\s*\n\s*/g, ', ').trim()
    const match = oneLine.match(/^(.+?),\s*([^,]+,\s*[A-Za-z]{2})\.?(?:\s+(\d{5}(?:-\d{4})?))?$/)
    return match
        ? {street: match[1], cityState: match[2], zip: match[3] ?? ''}
        : {street: oneLine, cityState: '', zip: ''}
}

/** The reverse of splitAddress: "street, City, ST ZIP", skipping empty boxes. */
export function joinAddress({street, cityState, zip}: AddressParts): string {
    const cityLine = [cityState.trim(), zip.trim()].filter(Boolean).join(' ')
    return [street.trim(), cityLine].filter(Boolean).join(', ')
}


/** A guide's description, cut to a few sentences for the Description box. */
function shortDescription(text: string, maxLength = 400): string {
    if (text.length <= maxLength) return text
    const cut = text.slice(0, maxLength)
    const lastSentence = cut.lastIndexOf('. ')
    return lastSentence > maxLength / 3 ? cut.slice(0, lastSentence + 1) : `${cut.trimEnd()}…`
}


// ── the date and time boxes: Date + Start + End, saved as startDatetime and endDatetime ──

type When = { date: string, start: string, end: string }

function splitWhen(values: ActivityForm): When {
    return {
        date: (values.startDatetime || values.endDatetime).slice(0, 10),
        start: values.startDatetime.slice(11, 16),
        end: values.endDatetime.slice(11, 16),
    }
}

/**
 * What's wrong with the Date / Start / End boxes, or null when they can be saved.
 * The database keeps a date and a time together (startDatetime), so a date with
 * no start time, or a time with no date, would quietly be dropped on save.
 */
export function whenProblem({date, start, end}: When): string | null {
    if (!date && (start || end)) {
        return 'Pick a date for this time.'
    }
    if (date && !start) {
        return 'Add a start time to keep this date, or clear the date if it isn’t set yet.'
    }
    return null
}

/** "Sat, Oct 24 | 6:00 – 8:00 PM" for the itinerary preview. */
function describeWhen({date, start, end}: When): string {
    if (!date) {
        return 'Date not set'
    }
    const day = new Date(`${date}T00:00Z`).toLocaleDateString('en-US', {timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric'})
    const time = (hhmm: string) => new Date(`1970-01-01T${hhmm}Z`).toLocaleTimeString('en-US', {timeZone: 'UTC', hour: 'numeric', minute: '2-digit'})
    const times = [start, end].filter(Boolean).map(time).join(' – ')
    return times ? `${day} | ${times}` : day
}


// ── Retro Sunset styles ──

const labelClass = "block text-sm font-bold text-[#031136] mb-1.5"
const inputClass = "w-full px-4 py-2.5 rounded-xl border-2 bg-white text-sm text-[#031136] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5903] focus:ring-offset-1"
const cardClass = "bg-white rounded-3xl border-2 border-[#031136] p-6 sm:p-7 space-y-4"
const sectionTitleClass = "font-display text-2xl font-semibold text-[#434A90]"
const pillClass = "w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] font-bold text-sm text-center transition"

// ── field helpers: every input shows its first error once it has been touched ──

function fieldError(field: AnyFieldApi): string | undefined {
    return field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
}

/** The props every text-like input and textarea shares. */
function inputProps(field: AnyFieldApi) {
    const error = fieldError(field)
    return {
        id: field.name,
        name: field.name,
        value: field.state.value as string,
        onBlur: field.handleBlur,
        onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.handleChange(event.target.value),
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${field.name}-error` : undefined,
        className: `${inputClass} ${error ? 'border-red-600' : 'border-[#031136]'}`,
    }
}

function FieldError({field}: {field: AnyFieldApi}) {
    const error = fieldError(field)
    return error ? <p id={`${field.name}-error`} className="mt-1 text-sm text-red-600">{error}</p> : null
}

/** A plain input for the combined boxes, which aren't fields of their own. */
function boxClass(hasError: boolean) {
    return `${inputClass} ${hasError ? 'border-red-600' : 'border-[#031136]'}`
}


type ActivityFormPageProps = {
    trip: Trip,
    /** what the form starts with: empty values for Add, the saved activity for Edit */
    defaultValues: ActivityForm,
    heading: string,
    intro: string,
    submitLabel: string,
    /** shown below the form, outside it: the Edit page's delete button */
    footer?: ReactNode,
    /** a place on this trip, so Location Name suggestions near it come first; null when there isn't one yet */
    searchNear: Coordinates | null,
    /** show "Need ideas?" above the form (the Add page, not Edit) */
    showIdeas?: boolean,
}

export function ActivityFormPage({trip, defaultValues, heading, intro, submitLabel, footer, searchNear, showIdeas = false}: ActivityFormPageProps) {
    const fetcher = useFetcher<FormActionResponse>()
    const isSaving = fetcher.state !== 'idle'

    const form = useForm({
        defaultValues,
        validators: {onChange: ActivityFormSchema, onSubmit: ActivityFormSchema},
        onSubmit: async ({value}) => {
            // the action redirects to the trip on success
            await fetcher.submit(value, {method: 'post'})
        },
    })

    // what's typed in the split boxes; each change writes the combined value into the form
    const [when, setWhen] = useState<When>(() => splitWhen(defaultValues))
    const [addressParts, setAddressParts] = useState<AddressParts>(() => splitAddress(defaultValues.address))

    /** A place picked from the Location Name suggestions fills in the name, the address boxes and the map pin. */
    function pickPlace(place: PlaceSuggestion) {
        const parts = {street: place.street, cityState: place.cityState, zip: place.zip}
        setAddressParts(parts)
        form.setFieldValue('location', place.name)
        form.setFieldValue('address', joinAddress(parts))
        form.setFieldValue('lat', String(place.lat))
        form.setFieldValue('lng', String(place.lng))
    }

    /**
     * An idea from "Need ideas?" fills in the name, the location, the address and
     * its map pin, plus the description when that's still empty. Without a pin,
     * the address is looked up on save, as when it's typed by hand.
     */
    function pickIdea(idea: TripIdea) {
        // the guide's address is just the street part; the destination stands in for City, State
        const parts = {street: idea.address, cityState: trip.destination?.trim() ?? '', zip: ''}
        setAddressParts(parts)
        form.setFieldValue('name', idea.name)
        form.setFieldValue('location', idea.name)
        form.setFieldValue('address', joinAddress(parts))
        form.setFieldValue('lat', idea.lat === null ? '' : String(idea.lat))
        form.setFieldValue('lng', idea.lng === null ? '' : String(idea.lng))
        if (!form.getFieldValue('description').trim()) {
            form.setFieldValue('description', shortDescription(idea.description))
        }
    }

    const tripStart = toDateString(trip.startDate)
    const tripEnd = toDateString(trip.endDate)
    const tripDates = `${formatTripDate(trip.startDate)} – ${formatTripDate(trip.endDate)}`

    return (
        <div className="bg-[#FBF3FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* ── heading ── */}
                <p className="text-sm font-bold text-[#434A90]">{trip.title}</p>
                <h1 className="mt-1 font-display text-4xl sm:text-6xl font-bold tracking-tight break-words text-[#031136]">{heading}</h1>
                <p className="mt-2 mb-8 text-sm text-[#031136]">
                    {intro} <span className="text-[#434A90]">* Required</span>
                </p>

                <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">

                    <div className="space-y-5">
                        {showIdeas && (
                            <NeedIdeas near={searchNear} destination={trip.destination} onPick={pickIdea}/>
                        )}

                        <form
                            className="space-y-5"
                            noValidate
                            onSubmit={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                // a date with no start time (or the reverse) would be dropped on save:
                                // send the organizer to the box to fix instead of saving
                                if (whenProblem(when)) {
                                    document.getElementById(when.date ? 'activity-start' : 'activity-date')?.focus()
                                    return
                                }
                                void form.handleSubmit()
                            }}
                        >

                            {/* ── basic info ── */}
                            <section className={cardClass}>
                                <h2 className={sectionTitleClass}>Basic info</h2>

                                <form.Field name="name">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Activity Name *</label>
                                            <input type="text" placeholder="e.g., Family Welcome Dinner" {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                {/* Mandatory / Optional as radio pills */}
                                <form.Field name="mandatory">
                                    {(field) => (
                                        <fieldset>
                                            <legend className={labelClass}>Activity Type *</legend>
                                            <div className="flex flex-wrap gap-3">
                                                {(['mandatory', 'optional'] as const).map((option) => {
                                                    const checked = field.state.value === option
                                                    return (
                                                        <label key={option}
                                                               className={`flex cursor-pointer items-center gap-2 px-5 py-2 rounded-full border-2 text-sm font-bold capitalize transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#FF5903] has-[:focus-visible]:ring-offset-1 ${checked ? 'border-[#FF5903] bg-[#FF5903] text-[#031136]' : 'border-[#031136] bg-white text-[#031136] hover:bg-[#031136]/5'}`}>
                                                            <input
                                                                type="radio"
                                                                name={field.name}
                                                                value={option}
                                                                checked={checked}
                                                                onBlur={field.handleBlur}
                                                                onChange={() => field.handleChange(option)}
                                                                className="sr-only"
                                                            />
                                                            {/* the little radio dot from the mockup */}
                                                            <span aria-hidden="true"
                                                                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${checked ? 'border-white bg-white' : 'border-[#031136]/50'}`}>
                                                                {checked && <span className="h-2 w-2 rounded-full bg-[#434A90]"/>}
                                                            </span>
                                                            {option}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                            <FieldError field={field}/>
                                        </fieldset>
                                    )}
                                </form.Field>

                                {/* Date + Start + End boxes, saved as startDatetime and endDatetime */}
                                <form.Field name="startDatetime">
                                    {(startField) => (
                                        <form.Field name="endDatetime">
                                            {(endField) => {
                                                const update = (changes: Partial<When>) => {
                                                    const next = {...when, ...changes}
                                                    setWhen(next)
                                                    startField.handleChange(next.date && next.start ? `${next.date}T${next.start}` : '')
                                                    endField.handleChange(next.date && next.end ? `${next.date}T${next.end}` : '')
                                                }
                                                // the box mix-up first (it's the one to fix first), then the schema's own checks
                                                const error = whenProblem(when) ?? fieldError(startField) ?? fieldError(endField)
                                                return (
                                                    <div>
                                                        <div className="grid gap-3 sm:grid-cols-3">
                                                            <div>
                                                                <label htmlFor="activity-date" className={labelClass}>Date</label>
                                                                <input id="activity-date" type="date" min={tripStart} max={tripEnd}
                                                                       value={when.date}
                                                                       onBlur={startField.handleBlur}
                                                                       onChange={(event) => update({date: event.target.value})}
                                                                       className={boxClass(Boolean(error))}/>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="activity-start" className={labelClass}>Start</label>
                                                                <input id="activity-start" type="time"
                                                                       value={when.start}
                                                                       onBlur={startField.handleBlur}
                                                                       onChange={(event) => update({start: event.target.value})}
                                                                       className={boxClass(Boolean(error))}/>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="activity-end" className={labelClass}>End <span className="font-normal text-gray-500">(optional)</span></label>
                                                                <input id="activity-end" type="time"
                                                                       value={when.end}
                                                                       onBlur={endField.handleBlur}
                                                                       onChange={(event) => update({end: event.target.value})}
                                                                       className={boxClass(Boolean(error))}/>
                                                            </div>
                                                        </div>
                                                        {error
                                                            ? <p id="when-error" role="alert" className="mt-1 text-sm text-red-600">{error}</p>
                                                            : <p className="mt-1 text-xs text-gray-500">Trip: {tripDates}. Leave End blank if there’s no set finish time.</p>}
                                                    </div>
                                                )
                                            }}
                                        </form.Field>
                                    )}
                                </form.Field>

                                <form.Field name="description">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Description (optional)</label>
                                            <textarea rows={2}
                                                      placeholder="What is this activity about?"
                                                      {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>
                            </section>

                            {/* ── location ── */}
                            <section className={cardClass}>
                                <h2 className={sectionTitleClass}>Location</h2>
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                    {/* the big lilac location badge from the mockup */}
                                    <span aria-hidden="true"
                                          className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#C9A3CB]">
                                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#031136"
                                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>
                                            <circle cx="12" cy="10" r="2.5"/>
                                        </svg>
                                    </span>

                                    <div className="flex-1 space-y-3">
                                        <form.Field name="location">
                                            {(field) => (
                                                <div>
                                                    <label htmlFor={field.name} className={labelClass}>Location Name</label>
                                                    {/* suggests places as the organizer types; picking one fills in the address below */}
                                                    <PlaceSearchInput {...inputProps(field)}
                                                                      value={field.state.value}
                                                                      onChange={(value) => field.handleChange(value)}
                                                                      onPick={pickPlace}
                                                                      near={searchNear}
                                                                      destination={trip.destination}
                                                                      placeholder="Start typing a place, e.g., La Choza"/>
                                                    <p className="mt-1 text-xs text-gray-500">Pick a suggestion to fill in the address, or type it yourself.</p>
                                                    <FieldError field={field}/>
                                                </div>
                                            )}
                                        </form.Field>

                                        {/* Street / City, State / ZIP boxes, saved together as the one address the map uses */}
                                        <form.Field name="address">
                                            {(field) => {
                                                const update = (changes: Partial<AddressParts>) => {
                                                    const next = {...addressParts, ...changes}
                                                    setAddressParts(next)
                                                    field.handleChange(joinAddress(next))
                                                    // a hand-edited address may not match the picked place: look it up again on save
                                                    form.setFieldValue('lat', '')
                                                    form.setFieldValue('lng', '')
                                                }
                                                const error = fieldError(field)
                                                return (
                                                    <>
                                                        <div>
                                                            <label htmlFor="address-street" className={labelClass}>Street Address</label>
                                                            <input id="address-street" type="text" autoComplete="address-line1"
                                                                   placeholder="123 Main Street"
                                                                   value={addressParts.street}
                                                                   onBlur={field.handleBlur}
                                                                   onChange={(event) => update({street: event.target.value})}
                                                                   className={boxClass(Boolean(error))}/>
                                                        </div>
                                                        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                                                            <div>
                                                                <label htmlFor="address-city" className={labelClass}>City, State</label>
                                                                <input id="address-city" type="text"
                                                                       placeholder="Albuquerque, NM"
                                                                       value={addressParts.cityState}
                                                                       onBlur={field.handleBlur}
                                                                       onChange={(event) => update({cityState: event.target.value})}
                                                                       className={boxClass(Boolean(error))}/>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="address-zip" className={labelClass}>ZIP</label>
                                                                <input id="address-zip" type="text" inputMode="numeric" autoComplete="postal-code"
                                                                       placeholder="87101"
                                                                       value={addressParts.zip}
                                                                       onBlur={field.handleBlur}
                                                                       onChange={(event) => update({zip: event.target.value})}
                                                                       className={boxClass(Boolean(error))}/>
                                                            </div>
                                                        </div>
                                                        {error
                                                            ? <p className="text-sm text-red-600">{error}</p>
                                                            : <p className="text-xs text-gray-500">Add the address to show a map on the activity page.</p>}
                                                    </>
                                                )
                                            }}
                                        </form.Field>
                                    </div>
                                </div>
                            </section>

                            {/* ── cost & logistics ── */}
                            <section className={cardClass}>
                                <h2 className={sectionTitleClass}>Cost &amp; logistics</h2>

                                <form.Field name="cost">
                                    {(field) => (
                                        <div className="sm:max-w-[14rem]">
                                            <label htmlFor={field.name} className={labelClass}>Cost Per Person</label>
                                            <input type="number" min="0" step="0.01" placeholder="35.00" {...inputProps(field)}/>
                                            <p className="mt-1 text-xs text-gray-500">Leave blank if it’s free.</p>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="notes">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Event Notes / What to Bring</label>
                                            <textarea rows={2}
                                                      placeholder="Casual attire. Parking is available near the entrance."
                                                      {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>
                            </section>

                            {/* ── buttons ── */}
                            <StatusMessage actionData={fetcher.data}/>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                                <Link to={`/trip-itinerary/${trip.id}`}
                                      className={`${pillClass} bg-white text-[#031136] hover:bg-[#031136]/5`}>
                                    Cancel
                                </Link>

                                <form.Subscribe selector={(state) => state.canSubmit}>
                                    {(canSubmit) => (
                                        <button
                                            type="submit"
                                            disabled={!canSubmit || isSaving}
                                            className={`${pillClass} bg-[#FF5903] text-[#031136] hover:bg-[#FF5903]/90 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isSaving ? 'Saving…' : submitLabel}
                                        </button>
                                    )}
                                </form.Subscribe>
                            </div>
                        </form>

                        {footer}
                    </div>

                    {/* ── side panel: the trip, a live preview of the itinerary card, and who can see it ── */}
                    <aside className="space-y-4 lg:sticky lg:top-6">
                        <div className="rounded-3xl bg-[#FF6B6C] px-5 py-4 text-[#031136]">
                            <p className="text-xs font-bold uppercase tracking-wider">Trip</p>
                            <p className="mt-1 font-display text-2xl font-bold leading-tight">{trip.title}</p>
                            <p className="mt-2 text-sm">{tripDates} | {trip.destination}</p>
                            <p className="mt-1 text-sm font-bold">Your role: Organizer</p>
                        </div>

                        <div className="rounded-3xl border-2 border-[#031136] bg-white p-4">
                            <h2 className="font-display text-xl font-semibold text-[#031136]">Itinerary preview</h2>
                            <form.Subscribe selector={(state) => state.values}>
                                {(values) => (
                                    <div className="mt-3 rounded-xl border-l-4 border-[#FF5903] bg-[#FBF3FA] px-3 py-2 text-[#031136]">
                                        <p className="text-xs text-[#434A90]">{describeWhen(when)}</p>
                                        <p className="font-bold">{values.name || 'Activity name'}</p>
                                        <p className="text-xs">
                                            {values.mandatory === 'mandatory' ? 'Required' : 'Optional'}
                                            {values.location && ` | ${values.location}`}
                                        </p>
                                        <p className="mt-1 text-xs">
                                            {values.cost && Number(values.cost) > 0 ? `$${Number(values.cost).toFixed(2)} per person` : 'Free'} | RSVP open
                                        </p>
                                    </div>
                                )}
                            </form.Subscribe>
                        </div>

                        <p className="rounded-2xl bg-[#C9A3CB] px-5 py-3 text-xs text-[#031136]">
                            All accepted travelers can view this activity. Only organizers can edit it.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
}
