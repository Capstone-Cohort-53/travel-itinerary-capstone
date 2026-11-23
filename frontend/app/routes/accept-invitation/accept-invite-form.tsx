import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {Button, HelperText, Label, Radio, TextInput} from "flowbite-react";
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
        // indigo card with a navy border, same as the travel itinerary invite form (replaces the Flowbite Card);
        // overflow-hidden clips the stripes to the rounded corners
        <div className="overflow-hidden rounded-2xl border border-[#0B1533] bg-[#3A4187]">
            {/* decorative stripes along the top, matching the invite form */}
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
                {/* white title, light lavender "signed in" line: readable on indigo */}
                <h5 className="break-words text-xl sm:text-2xl font-bold tracking-wider text-white">RSVP for {tripTitle}</h5>
                <p className="break-words text-[#F7EEF6]">Signed in as {signedInName}</p>

                <form.Field name="going">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <fieldset aria-describedby={error ? `${field.name}-error` : undefined}>
                                {/* white legend; radios wrap onto a second line on very narrow phones */}
                                <legend className="mb-2 text-sm font-bold text-white">Are you going?</legend>
                                <div className="flex flex-wrap gap-4 sm:gap-6">
                                    {goingOptions.map((option) => (
                                        <div key={option.value} className="flex items-center gap-2">
                                            <Radio id={`going-${option.value}`} name={field.name} value={option.value}
                                                   checked={field.state.value === option.value}
                                                   onBlur={field.handleBlur}
                                                   onChange={() => field.handleChange(option.value)}/>
                                            <Label htmlFor={`going-${option.value}`} className="text-white">{option.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                {error && <HelperText id={`${field.name}-error`} className="mt-1 text-sm text-red-200">{error}</HelperText>}
                            </fieldset>
                        )
                    }}
                </form.Field>

                {/* labels are white and errors light red (text-red-200) so both are readable on indigo */}
                <form.Field name="adults">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block font-bold text-white">Number of Adults (including you)</Label>
                                <TextInput id={field.name} name={field.name} type="number" min={1} max={100} shadow
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

                <form.Field name="children">
                    {(field) => {
                        const error = field.state.meta.isTouched ? field.state.meta.errors[0]?.message : undefined
                        return (
                            <div>
                                <Label htmlFor={field.name} className="mb-2 block font-bold text-white">Number of Children</Label>
                                <TextInput id={field.name} name={field.name} type="number" min={0} max={10} shadow
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

                <form.Subscribe selector={(state) => state.canSubmit}>
                    {(canSubmit) => (
                        // orange pill button with navy text: full width on phones, normal width on tablet and up
                        <Button className="w-full sm:w-auto rounded-full border border-[#0B1533] bg-[#FFA06B] font-bold text-[#0B1533] hover:bg-[#FF8A55] focus:ring-[#FFB3A7]" type="submit" disabled={!canSubmit || isSending}>
                            {isSending ? 'Sending…' : 'Send RSVP'}
                        </Button>
                    )}
                </form.Subscribe>

                {/* light lavender helper text on indigo */}
                <p className="text-[#F7EEF6]">
                    After you RSVP, you'll be taken to the trip to view the itinerary and attendance.
                </p>

                <StatusMessage actionData={fetcher.data}/>
            </form>
        </div>
    )
}
