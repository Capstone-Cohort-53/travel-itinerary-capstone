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
import {Button, Card, Label, TextInput} from "flowbite-react";
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

    // only the profile goes to the browser, never the token or the cookies
    return {profile, message: profile === null ? status.message : null};
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

export default function ProfilePage(props: Route.ComponentProps) {
    const {profile, message} = props.loaderData;

    return (
        <div className="bg-[url('/bg_reduced.jpeg')] bg-cover bg-right bg-no-repeat">
            <main className="min-h-screen container mx-auto max-w-3xl px-4 py-8">
                <h1 className="text-4xl font-bold tracking-wider text-white mb-6">My Profile</h1>

                {profile === null
                    ? <Card><p role="alert" className="text-red-700">{message ?? "Could not load your profile."}</p></Card>
                    : <>
                        <ProfileSummary profile={profile}/>
                        <EditProfileForm profile={profile}/>
                    </>
                }
            </main>
        </div>
    );
}

function ProfileSummary({profile}: { profile: Profile }) {
    return (
        <Card className="mb-8">
            <div className="flex items-center gap-6">
                <img src={profile.image} alt="" className="h-20 w-20 rounded-full object-cover"/>
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-wider text-gray-700">{profile.name}</h2>
                    <p className="text-gray-700">✉️ {profile.email}</p>
                    <p className="text-gray-700">📱 {profile.cellNumber ?? "No cell number yet"}</p>
                    <p className="text-sm text-gray-500">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </Card>
    );
}

function EditProfileForm({profile}: { profile: Profile }) {
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

    return (
        <Card>
            <h2 className="text-2xl font-bold tracking-wider text-gray-500">Edit Profile</h2>

            <Form
                method="post"
                noValidate
                className="flex max-w-md flex-col gap-4"
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
                            <Label htmlFor="name">Name</Label>
                            <TextInput
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
                            <Label htmlFor="cellNumber">Cell Number</Label>
                            <TextInput
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
                    {(field) => (
                        <div>
                            <Label htmlFor="image">Profile Image URL</Label>
                            <TextInput
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
                    )}
                </form.Field>

                <form.Subscribe selector={(formState) => formState.canSubmit}>
                    {(canSubmit) => (
                        <Button className="bg-[#FD6B6C] hover:bg-red-600" type="submit" disabled={!canSubmit || isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                </form.Subscribe>

                <StatusMessage actionData={visibleResponse}/>
            </Form>
        </Card>
    );
}
