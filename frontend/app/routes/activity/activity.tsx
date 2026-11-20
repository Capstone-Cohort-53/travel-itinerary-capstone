import type {ChangeEvent} from "react";
import {Link, redirect, useFetcher} from "react-router";
import {useForm, type AnyFieldApi} from "@tanstack/react-form";
import type {Route} from "./+types/activity";
import {requireSignedInUser} from "~/utils/session.server";
import {getTripByTripId} from "~/utils/models/trip.model";
import {ActivityFormSchema, postActivity, toActivityRequest, type ActivityForm} from "~/utils/models/activity.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";

const defaultValues: ActivityForm = {
    name: '', mandatory: 'mandatory', activityDate: '', startTime: '', endTime: '',
    description: '', location: '', streetAddress: '', city: '', state: '', zip: '',
    cost: '', costNotes: '', notes: '',
}

/** A trip date as YYYY-MM-DD. Trip dates are stored as UTC midnight. */
function toDateString(date: Date): string {
    return date.toISOString().slice(0, 10)
}


/**
 * Only the trip's owner may add activities (the API enforces the same rule).
 * The trip is loaded so the header can show its title and the date picker can
 * be limited to the trip's dates.
 */
export async function loader({request, params}: Route.LoaderArgs) {
    const signedInUser = await requireSignedInUser(request)

    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        throw new Response(null, {status: 404, statusText: 'Trip not found.'})
    }
    if (trip.ownerId !== signedInUser.profile.id) {
        throw new Response(null, {status: 403, statusText: 'Only the trip owner can add activities.'})
    }

    return {trip}
}


export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse | Response> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    // never trust the browser: validate again with the same schema the form used
    const result = ActivityFormSchema.safeParse(formData)
    if (!result.success) {
        return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
    }

    // the activity has to fall within the trip
    const trip = await getTripByTripId(params.id, signedInUser)
    if (trip === null) {
        return {success: false, status: {status: 404, data: null, message: 'Trip not found.'}}
    }
    const {activityDate} = result.data
    if (activityDate < toDateString(trip.startDate) || activityDate > toDateString(trip.endDate)) {
        return {success: false, status: {status: 400, data: null, message: 'The activity date must be during the trip.'}}
    }

    const status = await postActivity(params.id, toActivityRequest(result.data), signedInUser)
    if (status.status !== 201) {
        return {success: false, status}
    }

    // back to the trip once the activity is saved
    return redirect(`/travel-itinerary/${params.id}`)
}


// ── field helpers: every input shows its first error once it has been touched ──

const inputClass = "w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
const labelClass = "block text-sm font-medium text-[#031136] mb-2"

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
        className: `${inputClass} ${error ? 'border-red-500' : 'border-gray-300'}`,
    }
}

function FieldError({field}: {field: AnyFieldApi}) {
    const error = fieldError(field)
    return error ? <p id={`${field.name}-error`} className="mt-1 text-sm text-red-600">{error}</p> : null
}


export default function Activity({loaderData, params}: Route.ComponentProps) {
    const {trip} = loaderData
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

    return (
        <main className="w-full px-4 py-8 bg-gray-50 min-h-screen">

            {/* ======================================
                PAGE HEADING
            ====================================== */}

            <header className="mb-8">

                <h1 className="text-3xl font-bold text-[#031136]">
                    Add Activity
                </h1>

                <h2 className="text-lg font-semibold text-[#434A90] mt-2">
                    {trip.title}
                </h2>

                <p className="text-sm text-gray-600 mt-2">
                    Add an event to your shared trip itinerary.
                </p>

                {/* Orange accent line */}
                <div className="w-16 h-1 bg-[#FF5903] mt-4 rounded-full"></div>

            </header>

            {/* ======================================
                ACTIVITY FORM
            ====================================== */}

            <form
                className="max-w-4xl space-y-8"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >

                {/* ==============================
                    BASIC ACTIVITY INFORMATION
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Basic Activity Information
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    {/* Activity Name */}
                    <form.Field name="name">
                        {(field) => (
                            <div className="mb-5">
                                <label htmlFor={field.name} className={labelClass}>Activity Name *</label>
                                <input type="text" placeholder="Family Welcome Dinner" {...inputProps(field)}/>
                                <FieldError field={field}/>
                            </div>
                        )}
                    </form.Field>

                    {/* Activity Type */}
                    <form.Field name="mandatory">
                        {(field) => (
                            <fieldset className="mb-5">

                                <legend className="block text-sm font-medium text-[#031136] mb-3">
                                    Activity Type *
                                </legend>

                                <div className="flex flex-wrap gap-6">
                                    {(['mandatory', 'optional'] as const).map((option) => (
                                        <label key={option} className="flex items-center gap-2 text-sm text-[#031136] capitalize">
                                            <input
                                                type="radio"
                                                name={field.name}
                                                value={option}
                                                checked={field.state.value === option}
                                                onBlur={field.handleBlur}
                                                onChange={() => field.handleChange(option)}
                                                className="accent-[#434A90]"
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>

                                <FieldError field={field}/>
                            </fieldset>
                        )}
                    </form.Field>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

                        <form.Field name="activityDate">
                            {(field) => (
                                <div>
                                    <label htmlFor={field.name} className={labelClass}>Activity Date *</label>
                                    <input type="date" min={tripStart} max={tripEnd} {...inputProps(field)}/>
                                    <FieldError field={field}/>
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="startTime">
                            {(field) => (
                                <div>
                                    <label htmlFor={field.name} className={labelClass}>Start Time *</label>
                                    <input type="time" {...inputProps(field)}/>
                                    <FieldError field={field}/>
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="endTime">
                            {(field) => (
                                <div>
                                    <label htmlFor={field.name} className={labelClass}>End Time *</label>
                                    <input type="time" {...inputProps(field)}/>
                                    <FieldError field={field}/>
                                </div>
                            )}
                        </form.Field>

                    </div>

                    {/* Description */}
                    <form.Field name="description">
                        {(field) => (
                            <div>
                                <label htmlFor={field.name} className={labelClass}>Description (optional)</label>
                                <textarea rows={4}
                                          placeholder="Join the family for our welcome dinner to kick off the reunion weekend."
                                          {...inputProps(field)}/>
                                <FieldError field={field}/>
                            </div>
                        )}
                    </form.Field>

                </section>

                {/* ==============================
                    LOCATION
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Location
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Map Placeholder */}
                        <div className="md:col-span-1">

                            <div className="h-40 md:h-full min-h-40 bg-gray-100 border-2 border-dashed border-[#C7A2CB] rounded-lg flex flex-col items-center justify-center">

                                <span className="text-3xl mb-2">📍</span>

                                <p className="text-xs text-gray-500">
                                    Map Preview
                                </p>

                            </div>

                        </div>

                        {/* Location Form Fields */}
                        <div className="md:col-span-3 space-y-4">

                            <form.Field name="location">
                                {(field) => (
                                    <div>
                                        <label htmlFor={field.name} className={labelClass}>Location Name</label>
                                        <input type="text" placeholder="Family Dinner Restaurant" {...inputProps(field)}/>
                                        <FieldError field={field}/>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="streetAddress">
                                {(field) => (
                                    <div>
                                        <label htmlFor={field.name} className={labelClass}>Street Address</label>
                                        <input type="text" placeholder="123 Main Street" {...inputProps(field)}/>
                                        <FieldError field={field}/>
                                    </div>
                                )}
                            </form.Field>

                            {/* City, State, ZIP */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                <form.Field name="city">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>City</label>
                                            <input type="text" placeholder="Albuquerque" {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="state">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>State</label>
                                            <input type="text" placeholder="NM" {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                                <form.Field name="zip">
                                    {(field) => (
                                        <div>
                                            <label htmlFor={field.name} className={labelClass}>ZIP</label>
                                            <input type="text" inputMode="numeric" placeholder="87101" {...inputProps(field)}/>
                                            <FieldError field={field}/>
                                        </div>
                                    )}
                                </form.Field>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ==============================
                    COST AND LOGISTICS
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Cost and Logistics
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

                        <form.Field name="cost">
                            {(field) => (
                                <div>
                                    <label htmlFor={field.name} className={labelClass}>Estimated Cost Per Person</label>
                                    <input type="number" min="0" step="0.01" placeholder="35.00" {...inputProps(field)}/>
                                    <FieldError field={field}/>
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="costNotes">
                            {(field) => (
                                <div>
                                    <label htmlFor={field.name} className={labelClass}>Cost Notes</label>
                                    <input type="text" placeholder="Guests pay for their own meals." {...inputProps(field)}/>
                                    <FieldError field={field}/>
                                </div>
                            )}
                        </form.Field>

                    </div>

                    <form.Field name="notes">
                        {(field) => (
                            <div>
                                <label htmlFor={field.name} className={labelClass}>Event Notes / What to Bring</label>
                                <textarea rows={3}
                                          placeholder="Casual attire. Parking is available near the entrance."
                                          {...inputProps(field)}/>
                                <FieldError field={field}/>
                            </div>
                        )}
                    </form.Field>

                </section>

                {/* ==============================
                    FORM BUTTONS
                ============================== */}

                <StatusMessage actionData={fetcher.data}/>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pb-8">

                    {/* Cancel goes back to the trip */}
                    <Link
                        to={`/travel-itinerary/${params.id}`}
                        className="px-8 py-3 rounded-lg border-2 border-[#434A90] text-[#434A90] font-semibold text-center hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </Link>

                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <button
                                type="submit"
                                disabled={!canSubmit || isSaving}
                                className="px-8 py-3 rounded-lg bg-[#FF5903] text-white font-semibold hover:bg-[#031136] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving…' : 'Save Activity'}
                            </button>
                        )}
                    </form.Subscribe>

                </div>

            </form>

        </main>
    );
}
