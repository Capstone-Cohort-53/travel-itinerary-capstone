import {useState} from "react";
import {data, Form, useActionData, useNavigation} from "react-router";
import {
    createServerValidate,
    formOptions,
    mergeForm,
    ServerValidateError,
    useForm,
    useSelector,
    useTransform,
} from "@tanstack/react-form-remix";
import type {Route} from "./+types/profile";
import {commitSession, endSession, getSession, requireSignedInUser} from "~/utils/session.server";
import {type EditProfile, EditProfileSchema, getProfileMe, type Profile, putProfile} from "~/utils/models/profile.model";
import {FieldError} from "~/components/FieldError";
import {StatusMessage} from "~/components/StatusMessage";

//STEP 4: the loader. Signed-in users only, and it hands the form the current values
export async function loader({request}: Route.LoaderArgs) {
    const user = await requireSignedInUser(request);
    const {status, profile} = await getProfileMe(user);

    // the API no longer knows this user: its session ended before ours did
    if (status.status === 401 || status.status === 403) {
        throw await endSession(request);
    }

    // where the photo picker uploads to: the team's Cloudinary account. Both values are
    // public (an unsigned upload preset is made to be used from the browser), so they are
    // safe to keep in the code. Set them in the env to point at a different account
    const cloudinary = {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "pxffgvfq",
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "profile_photos",
    };

    // only the profile goes to the browser, never the token or the cookies
    return {profile, cloudinary, message: profile === null ? status.message : null};
}

type CloudinaryConfig = { cloudName: string; uploadPreset: string };

// Cloudinary's free plan takes images up to 10 MB
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Uploads a photo from the user's device straight to Cloudinary and returns its https link,
 * which is what the profile stores. Throws with a message the user can read.
 */
async function uploadPhoto(file: File, {cloudName, uploadPreset}: CloudinaryConfig): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {method: "POST", body});
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.secure_url !== "string") {
        throw new Error(result?.error?.message ?? "The photo could not be uploaded. Please try again.");
    }
    return result.secure_url;
}

//STEP 5: form options shared by the browser (useForm) and the server (createServerValidate)
const defaultValues: EditProfile = {name: "", cellNumber: "", image: ""};
const formOpts = formOptions({
    defaultValues,
    validators: {onChange: EditProfileSchema},
});

//STEP 6: the server-side validator, for when the form is posted without JavaScript
const serverValidate = createServerValidate({
    ...formOpts,
    onServerValidate: ({value}) => {
        const validationResult = EditProfileSchema.safeParse(value);
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
        const {status, profile, authorization} = await putProfile(validatedData, user);

        //STEP 8: handle the answer
        if (status.status === 401 || status.status === 403) {
            return await endSession(request);
        }

        if (status.status !== 200 || profile === null) {
            return {success: false, status};
        }

        // the API minted a new CSRF token with this update and the old one no
        // longer works, so store it, along with the updated profile
        const session = await getSession(user.cookie);
        session.set("profile", profile);
        if (authorization) {
            session.set("authorization", authorization);
        }

        return data(
            {success: true, status},
            {headers: {"Set-Cookie": await commitSession(session)}},
        );
    } catch (error) {
        if (error instanceof ServerValidateError) {
            return error.formState;
        }
        throw error;
    }
}

// same look as the create trip form's inputs
const inputClass = "w-full px-4 py-2.5 rounded-xl border-2 border-[#031136] bg-white text-sm text-[#031136] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5903] focus:ring-offset-1";
const labelClass = "mb-1 block text-sm font-bold text-[#031136]";

export default function ProfilePage(props: Route.ComponentProps) {
    const {profile, cloudinary, message} = props.loaderData;

    return (
        <main className="min-h-screen bg-[#FBF3FA] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                {profile === null
                    ? <p role="alert" className="rounded-2xl border-2 border-[#031136] bg-white p-5 text-red-700">
                        {message ?? "Could not load your profile."}
                    </p>
                    : <>
                        <ProfileHero profile={profile}/>
                        <ProfileDetails profile={profile}/>
                        <EditProfileForm profile={profile} cloudinary={cloudinary}/>
                    </>
                }
            </div>
        </main>
    );
}

// big white card: greeting and heading on the left, the profile photo on the right
function ProfileHero({profile}: { profile: Profile }) {
    const firstName = profile.name.split(" ")[0];
    return (
        <section className="grid items-center gap-8 rounded-3xl border-2 border-[#031136] bg-white p-6 sm:p-10 md:grid-cols-[1fr_auto]">
            <div>
                <p className="inline-block rounded-full bg-[#C9A3CB] px-3 py-1 text-xs font-bold text-[#031136]">
                    Welcome back, {firstName}!
                </p>
                <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-[#031136] sm:text-5xl">
                    Your travel <span className="text-[#FF5903]">profile</span>
                </h1>
                <p className="mt-3 max-w-md text-[#434A90]">
                    This is how your group sees you on every trip. Keep your name, number and photo up to date.
                </p>
                <a href="#edit-profile"
                   className="mt-6 inline-block rounded-full border-2 border-[#031136] bg-[#FF5903] px-5 py-2.5 text-sm font-bold text-[#031136] hover:bg-[#FF5903]/90">
                    Edit my profile
                </a>
            </div>

            {/* photo framed like the mockup's picture cards, with an offset shadow */}
            <img src={profile.image} alt={`${profile.name}'s profile photo`}
                 className="mx-auto h-40 w-40 rounded-2xl border-2 border-[#031136] bg-[#C9A3CB] object-cover shadow-[8px_8px_0_#FF6B6C] sm:h-48 sm:w-48"/>
        </section>
    );
}

// three cards with colored stripes on top, like the mockup's numbered step cards
function ProfileDetails({profile}: { profile: Profile }) {
    const details = [
        {label: "Email", value: profile.email, color: "text-[#FF5903]", stripes: ["bg-[#FF5903]", "bg-[#FF6B6C]"]},
        {label: "Cell number", value: profile.cellNumber ?? "No cell number yet", color: "text-[#FF6B6C]", stripes: ["bg-[#FF6B6C]", "bg-[#C9A3CB]"]},
        {label: "Member since", value: new Date(profile.createdAt).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}), color: "text-[#434A90]", stripes: ["bg-[#C9A3CB]", "bg-[#434A90]"]},
    ];

    return (
        <section className="grid gap-6 md:grid-cols-3">
            {details.map((detail) => (
                <article key={detail.label} className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-white">
                    <div aria-hidden="true">
                        <div className={`h-2 ${detail.stripes[0]}`}/>
                        <div className={`h-1.5 ${detail.stripes[1]}`}/>
                    </div>
                    <div className="p-5">
                        <h2 className={`text-sm font-bold uppercase tracking-wide ${detail.color}`}>{detail.label}</h2>
                        <p className="mt-1 break-words text-lg font-extrabold text-[#031136]">{detail.value}</p>
                    </div>
                </article>
            ))}
        </section>
    );
}

function EditProfileForm({profile, cloudinary}: { profile: Profile; cloudinary: CloudinaryConfig | null }) {
    //STEP 9: create the form, opened with the current values, and merge in the action's result
    const actionData = useActionData<typeof action>();
    // the action returns one of two shapes: tell them apart by a key only one has
    const serverFormState = actionData && "errorMap" in actionData ? actionData : {};
    const response = actionData && "success" in actionData ? actionData : undefined;

    const form = useForm({
        ...formOpts,
        defaultValues: {name: profile.name, cellNumber: profile.cellNumber ?? "", image: profile.image},
        transform: useTransform((baseForm) => mergeForm(baseForm, serverFormState), [actionData]),
    });

    const formErrors = useSelector(form.store, (formState) => formState.errors);
    const serverErrors = formErrors.flatMap((error) => (Array.isArray(error) ? error : []));

    const navigation = useNavigation();
    const isSaving = navigation.state !== "idle";

    //STEP 11: hide the last result once the user starts editing again
    const [editedSince, setEditedSince] = useState<typeof actionData>();
    const visibleResponse = editedSince === actionData ? undefined : response;

    // saving waits until a picked photo has finished uploading
    const [isUploading, setIsUploading] = useState(false);

    return (
        <section id="edit-profile" className="overflow-hidden rounded-3xl border-2 border-[#031136] bg-white">
            <div aria-hidden="true">
                <div className="h-2 bg-[#FF5903]"/>
                <div className="h-1.5 bg-[#FF6B6C]"/>
            </div>
            <div className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold text-[#031136]">Edit profile</h2>
            <p className="mt-1 text-sm text-[#434A90]">Changes show up for everyone on your trips.</p>

            <Form
                method="post"
                noValidate
                className="mt-6 flex max-w-md flex-col gap-4"
                onChange={() => setEditedSince(actionData)}
                onSubmit={(event) => {
                    form.handleSubmit();
                    if (!EditProfileSchema.safeParse(form.state.values).success) {
                        event.preventDefault();
                    }
                }}
            >
                {serverErrors.map((error) => (
                    <p key={String(error)} role="alert" className="text-sm text-red-600">{String(error)}</p>
                ))}

                {/*STEP 10: one form.Field per input*/}
                <form.Field name="name">
                    {(field) => (
                        <div>
                            <label htmlFor="name" className={labelClass}>Name</label>
                            <input
                                className={inputClass}
                                id="name"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                aria-describedby="name-error"
                            />
                            <FieldError id="name-error" meta={field.state.meta}/>
                        </div>
                    )}
                </form.Field>

                <form.Field name="cellNumber">
                    {(field) => (
                        <div>
                            <label htmlFor="cellNumber" className={labelClass}>Cell Number</label>
                            <input
                                className={inputClass}
                                id="cellNumber"
                                type="tel"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                aria-describedby="cellNumber-error"
                            />
                            <FieldError id="cellNumber-error" meta={field.state.meta}/>
                        </div>
                    )}
                </form.Field>

                <form.Field name="image">
                    {(field) => cloudinary
                        ? <PhotoPicker cloudinary={cloudinary} name={field.name} value={field.state.value}
                                       onUploaded={(url) => field.handleChange(url)}
                                       onUploadingChange={setIsUploading}/>
                        // no Cloudinary settings yet: fall back to typing a link
                        : <div>
                            <label htmlFor="image" className={labelClass}>Profile Image URL</label>
                            <input
                                className={inputClass}
                                id="image"
                                type="url"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                                aria-describedby="image-error"
                            />
                            <FieldError id="image-error" meta={field.state.meta}/>
                        </div>
                    }
                </form.Field>

                <form.Subscribe selector={(formState) => formState.canSubmit}>
                    {(canSubmit) => (
                        <button type="submit" disabled={!canSubmit || isSaving || isUploading}
                                className="self-start rounded-full border-2 border-[#031136] bg-[#FF5903] px-6 py-2.5 text-sm font-bold text-[#031136] hover:bg-[#FF5903]/90 disabled:cursor-not-allowed disabled:opacity-50">
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    )}
                </form.Subscribe>

                <StatusMessage actionData={visibleResponse}/>
            </Form>
            </div>
        </section>
    );
}

/**
 * "Choose a photo" button for the profile picture. On a phone it opens the photo gallery
 * (or camera); on a computer, the file picker. The photo is uploaded to Cloudinary right
 * away and its link goes in a hidden "image" input, so the form saves a link just like before.
 */
function PhotoPicker({cloudinary, name, value, onUploaded, onUploadingChange}: {
    cloudinary: CloudinaryConfig;
    name: string;
    value: string;
    onUploaded: (url: string) => void;
    onUploadingChange: (isUploading: boolean) => void;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        // let the same photo be picked again later
        event.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please choose a photo (JPG, PNG, HEIC, ...).");
            return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            setError("That photo is over 10 MB. Please choose a smaller one.");
            return;
        }

        setError(null);
        setIsUploading(true);
        onUploadingChange(true);
        try {
            onUploaded(await uploadPhoto(file, cloudinary));
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "The photo could not be uploaded.");
        } finally {
            setIsUploading(false);
            onUploadingChange(false);
        }
    }

    return (
        <div>
            <span className={labelClass}>Profile photo</span>
            <div className="flex items-center gap-4">
                <img src={value} alt="Your profile photo"
                     className="h-20 w-20 rounded-2xl border-2 border-[#031136] bg-[#C9A3CB] object-cover"/>

                {/* the real file input is hidden; its label is styled as the button */}
                <label htmlFor="photo"
                       className={`cursor-pointer rounded-full border-2 border-[#031136] px-5 py-2 text-sm font-bold text-[#031136] hover:bg-[#FBF3FA] ${isUploading ? "pointer-events-none opacity-50" : ""}`}>
                    {isUploading ? "Uploading..." : "Choose a photo"}
                </label>
                <input id="photo" type="file" accept="image/*" className="sr-only"
                       disabled={isUploading} onChange={handleFile} aria-describedby="photo-error"/>
            </div>

            {/* what the form actually submits: the uploaded photo's link */}
            <input type="hidden" name={name} value={value}/>

            {error && <p id="photo-error" role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">Pick a photo, then press Save changes.</p>
        </div>
    );
}
