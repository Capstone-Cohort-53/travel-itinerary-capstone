import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {AcceptInviteFormSchema, type Member} from "~/utils/models/member.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";
import {card, eyebrow, goldButton, input, label} from "~/components/royal";

type AcceptInviteFormValues = { going: 'yes' | 'no' | 'maybe', adults: string, children: string }

// number inputs hold strings; the schema's z.coerce turns them into numbers

const goingOptions = [
    {value: 'yes', label: 'Yes'},
    {value: 'maybe', label: 'Maybe'},
    {value: 'no', label: 'No'},
] as const

// each answer is a pill (44px tall); the chosen one turns lilac
const radioPill = 'flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-bold text-navy transition hover:bg-navy/5 has-[:checked]:bg-lilac has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2'
const fieldError = 'mt-1 text-sm font-medium text-royal-red'

type UpdateRsvpFormProps = { member: Member }

/**
 * The RSVP for an invitation. TanStack Form validates with the Zod schema as
 * the user types; on submit the values go to this route's action, which
 * validates again and lets a member change their RSVP. Submits to the travel-itinerary action, which sends a PUT to the API. So only failures are shown here.
 */
export function UpdateRsvpForm(props: UpdateRsvpFormProps) {
    const {member} = props
    const fetcher = useFetcher<FormActionResponse>()
    const isSending = fetcher.state !== 'idle'

    const defaultValues: AcceptInviteFormValues = {
        going: member.going,
        adults: String(member.adults),
        children: String(member.children)
    }

    const form = useForm({
        defaultValues,
        validators: {onChange: AcceptInviteFormSchema, onSubmit: AcceptInviteFormSchema},
        onSubmit: async ({value}) => {
            await fetcher.submit({...value, intent: 'update-rsvp', memberId: member.id}, {method: 'post'})
        },
    })

    return (
        // plain parchment card with a navy border, above the roster
        <div className={`${card} mb-6 sm:p-6`}>
            <form
                className="flex flex-col gap-4"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >
                <div>
                    <p className={eyebrow}>Change my RSVP</p>
                    <h2 className="mt-1 font-display text-2xl font-bold italic text-navy">Will you attend, Your Majesty?</h2>
                </div>

                <form.Field name="going">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <fieldset aria-describedby={error ? `${field.name}-error` : undefined}>
                                {/* pills wrap onto a second line on very narrow phones */}
                                <legend className={label}>Are you going?</legend>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {goingOptions.map((option) => (
                                        <label key={option.value} htmlFor={`going-${option.value}`} className={radioPill}>
                                            <input type="radio" id={`going-${option.value}`} name={field.name} value={option.value}
                                                   className="h-4 w-4 accent-navy"
                                                   checked={field.state.value === option.value}
                                                   onBlur={field.handleBlur}
                                                   onChange={() => field.handleChange(option.value)}/>
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                                {error && <p id={`${field.name}-error`} className={fieldError}>{error}</p>}
                            </fieldset>
                        )
                    }}
                </form.Field>

                {/* adults and children side by side on tablet and up, stacked on phones */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field name="adults">
                        {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                            return (
                                <div>
                                    <label htmlFor={field.name} className={label}>Number of Adults (including you)</label>
                                    <input id={field.name} name={field.name} type="number" min={1} max={100}
                                           className={`${input} ${error ? 'border-royal-red' : ''}`}
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                    {error && <p id={`${field.name}-error`} className={fieldError}>{error}</p>}
                                </div>
                            )
                        }}
                    </form.Field>

                    <form.Field name="children">
                        {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                            return (
                                <div>
                                    <label htmlFor={field.name} className={label}>Number of Children</label>
                                    <input id={field.name} name={field.name} type="number" min={0} max={10}
                                           className={`${input} ${error ? 'border-royal-red' : ''}`}
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                    {error && <p id={`${field.name}-error`} className={fieldError}>{error}</p>}
                                </div>
                            )
                        }}
                    </form.Field>
                </div>

                <form.Subscribe selector={(state) => state.canSubmit}>
                    {(canSubmit) => (
                        // gold pill: full width on phones, normal width on tablet and up
                        <button className={`${goldButton} w-full sm:w-auto sm:self-start`} type="submit" disabled={!canSubmit || isSending}>
                            {isSending ? 'Updating…' : 'Update RSVP'}
                        </button>
                    )}
                </form.Subscribe>

                {/* this form stays on the page, so no "taken to the trip" */}
                <p className="text-sm text-bay">
                    Your changes update the attendance counts.
                </p>

                <StatusMessage actionData={fetcher.data}/>
            </form>
        </div>
    )
}
