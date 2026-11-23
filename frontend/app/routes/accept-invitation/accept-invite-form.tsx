import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {AcceptInviteFormSchema} from "~/utils/models/member.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";
import {WaxSealButton, eyebrow, input, label} from "~/components/royal";

type AcceptInviteFormValues = { going: 'yes' | 'no' | 'maybe', adults: string, children: string }

// number inputs hold strings; the schema's z.coerce turns them into numbers
const defaultValues: AcceptInviteFormValues = {going: 'yes', adults: '1', children: '0'}

const goingOptions = [
    {value: 'yes', label: 'Yes'},
    {value: 'maybe', label: 'Maybe'},
    {value: 'no', label: 'No'},
] as const

// each answer is a pill (44px tall); the chosen one turns lilac
const radioPill = 'flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-bold text-navy transition hover:bg-navy/5 has-[:checked]:bg-lilac has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold has-[:focus-visible]:ring-offset-2'
const fieldError = 'mt-1 text-sm font-medium text-royal-red'

type AcceptInviteFormProps = { tripTitle: string, signedInName: string }

/**
 * The RSVP for an invitation. TanStack Form validates with the Zod schema as
 * the user types; on submit the values go to this route's action, which
 * validates again and posts to the API. On success the action redirects to
 * the trip's itinerary, so only failures are shown here.
 */
export function AcceptInviteForm(props: AcceptInviteFormProps) {
    const {tripTitle, signedInName} = props
    const fetcher = useFetcher<FormActionResponse>()
    const isSending = fetcher.state !== 'idle'

    const form = useForm({
        defaultValues,
        validators: {onChange: AcceptInviteFormSchema, onSubmit: AcceptInviteFormSchema},
        onSubmit: async ({value}) => {
            await fetcher.submit(value, {method: 'post'})
        },
    })

    return (
        // sits right on the parchment, centered under the summons, like the design
        <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void form.handleSubmit()
            }}
        >
            <div className="text-center">
                <p className={`${eyebrow} break-words`}>RSVP for {tripTitle}</p>
                <h2 className="mt-2 font-display text-2xl font-bold italic text-navy sm:text-[26px]">Will you attend, Your Majesty?</h2>
                <p className="mt-1 break-words text-sm text-bay">Signed in as {signedInName}</p>
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

            {/* the gold wax seal is the page's one big action */}
            <form.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                    <div className="mt-2 flex justify-center">
                        <WaxSealButton type="submit" disabled={!canSubmit || isSending}
                                       aria-label={isSending ? 'Sending RSVP' : 'Send RSVP'}>
                            {isSending ? <>Sending…</> : <>Send<br/>my<br/>RSVP</>}
                        </WaxSealButton>
                    </div>
                )}
            </form.Subscribe>

            <p className="text-center font-display text-[15px] italic text-bay">
                After you RSVP, you'll be taken to the trip to view the itinerary and attendance.
            </p>

            <StatusMessage actionData={fetcher.data}/>
        </form>
    )
}
