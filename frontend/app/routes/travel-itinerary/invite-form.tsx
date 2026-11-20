import {useEffect} from "react";
import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {Button, HelperText, Label, TextInput} from "flowbite-react";
import {TripInviteFormSchema, type TripInviteForm} from "~/utils/models/trip-invite.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";

const defaultValues: TripInviteForm = {name: '', email: '', cellNumber: '', expiresAt: ''}

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
        // indigo card with a navy border (replaces the Flowbite Card); overflow-hidden clips the stripes to the rounded corners
        <div className="overflow-hidden rounded-2xl border border-[#0B1533] bg-[#3A4187]">
            {/* decorative stripes along the top, as in the mockup */}
            <div aria-hidden="true">
                <div className="h-1.5 bg-[#FF5A1F]"/>
                <div className="h-1.5 bg-[#FF8A85]"/>
                <div className="h-1.5 bg-[#FFB3A7]"/>
                <div className="h-1.5 bg-[#C19AC5]"/>
            </div>
            <form
                // full-width fields; a bit less padding on phones
                className="flex flex-col gap-4 p-4 sm:p-6"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >
                {/* white title on the indigo card */}
                <h5 className="text-xl sm:text-2xl font-bold tracking-wider text-white">Invite a Traveler</h5>

                {/* labels are white and errors light red (text-red-200) so both are readable on indigo */}
                <form.Field name="name">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block font-bold text-white">Name</Label>
                                <TextInput id={field.name} name={field.name} type="text" placeholder="First Last" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} className="mt-1 text-sm text-red-200">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Field name="email">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block font-bold text-white">Email</Label>
                                <TextInput id={field.name} name={field.name} type="email" placeholder="name@example.com" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} className="mt-1 text-sm text-red-200">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Field name="cellNumber">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block font-bold text-white">Cell Number</Label>
                                <TextInput id={field.name} name={field.name} type="tel" placeholder="555-123-4567" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} className="mt-1 text-sm text-red-200">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Field name="expiresAt">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block font-bold text-white">Invite Expires (optional)</Label>
                                <TextInput id={field.name} name={field.name} type="date" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} className="mt-1 text-sm text-red-200">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                {/* orange pill button with navy text: full width on phones, normal width on tablet and up */}
                <form.Subscribe selector={(state) => state.canSubmit}>
                    {(canSubmit) => (
                        <Button className="w-full sm:w-auto rounded-full border border-[#0B1533] bg-[#FFA06B] font-bold text-[#0B1533] hover:bg-[#FF8A55] focus:ring-[#FFB3A7]" type="submit" disabled={!canSubmit || isSending}>
                            {isSending ? 'Sending…' : 'Send Invitation'}
                        </Button>
                    )}
                </form.Subscribe>

                <StatusMessage actionData={fetcher.data}/>
            </form>
        </div>
    )
}
