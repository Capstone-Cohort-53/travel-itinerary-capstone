import { useState } from "react";
import { useFetcher } from "react-router";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import type { action } from "~/routes/api/sign-in/sign-in/"
import type { FormActionResponse } from "~/utils/interfaces/FormActionResponse"
import { StatusMessage } from "~/components/StatusMessage"

/** The wording on the button: "Sign in with Google" or "Sign up with Google". */
type GoogleButtonText = "signin_with" | "signup_with";

/** redirectTo: where to land after signing in (a path on this site); defaults to /my-trips. */
type GoogleSignInButtonProps = { clientId: string; text: GoogleButtonText; redirectTo?: string };

/** Shown when Google itself reports a failure, before our action is ever called. */
const googleFailedResponse: FormActionResponse = {
    success: false,
    status: { status: 400, data: null, message: "Google sign in failed. Please try again." },
};

/**
 * The "Sign in with Google" button, built on the @react-oauth/google package.
 *
 * 1. GoogleOAuthProvider loads Google's script, and GoogleLogin draws the button
 * 2. the user clicks it and signs in with Google, in a popup Google controls
 * 3. Google calls `onSuccess` with a credential (an ID token)
 * 4. the credential is posted to the /sign-in/google action, which forwards it
 *    to the backend. On success the action redirects to the feed; otherwise the
 *    message it returned is shown under the button
 *
 * Pass it the OAuth Client ID, which tells Google which application is asking,
 * and the wording for the button. The sign-up page uses it too: the backend
 * creates a profile the first time it sees a Google account, so signing up and
 * signing in with Google are the same request.
 */
export function GoogleSignInButton(props: GoogleSignInButtonProps) {
    const { clientId, text, redirectTo } = props;

    // a fetcher posts to an action without leaving the page, and holds what it returned
    const fetcher = useFetcher<typeof action>();
    const isPosting = fetcher.state !== "idle";

    // true when Google reported a failure in its own popup
    const [googleFailed, setGoogleFailed] = useState(false);

    function handleSuccess(credentialResponse: CredentialResponse) {
        // Google types the credential as optional: without one there is nothing to post
        if (!credentialResponse.credential) {
            setGoogleFailed(true);
            return;
        }

        setGoogleFailed(false);
        void fetcher.submit(
            { credential: credentialResponse.credential, redirectTo: redirectTo ?? "" },
            { method: "post", action: "/api/sign-in/" },
        );
    }

    // a redirect means success, so anything the action returned is a failure to show
    const actionResponse = isPosting ? undefined : fetcher.data;
    const response = googleFailed ? googleFailedResponse : actionResponse;

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="flex justify-center">
                <GoogleLogin
                    text={text}
                    theme="outline"
                    size="large"
                    onSuccess={handleSuccess}
                    onError={() => setGoogleFailed(true)}
                />
            </div>
            {isPosting && (
                <p role="status" className="mt-2 text-center text-sm text-gray-600">
                    Signing in with Google...
                </p>
            )}
            <StatusMessage actionData={response} />
        </GoogleOAuthProvider>
    );
}