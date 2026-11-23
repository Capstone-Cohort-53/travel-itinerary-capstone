import {type ReactNode, useState} from "react";
import {Form, Link, useActionData, useNavigation} from "react-router";
import {formOptions, mergeForm, useForm, useSelector, useTransform} from "@tanstack/react-form-remix";
import {type NewTrip, NewTripSchema} from "~/utils/models/trip.model";
import {FieldError} from "~/components/FieldError";
import {StatusMessage} from "~/components/StatusMessage";
import type {handleTripForm} from "~/routes/create-trip/trip-form.server";

// The trip form shared by Create Trip and Edit Trip: the same fields, checks and look on both pages.
// This file runs in the browser; the action's half (handleTripForm) is in trip-form.server.ts.

const labelClass = "block text-sm font-bold text-[#031136] mb-2";
const inputClass = "w-full px-4 py-2.5 rounded-xl border-2 border-[#031136] bg-white text-sm text-[#031136] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5903] focus:ring-offset-1";

export const emptyTrip: NewTrip = {title: "", destination: "", startDate: "", endDate: "", description: ""};

//STEP 5: form options shared by the browser (useForm) and the server (createServerValidate)
export const tripFormOpts = formOptions({
    defaultValues: emptyTrip,
    validators: {onChange: NewTripSchema},
});

type TripFormPageProps = {
    heading: string;
    defaultValues: NewTrip;
    submitLabel: string;
    // where "← back" and Cancel go
    backTo: string;
    backLabel: string;
    // shown beside the form on wide screens, under it on phones
    aside?: ReactNode;
};

export function TripFormPage({heading, defaultValues, submitLabel, backTo, backLabel, aside}: TripFormPageProps) {
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
        <div className="bg-[#FBF3FA] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <Link to={backTo} className="text-sm font-bold text-[#434A90] hover:underline">← {backLabel}</Link>
                <h1 className="mt-2 mb-8 text-4xl sm:text-5xl font-extrabold tracking-tight break-words text-[#031136]">{heading}</h1>

                <div className={`grid gap-6 lg:items-start ${aside ? "lg:grid-cols-[1fr_16rem]" : ""}`}>
                <Form
                    method="post"
                    noValidate
                    className="bg-white rounded-3xl border-2 border-[#031136] p-6 sm:p-8 space-y-5"
                    onChange={() => setEditedSince(actionData)}
                    onSubmit={(event) => {
                        form.handleSubmit();
                        if (!NewTripSchema.safeParse(form.state.values).success) {
                            event.preventDefault();
                        }
                    }}
                >
                    {serverErrors.map((error) => (
                        <p key={String(error)} role="alert" className="text-sm text-red-600">{String(error)}</p>
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

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                                    rows={4}
                                    className={inputClass}
                                    aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                    aria-describedby="description-error"
                                />
                                <p className="mt-1 text-xs text-gray-500">{field.state.value.length}/360 characters</p>
                                <FieldError id="description-error" meta={field.state.meta}/>
                            </div>
                        )}
                    </form.Field>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 sm:pt-4">
                        <Link
                            to={backTo}
                            className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] bg-white text-center text-[#031136] font-bold hover:bg-[#031136]/5 transition text-sm"
                        >
                            Cancel
                        </Link>
                        <form.Subscribe selector={(formState) => formState.canSubmit}>
                            {(canSubmit) => (
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isSaving}
                                    className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] bg-[#FF5903] text-[#031136] font-bold hover:bg-[#FF5903]/90 transition text-sm disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : submitLabel}
                                </button>
                            )}
                        </form.Subscribe>
                    </div>

                    <StatusMessage actionData={visibleResponse}/>
                </Form>

                {aside && <aside className="space-y-4">{aside}</aside>}
                </div>
            </div>
        </div>
    );
}
