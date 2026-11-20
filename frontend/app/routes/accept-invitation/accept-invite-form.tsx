import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {Button, Card, HelperText, Label, Radio, TextInput} from "flowbite-react";
import {AcceptInviteFormSchema} from "~/utils/models/member.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";

type AcceptInviteFormValues = { going: 'yes' | 'no' | 'maybe', adults: string, children: string }

// number inputs hold strings; the schema's z.coerce turns them into numbers
const defaultValues: AcceptInviteFormValues = {going: 'yes', adults: '1', children: '0'}

const goingOptions = [
    {value: 'yes', label: 'Yes'},
    {value: 'maybe', label: 'Maybe'},
    {value: 'no', label: 'No'},
] as const

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
        <Card className="mt-8 mx-auto max-w-md hover:bg-[#FFF0F1]">
            <form
                className="flex max-w-md flex-col gap-4"
                noValidate
                onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                }}
            >
                <h5 className="text-2xl font-bold tracking-tight text-gray-500">RSVP for {tripTitle}</h5>
                <p className="font-normal text-gray-700">Signed in as {signedInName}</p>

                <form.Field name="going">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <fieldset aria-describedby={error ? `${field.name}-error` : undefined}>
                                <legend className="mb-2 text-sm font-medium text-gray-900">Are you going?</legend>
                                <div className="flex gap-6">
                                    {goingOptions.map((option) => (
                                        <div key={option.value} className="flex items-center gap-2">
                                            <Radio id={`going-${option.value}`} name={field.name} value={option.value}
                                                   checked={field.state.value === option.value}
                                                   onBlur={field.handleBlur}
                                                   onChange={() => field.handleChange(option.value)}/>
                                            <Label htmlFor={`going-${option.value}`}>{option.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                {error && <HelperText id={`${field.name}-error`} color="failure">{error}</HelperText>}
                            </fieldset>
                        )
                    }}
                </form.Field>

                <form.Field name="adults">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block">Number of Adults (including you)</Label>
                                <TextInput id={field.name} name={field.name} type="number" min={1} max={100} shadow
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

                <form.Field name="children">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block">Number of Children</Label>
                                <TextInput id={field.name} name={field.name} type="number" min={0} max={10} shadow
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
                            {isSending ? 'Sending…' : 'Send RSVP'}
                        </Button>
                    )}
                </form.Subscribe>

                <p className="font-normal text-gray-700">
                    After you RSVP, you'll be taken to the trip to view the itinerary and attendance.
                </p>

                <StatusMessage actionData={fetcher.data}/>
            </form>
        </Card>
    )
}
