import {useFetcher} from "react-router";
import {useForm} from "@tanstack/react-form";
import {Button, HelperText, Label, Radio, TextInput} from "flowbite-react";
import {AcceptInviteFormSchema, type Member} from "~/utils/models/member.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";
import {StatusMessage} from "~/components/StatusMessage";

type AcceptInviteFormValues = { going: 'yes' | 'no' | 'maybe', adults: string, children: string }

// number inputs hold strings; the schema's z.coerce turns them into numbers

const goingOptions = [
    {value: 'yes', label: 'Yes'},
    {value: 'maybe', label: 'Maybe'},
    {value: 'no', label: 'No'},
] as const

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
        // indigo card with a navy border and stripes, same as the Invite a Traveler and accept-invitation forms
        // (replaces the gray Flowbite Card); full width of the page column, mb-6 spaces it from the stat cards
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#0B1533] bg-[#3A4187]">
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
                <h5 className="text-xl sm:text-2xl font-bold tracking-wider text-white">Change my RSVP</h5>

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

                {/* adults and children side by side on tablet and up, stacked on phones */}
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>

                <form.Subscribe selector={(state) => state.canSubmit}>
                    {(canSubmit) => (
                        // orange pill button with navy text: full width on phones, normal width on tablet and up
                        <Button className="w-full sm:w-auto sm:self-start rounded-full border border-[#0B1533] bg-[#FFA06B] font-bold text-[#0B1533] hover:bg-[#FF8A55] focus:ring-[#FFB3A7]" type="submit" disabled={!canSubmit || isSending}>
                            {isSending ? 'Updating…' : 'Update RSVP'}
                        </Button>
                    )}
                </form.Subscribe>

                {/* light lavender helper text on indigo; this form stays on the page, so no "taken to the trip" */}
                <p className="text-[#F7EEF6]">
                    Your changes update the attendance counts below.
                </p>

                <StatusMessage actionData={fetcher.data}/>
            </form>
        </div>
    )
}
