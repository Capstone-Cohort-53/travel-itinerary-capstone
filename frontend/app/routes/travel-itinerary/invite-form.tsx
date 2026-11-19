import {useEffect} from "react";
import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {Button, Card, HelperText, Label, TextInput} from "flowbite-react";
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
        <Card className="hover:bg-[#FFF0F1]">
            <form
                className="flex max-w-md flex-col gap-4"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >
                <h5 className="leading-loose text-2xl font-bold tracking-wider text-gray-500">Invite a Traveler</h5>

                <form.Field name="name">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block">Name</Label>
                                <TextInput id={field.name} name={field.name} type="text" placeholder="First Last" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} color="failure">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Field name="email">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block">Email</Label>
                                <TextInput id={field.name} name={field.name} type="email" placeholder="name@example.com" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} color="failure">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Field name="cellNumber">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block">Cell Number</Label>
                                <TextInput id={field.name} name={field.name} type="tel" placeholder="555-123-4567" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} color="failure">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Field name="expiresAt">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block">Invite Expires (optional)</Label>
                                <TextInput id={field.name} name={field.name} type="date" shadow
                                           value={field.state.value}
                                           onBlur={field.handleBlur}
                                           onChange={(event) => field.handleChange(event.target.value)}
                                           color={error ? 'failure' : undefined}
                                           aria-invalid={error ? true : undefined}
                                           aria-describedby={error ? `${field.name}-error` : undefined}/>
                                {error && <HelperText id={`${field.name}-error`} color="failure">{error}</HelperText>}
                            </div>
                        )
                    }}
                </form.Field>

                <form.Subscribe selector={(state) => state.canSubmit}>
                    {(canSubmit) => (
                        <Button className="bg-[#FD6B6C] hover:bg-red-600" type="submit" disabled={!canSubmit || isSending}>
                            {isSending ? 'Sending…' : 'Send Invitation'}
                        </Button>
                    )}
                </form.Subscribe>

                <StatusMessage actionData={fetcher.data}/>
            </form>
        </Card>
    )
}
