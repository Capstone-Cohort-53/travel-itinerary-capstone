import {type ReactNode, useState} from "react";
import {Form, Link, useActionData, useNavigation} from "react-router";
import {formOptions, mergeForm, useForm, useSelector, useTransform} from "@tanstack/react-form-remix";
import {type NewTrip, NewTripSchema} from "~/utils/models/trip.model";
import {FieldError} from "~/components/FieldError";
import {StatusMessage} from "~/components/StatusMessage";
import type {handleTripForm} from "~/routes/create-trip/trip-form.server";
import {eyebrow, GemDivider, headline, input, label, Parchment, RoyalPage, WaxSealButton} from "~/components/royal";

// The trip form shared by Create Trip and Edit Trip: the same fields, checks and look on both pages.
// This file runs in the browser; the action's half (handleTripForm) is in trip-form.server.ts.

// TripsQueen form styles (components/royal.tsx): Blue Bay capitals for labels, navy-outlined white boxes with a gold focus ring.
// 16px text keeps phones from zooming in on focus.
const labelClass = label;
const inputClass = `${input} text-base`;

export const emptyTrip: NewTrip = {title: "", destination: "", startDate: "", endDate: "", description: ""};

//STEP 5: form options shared by the browser (useForm) and the server (createServerValidate)
export const tripFormOpts = formOptions({
    defaultValues: emptyTrip,
    validators: {onChange: NewTripSchema},
});

type TripFormPageProps = {
    // the small spaced-out capitals above the headline, e.g. "A new decree"
    eyebrowText: string;
    // the Playfair headline; wrap a word or two in <em className={emphasis}>
    heading: ReactNode;
    // one short line under the headline
    intro?: string;
    defaultValues: NewTrip;
    // the words inside the wax seal: keep them short, e.g. <>Seal it<br/>Save<br/>trip</>
    submitLabel: ReactNode;
    // where "← back" and Cancel go
    backTo: string;
    backLabel: string;
    // shown beside the form on wide screens, under it on phones
    aside?: ReactNode;
};

export function TripFormPage({eyebrowText, heading, intro, defaultValues, submitLabel, backTo, backLabel, aside}: TripFormPageProps) {
    //STEP 9: create the form and merge in the action's result
    const actionData = useActionData<typeof handleTripForm>();
    // the action returns one of two shapes: tell them apart by a key only one has
    const serverFormState = actionData && "errorMap" in actionData ? actionData : {};
    const response = actionData && "success" in actionData ? actionData : undefined;

    const form = useForm({
        ...tripFormOpts,
        defaultValues,
        transform: useTransform((baseForm) => mergeForm(baseForm, serverFormState), [actionData]),
    });

    const formErrors = useSelector(form.store, (formState) => formState.errors);
    const serverErrors = formErrors.flatMap((error) => (Array.isArray(error) ? error : []));

    const navigation = useNavigation();
    const isSaving = navigation.state !== "idle";

    //STEP 11: hide the last result once the user starts editing again
    const [editedSince, setEditedSince] = useState<typeof actionData>();
    const visibleResponse = editedSince === actionData ? undefined : response;

    return (
        <RoyalPage width={aside ? "max-w-5xl" : "max-w-3xl"}>
            <Parchment>
                <Link
                    to={backTo}
                    className="inline-flex min-h-11 items-center rounded-md text-sm font-bold text-bay hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                    ← {backLabel}
                </Link>

                {/* the decree's heading, centered like the design */}
                <header className="mt-2 flex flex-col items-center gap-3 text-center">
                    <p className={eyebrow}>{eyebrowText}</p>
                    <h1 className={`${headline} break-words text-4xl sm:text-5xl lg:text-[57px]`}>{heading}</h1>
                    {intro && <p className="max-w-xl text-base text-bay">{intro}</p>}
                </header>

                <div className="my-8">
                    <GemDivider color="pink"/>
                </div>

                <div className={`grid gap-8 lg:items-start ${aside ? "lg:grid-cols-[1fr_15rem]" : ""}`}>
                <Form
                    method="post"
                    noValidate
                    className="min-w-0 space-y-5"
                    onChange={() => setEditedSince(actionData)}
                    onSubmit={(event) => {
                        form.handleSubmit();
                        if (!NewTripSchema.safeParse(form.state.values).success) {
                            event.preventDefault();
                        }
                    }}
                >
                    {serverErrors.map((error) => (
                        <p key={String(error)} role="alert" className="text-sm font-medium text-royal-red">{String(error)}</p>
                    ))}

                    {/*STEP 10: one form.Field per input*/}
                    <form.Field name="title">
                        {(field) => (
                            <div>
                                <label htmlFor="title" className={labelClass}>Trip name</label>
                                <input
                                    type="text"
                                    id="title"
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    placeholder="e.g., Weekend in Santa Fe"
                                    className={inputClass}
                                    aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                    aria-describedby="title-error"
                                />
                                <FieldError id="title-error" meta={field.state.meta}/>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="destination">
                        {(field) => (
                            <div>
                                <label htmlFor="destination" className={labelClass}>Destination</label>
                                <input
                                    type="text"
                                    id="destination"
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    placeholder="City or place"
                                    className={inputClass}
                                    aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                    aria-describedby="destination-error"
                                />
                                <FieldError id="destination-error" meta={field.state.meta}/>
                            </div>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                        <form.Field name="startDate">
                            {(field) => (
                                <div>
                                    <label htmlFor="startDate" className={labelClass}>Start date</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                        className={inputClass}
                                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        aria-describedby="startDate-error"
                                    />
                                    <FieldError id="startDate-error" meta={field.state.meta}/>
                                </div>
                            )}
                        </form.Field>

                        <form.Field name="endDate">
                            {(field) => (
                                <div>
                                    <label htmlFor="endDate" className={labelClass}>End date</label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                        className={inputClass}
                                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                        aria-describedby="endDate-error"
                                    />
                                    <FieldError id="endDate-error" meta={field.state.meta}/>
                                </div>
                            )}
                        </form.Field>
                    </div>

                    <form.Field name="description">
                        {(field) => (
                            <div>
                                <label htmlFor="description" className={labelClass}>Description</label>
                                <textarea
                                    id="description"
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    placeholder="What is this trip about?"
                                    maxLength={360}
                                    rows={6}
                                    className={`${inputClass} leading-relaxed`}
                                    aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                    aria-describedby="description-error"
                                />
                                <p className="mt-1 text-xs text-bay">{field.state.value.length}/360 characters</p>
                                <FieldError id="description-error" meta={field.state.meta}/>
                            </div>
                        )}
                    </form.Field>

                    {/* an italic "cancel" link beside the gold wax seal that saves the trip */}
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-2 sm:justify-end sm:gap-8">
                        <Link
                            to={backTo}
                            className="inline-flex min-h-11 items-center rounded-md px-2 font-display text-lg italic text-navy underline decoration-[1.5px] underline-offset-4 hover:text-bay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        >
                            cancel
                        </Link>
                        <form.Subscribe selector={(formState) => formState.canSubmit}>
                            {(canSubmit) => (
                                <WaxSealButton
                                    type="submit"
                                    disabled={!canSubmit || isSaving}
                                >
                                    {isSaving ? <>Sealing…</> : submitLabel}
                                </WaxSealButton>
                            )}
                        </form.Subscribe>
                    </div>

                    <StatusMessage actionData={visibleResponse}/>
                </Form>

                {aside && <aside className="space-y-4">{aside}</aside>}
                </div>
            </Parchment>
        </RoyalPage>
    );
}
