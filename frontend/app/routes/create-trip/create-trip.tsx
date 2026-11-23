import {useState} from "react";
import {Form, Link, redirect, useActionData, useNavigation} from "react-router";
import {
    createServerValidate,
    formOptions,
    mergeForm,
    ServerValidateError,
    useForm,
    useSelector,
    useTransform,
} from "@tanstack/react-form-remix";
import type {Route} from "./+types/create-trip";
import {endSession, requireSignedInUser} from "~/utils/session.server";
import {type NewTrip, NewTripSchema, postTrip} from "~/utils/models/trip.model";
import {FieldError} from "~/components/FieldError";
import {StatusMessage} from "~/components/StatusMessage";

// Retro Sunset colors
const navy = "#031136";
const labelClass = "block text-sm font-bold text-[#031136] mb-2";
const inputClass = "w-full px-4 py-2.5 rounded-xl border-2 border-[#031136] bg-white text-sm text-[#031136] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5903] focus:ring-offset-1";

//STEP 4: the loader. Only signed-in users can create a trip
export async function loader({request}: Route.LoaderArgs) {
    await requireSignedInUser(request);
    return null;
}

//STEP 5: form options shared by the browser (useForm) and the server (createServerValidate)
const defaultValues: NewTrip = {title: "", destination: "", startDate: "", endDate: "", description: ""};
const formOpts = formOptions({
    defaultValues,
    validators: {onChange: NewTripSchema},
});

//STEP 6: the server-side validator, for when the form is posted without JavaScript
const serverValidate = createServerValidate({
    ...formOpts,
    onServerValidate: ({value}) => {
        const validationResult = NewTripSchema.safeParse(value);
        if (!validationResult.success) {
            return validationResult.error.issues.map((issue) => issue.message);
        }
    },
});

//STEP 7: the action. Check the user, validate, call the API
export async function action({request}: Route.ActionArgs) {
    // outside the try: its thrown redirect has to reach React Router
    const user = await requireSignedInUser(request);
    const formData = await request.formData();

    try {
        const validatedData = await serverValidate(formData);
        // the API requires an image and the form does not ask for one, so every trip gets the site's background photo
        const image = new URL("/bg_reduced.jpeg", request.url).href;
        const status = await postTrip(validatedData, user, image);

        //STEP 8: handle the answer
        if (status.status === 401 || status.status === 403) {
            return await endSession(request);
        }

        if (status.status === 200) {
            const trip = status.data as { id: string };
            return redirect(`/trip-itinerary/${trip.id}`);
        }

        return {success: false, status};
    } catch (error) {
        if (error instanceof ServerValidateError) {
            return error.formState;
        }
        throw error;
    }
}

export default function CreateTrip() {
    //STEP 9: create the form and merge in the action's result
    const actionData = useActionData<typeof action>();
    // the action returns one of two shapes: tell them apart by a key only one has
    const serverFormState = actionData && "errorMap" in actionData ? actionData : {};
    const response = actionData && "success" in actionData ? actionData : undefined;

    const form = useForm({
        ...formOpts,
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
                <Link to="/my-trips" className="text-sm font-bold text-[#434A90] hover:underline">← My Trips</Link>
                <h1 className="mt-2 mb-8 text-4xl sm:text-5xl font-extrabold tracking-tight text-[#031136]">Create a New Trip</h1>

                <div className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-start">
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
                        <button
                            type="button"
                            onClick={() => form.reset()}
                            className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] bg-white text-[#031136] font-bold hover:bg-[#031136]/5 transition text-sm"
                        >
                            Cancel
                        </button>
                        <form.Subscribe selector={(formState) => formState.canSubmit}>
                            {(canSubmit) => (
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isSaving}
                                    className="w-full sm:w-auto px-8 py-3 rounded-full border-2 border-[#031136] bg-[#FF5903] text-[#031136] font-bold hover:bg-[#FF5903]/90 transition text-sm disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save Trip"}
                                </button>
                            )}
                        </form.Subscribe>
                    </div>

                    <StatusMessage actionData={visibleResponse}/>
                </Form>

                <aside className="space-y-4">
                    <NextUpCard/>
                </aside>
                </div>
            </div>
        </div>
    );
}

/** The sunset card beside the form: what happens after the trip is saved. */
function NextUpCard() {
    return (
        <div className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-[#434A90]">
            {/* a half sun setting behind the horizon, with two coral bands across it */}
            <svg viewBox="0 0 256 130" className="block w-full bg-[#031136]" aria-hidden="true">
                <defs>
                    <clipPath id="sun">
                        <circle cx="128" cy="130" r="86"/>
                    </clipPath>
                </defs>
                <g clipPath="url(#sun)">
                    <rect x="0" y="0" width="256" height="130" fill="#FF5903"/>
                    <rect x="0" y="92" width="256" height="12" fill="#FF6B6C"/>
                    <rect x="0" y="108" width="256" height="4" fill={navy}/>
                    <rect x="0" y="112" width="256" height="10" fill="#FF6B6C"/>
                </g>
            </svg>
            <div className="px-5 py-5 text-white">
                <h2 className="text-xl font-extrabold">Next up</h2>
                <p className="mt-1 text-sm">After you save, add activities to each day and invite your travelers.</p>
            </div>
        </div>
    );
}
