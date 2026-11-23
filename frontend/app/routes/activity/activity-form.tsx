import type {ChangeEvent, ReactNode} from "react";
import {Link, useFetcher} from "react-router";
import {useForm, type AnyFieldApi} from "@tanstack/react-form";
import {ActivityFormSchema, type ActivityForm} from "~/utils/models/activity.model";
import type {Trip} from "~/utils/models/trip.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";

/**
 * The activity form the Add and Edit pages share. TanStack Form validates with
 * the Zod schema as the user types; on submit the values go to the page's own
 * action, which validates again and saves. The action redirects to the trip's
 * itinerary on success, or returns a message that shows above the buttons.
 */

export const emptyActivityValues: ActivityForm = {
    name: '', mandatory: 'mandatory', startDatetime: '', endDatetime: '',
    description: '', location: '', address: '', cost: '', notes: '',
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


// ── Retro Sunset styles, the same ones zoey's Create Trip page uses ──

const labelClass = "block text-sm font-bold text-[#031136] mb-2"
const inputClass = "w-full px-4 py-2.5 rounded-xl border-2 bg-white text-sm text-[#031136] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5903] focus:ring-offset-1"
const cardClass = "bg-white rounded-3xl border-2 border-[#031136] p-6 sm:p-8 space-y-5"
const sectionTitleClass = "text-xl font-extrabold text-[#434A90]"
const pillClass = "w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] font-bold text-sm text-center transition"

/** The four sunset stripes under the navbar and the panel headers. */
function SunsetStripes() {
    return (
        <div aria-hidden="true">
            <div className="h-1.5 bg-[#FF5903]"/>
            <div className="h-1.5 bg-[#FF6B6C]"/>
            <div className="h-1.5 bg-[#C9A3CB]"/>
        </div>
    )
}

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


type ActivityFormPageProps = {
    trip: Trip,
    /** what the form starts with: empty values for Add, the saved activity for Edit */
    defaultValues: ActivityForm,
    heading: string,
    intro: string,
    submitLabel: string,
    /** shown below the form, outside it: the Edit page's delete button */
    footer?: ReactNode,
}

export function ActivityFormPage({trip, defaultValues, heading, intro, submitLabel, footer}: ActivityFormPageProps) {
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

    const tripStart = toDateString(trip.startDate)
    const tripEnd = toDateString(trip.endDate)
    const tripDates = `${formatTripDate(trip.startDate)} – ${formatTripDate(trip.endDate)}`

    return (
        <div className="bg-[#FBF3FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* ── heading ── */}
                <Link to={`/trip-itinerary/${trip.id}`} className="text-sm font-bold text-[#434A90] hover:underline">
                    ← Back to itinerary
                </Link>
                <p className="mt-3 text-sm font-bold text-[#434A90]">{trip.title}</p>
                <h1 className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-[#031136]">{heading}</h1>
                <p className="mt-2 mb-8 text-[#031136]">{intro}</p>

                <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">

                    <div className="space-y-6">
                        <form
                            className="space-y-6"
                            noValidate
                            onSubmit={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                void form.handleSubmit()
                            }}
                        >

                            {/* ── the activity ── */}
                            <section className={cardClass}>
                                <h2 className={sectionTitleClass}>The activity</h2>

                                <form.Field name="name">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Activity name *</label>
                                            <input type="text" placeholder="e.g., Family Welcome Dinner" {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                {/* Mandatory / Optional as pill toggles, like the RSVP buttons */}
                                <form.Field name="mandatory">
                                    {(field) => (
                                        <fieldset>
                                            <legend className={labelClass}>Activity type *</legend>
                                            <div className="grid grid-cols-2 gap-3 sm:flex">
                                                {(['mandatory', 'optional'] as const).map((option) => {
                                                    const checked = field.state.value === option
                                                    return (
                                                        <label key={option}
                                                               className={`cursor-pointer px-6 py-2.5 rounded-full border-2 border-[#031136] text-sm font-bold text-center capitalize transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#FF5903] has-[:focus-visible]:ring-offset-1 ${checked ? 'bg-[#FF5903] text-[#031136]' : 'bg-white text-[#031136] hover:bg-[#031136]/5'}`}>
                                                            <input
                                                                type="radio"
                                                                name={field.name}
                                                                value={option}
                                                                checked={checked}
                                                                onBlur={field.handleBlur}
                                                                onChange={() => field.handleChange(option)}
                                                                className="sr-only"
                                                            />
                                                            {option}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                            <FieldError field={field}/>
                                        </fieldset>
                                    )}
                                </form.Field>

                                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                                    <form.Field name="startDatetime">
                                        {(field) => (
                                            <div>
                                                <label htmlFor={field.name} className={labelClass}>Starts</label>
                                                <input type="datetime-local" min={`${tripStart}T00:00`} max={`${tripEnd}T23:59`} {...inputProps(field)}/>
                                                <FieldError field={field}/>
                                            </div>
                                        )}
                                    </form.Field>

                                    <form.Field name="endDatetime">
                                        {(field) => (
                                            <div>
                                                <label htmlFor={field.name} className={labelClass}>Ends</label>
                                                <input type="datetime-local" min={`${tripStart}T00:00`} max={`${tripEnd}T23:59`} {...inputProps(field)}/>
                                                <FieldError field={field}/>
                                            </div>
                                        )}
                                    </form.Field>
                                </div>
                                <p className="-mt-2 text-xs text-gray-500">Trip: {tripDates}. Leave the times blank if they aren’t set yet.</p>

                                <form.Field name="description">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Description</label>
                                            <textarea rows={4}
                                                      placeholder="What is this activity about?"
                                                      {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>
                            </section>

                            {/* ── location ── */}
                            <section className={cardClass}>
                                <div className="flex items-center gap-4">
                                    {/* the lilac location badge from the activity designs */}
                                    <span aria-hidden="true"
                                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#C9A3CB]">
                                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#031136"
                                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>
                                            <circle cx="12" cy="10" r="2.5"/>
                                        </svg>
                                    </span>
                                    <h2 className={sectionTitleClass}>Location</h2>
                                </div>

                                <form.Field name="location">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Location name</label>
                                            <input type="text" placeholder="e.g., Family Dinner Restaurant" {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="address">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Address</label>
                                            <textarea rows={2}
                                                      placeholder="123 Main Street, Albuquerque, NM 87101"
                                                      autoComplete="street-address"
                                                      {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>
                            </section>

                            {/* ── cost & notes ── */}
                            <section className={cardClass}>
                                <h2 className={sectionTitleClass}>Cost &amp; notes</h2>

                                <form.Field name="cost">
                                    {(field) => (
                                        <div className="sm:max-w-xs">
                                            <label htmlFor={field.name} className={labelClass}>Cost per person</label>
                                            <input type="number" min="0" step="0.01" placeholder="35.00" {...inputProps(field)}/>
                                            <p className="mt-1 text-xs text-gray-500">Leave blank if it’s free.</p>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="notes">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>Notes</label>
                                            <textarea rows={3}
                                                      placeholder="What to bring, parking, dress code, who pays…"
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

                    {/* ── side panel: the trip at a glance, styled like the Attendance panel ── */}
                    <aside className="space-y-4 lg:sticky lg:top-6">
                        <div className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-white">
                            <div className="bg-[#031136] px-5 pt-4 pb-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-[#C9A3CB]">Your trip</p>
                                <p className="text-xl font-extrabold text-white">{trip.title}</p>
                            </div>
                            <SunsetStripes/>
                            <dl className="space-y-3 px-5 py-4 text-sm text-[#031136]">
                                <div>
                                    <dt className="text-xs font-bold uppercase tracking-wider text-[#434A90]">Destination</dt>
                                    <dd className="font-bold">{trip.destination}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold uppercase tracking-wider text-[#434A90]">Dates</dt>
                                    <dd className="font-bold">{tripDates}</dd>
                                </div>
                            </dl>
                        </div>
                        <p className="rounded-2xl bg-[#C9A3CB] px-5 py-4 text-xs text-[#031136]">
                            Tip: mandatory activities show as <strong>Required</strong> on the itinerary, so travelers
                            know not to miss them.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
}
