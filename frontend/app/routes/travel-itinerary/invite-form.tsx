import {useEffect} from "react";
import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {TripInviteFormSchema, type TripInviteForm} from "~/utils/models/trip-invite.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";
import {Crown} from "~/components/royal";

const defaultValues: TripInviteForm = {name: '', email: '', cellNumber: '', expiresAt: ''}

// the design's "Summon thy girls" panel: navy, with lilac labels and white fields
const labelOnNavy = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-lilac'
const inputOnNavy = 'block w-full min-w-0 rounded-xl border-[1.5px] bg-white px-3.5 py-2.5 text-base text-navy placeholder:text-[#6b6f8f] focus:outline-none focus:ring-2 focus:ring-gold'
// errors on navy: watermelon pink reads well on the dark panel
const errorOnNavy = 'mt-1 text-sm font-medium text-pink'
// the team's peach send button (kept on Travelers & Invites), same shape as goldButton
const peachButton = 'inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-peach px-7 text-[13px] font-bold uppercase tracking-[0.14em] text-navy shadow-[0_4px_0_#d9784a] transition hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_#d9784a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'

/**
 * Invites one traveler to the trip. TanStack Form validates with the Zod
 * schema as the user types; on submit the values go to this route's action,
 * which validates again and posts to the API. The loader then reloads, so the
 * new invite appears in the table as "pending".
 */
export function InviteForm() {
    const fetcher = useFetcher<FormActionResponse>()
    const isSending = fetcher.state !== 'idle'

    const form = useForm({
        defaultValues,
        validators: {onChange: TripInviteFormSchema, onSubmit: TripInviteFormSchema},
        onSubmit: async ({value}) => {
            await fetcher.submit(value, {method: 'post'})
        },
    })

    // clear the form once the invite has been sent
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.success) {
            form.reset()
        }
    }, [fetcher.state, fetcher.data, form])

    return (
        <>
        {/* navy panel with a thin lilac inner frame, as in the design */}
        <div className="rounded-[20px] bg-navy p-1.5 text-white">
            <form
                className="flex flex-col gap-4 rounded-2xl border border-lilac p-5 sm:p-6"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >
                <div className="flex items-center gap-3">
                    <Crown size={30} outline="#ffffff"/>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac">Invite a traveler</p>
                        <h2 className="font-display text-2xl font-bold italic text-white">Summon thy girls</h2>
                    </div>
                </div>

                {/* two columns on tablet and up, stacked on phones */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field name="name">
                        {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                            return (
                                <div>
                                    <label htmlFor={field.name} className={labelOnNavy}>Name</label>
                                    <input id={field.name} name={field.name} type="text" placeholder="First Last"
                                           className={`${inputOnNavy} ${error ? 'border-pink' : 'border-white'}`}
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                    {error && <p id={`${field.name}-error`} className={errorOnNavy}>{error}</p>}
                                </div>
                            )
                        }}
                    </form.Field>

                    <form.Field name="email">
                        {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                            return (
                                <div>
                                    <label htmlFor={field.name} className={labelOnNavy}>Email</label>
                                    <input id={field.name} name={field.name} type="email" placeholder="name@example.com"
                                           className={`${inputOnNavy} ${error ? 'border-pink' : 'border-white'}`}
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                    {error && <p id={`${field.name}-error`} className={errorOnNavy}>{error}</p>}
                                </div>
                            )
                        }}
                    </form.Field>

                    <form.Field name="cellNumber">
                        {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                            return (
                                <div>
                                    <label htmlFor={field.name} className={labelOnNavy}>Cell Number</label>
                                    <input id={field.name} name={field.name} type="tel" placeholder="555-123-4567"
                                           className={`${inputOnNavy} ${error ? 'border-pink' : 'border-white'}`}
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                    {error && <p id={`${field.name}-error`} className={errorOnNavy}>{error}</p>}
                                </div>
                            )
                        }}
                    </form.Field>

                    <form.Field name="expiresAt">
                        {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                            return (
                                <div>
                                    <label htmlFor={field.name} className={labelOnNavy}>Invite Expires (optional)</label>
                                    <input id={field.name} name={field.name} type="date"
                                           className={`${inputOnNavy} ${error ? 'border-pink' : 'border-white'}`}
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                    {error && <p id={`${field.name}-error`} className={errorOnNavy}>{error}</p>}
                                </div>
                            )
                        }}
                    </form.Field>
                </div>

                {/* peach pill: full width on phones, normal width on tablet and up */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <button className={peachButton} type="submit" disabled={!canSubmit || isSending}>
                                {isSending ? 'Sending…' : 'Send Royal Invitation'}
                            </button>
                        )}
                    </form.Subscribe>
                    <p className="text-sm text-[#e3e1f0]">Sent invitations appear as Pending.</p>
                </div>
            </form>
        </div>
        {/* the result shows just under the panel, on parchment, so its navy / royal red text stays readable */}
        <StatusMessage actionData={fetcher.data}/>
        </>
    )
}
