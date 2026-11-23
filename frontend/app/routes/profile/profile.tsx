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
import {Crown, Gem, GemDivider, Parchment, RoyalPage, card, emphasis, eyebrow, goldButton, headline, input, label, outlineButton} from "~/components/royal";

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

// the Royal Decree form look (shared from royal.tsx); labels stay plain words
const inputClass = input;
const labelClass = label;

export default function ProfilePage(props: Route.ComponentProps) {
    const {profile, cloudinary, message} = props.loaderData;

    return (
        <RoyalPage width="max-w-5xl">
            <Parchment>
                {profile === null
                    ? <p role="alert" className="rounded-xl border-[1.5px] border-royal-red bg-royal-red/5 p-5 font-medium text-royal-red">
                        {message ?? "Could not load your profile."}
                    </p>
                    : <div className="space-y-10">
                        <ProfileHero profile={profile}/>
                        <GemDivider/>
                        <ProfileDetails profile={profile}/>
                        <EditProfileForm profile={profile} cloudinary={cloudinary}/>
                    </div>
                }
            </Parchment>
        </RoyalPage>
    );
}

// greeting and headline on the left, the profile photo in a gold frame on the right
function ProfileHero({profile}: { profile: Profile }) {
    const firstName = profile.name.split(" ")[0];
    return (
        <section className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="text-center md:text-left">
                <p className={`${eyebrow} break-words`}>
                    Welcome back, {firstName}!
                </p>
                <h1 className={`${headline} mt-3 text-4xl sm:text-5xl lg:text-6xl`}>
                    Your royal <em className={emphasis}>profile</em>
                </h1>
                <p className="mx-auto mt-4 max-w-md text-bay md:mx-0">
                    This is how your court sees you on every trip. Keep your name, number and photo up to date.
                </p>
                <a href="#edit-profile" className={`${outlineButton} mt-6`}>
                    Edit my profile
                </a>
            </div>

            {/* photo in a gold frame with a crown on top */}
            <div className="relative mx-auto w-fit pt-5">
                <Crown size={40} className="absolute left-1/2 top-0 z-10 -translate-x-1/2"/>
                <img src={profile.image} alt={`${profile.name}'s profile photo`}
                     className="h-40 w-40 rounded-2xl border-4 border-gold bg-lilac object-cover outline outline-[1.5px] outline-offset-2 outline-navy sm:h-48 sm:w-48"/>
            </div>
        </section>
    );
}

// three plain cards, each with a gem and a small Blue Bay label
function ProfileDetails({profile}: { profile: Profile }) {
    const details = [
        {label: "Email", value: profile.email, gem: "pink" as const},
        {label: "Cell number", value: profile.cellNumber ?? "No cell number yet", gem: "lilac" as const},
        {label: "Member since", value: new Date(profile.createdAt).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"}), gem: "sapphire" as const},
    ];

    return (
        <section className="grid gap-4 md:grid-cols-3 md:gap-6">
            {details.map((detail) => (
                <article key={detail.label} className={`${card} bg-white`}>
                    <div className="flex items-center gap-2">
                        <Gem color={detail.gem} size={18}/>
                        <h2 className={eyebrow}>{detail.label}</h2>
                    </div>
                    <p className="mt-2 break-words font-display text-xl font-semibold text-navy">{detail.value}</p>
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
        <section id="edit-profile" className={`${card} bg-white sm:p-8`}>
            <p className={eyebrow}>Royal records</p>
            <h2 className="mt-1 font-display text-2xl font-bold italic text-navy sm:text-3xl">Edit profile</h2>
            <p className="mt-1 text-sm text-bay">Changes show up for everyone on your trips.</p>

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
                    <p key={String(error)} role="alert" className="text-sm font-medium text-royal-red">{String(error)}</p>
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
                                className={`${goldButton} w-full sm:w-auto sm:self-start`}>
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    )}
                </form.Subscribe>

                <StatusMessage actionData={visibleResponse}/>
            </Form>
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
            <div className="flex flex-wrap items-center gap-4">
                <img src={value} alt="Your profile photo"
                     className="h-20 w-20 rounded-2xl border-[3px] border-gold bg-lilac object-cover"/>

                {/* the real file input is hidden; its label is styled as the button.
                    the gold focus ring shows on the label when the hidden input has keyboard focus */}
                <label htmlFor="photo"
                       className={`${outlineButton} cursor-pointer has-[+input:focus-visible]:ring-2 has-[+input:focus-visible]:ring-gold ${isUploading ? "pointer-events-none opacity-50" : ""}`}>
                    {isUploading ? "Uploading..." : "Choose a photo"}
                </label>
                <input id="photo" type="file" accept="image/*" className="sr-only"
                       disabled={isUploading} onChange={handleFile} aria-describedby="photo-error"/>
            </div>

            {/* what the form actually submits: the uploaded photo's link */}
            <input type="hidden" name={name} value={value}/>

            {error && <p id="photo-error" role="alert" className="mt-1 text-sm font-medium text-royal-red">{error}</p>}
            <p className="mt-1 text-xs text-bay">Pick a photo, then press Save changes.</p>
        </div>
    );
}
