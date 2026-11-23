import {redirect} from "react-router";
import {createServerValidate, ServerValidateError} from "@tanstack/react-form-remix";
import {endSession, requireSignedInUser, type SignedInUser} from "~/utils/session.server";
import {type NewTrip, NewTripSchema} from "~/utils/models/trip.model";
import type {Status} from "~/utils/interfaces/Status";
import {tripFormOpts} from "~/routes/create-trip/trip-form";

// The server half of the trip form shared by Create Trip and Edit Trip. It lives in a .server
// file because it uses the session, which must never be sent to the browser.

//STEP 6: the server-side validator, for when the form is posted without JavaScript
const serverValidate = createServerValidate({
    ...tripFormOpts,
    onServerValidate: ({value}) => {
        const validationResult = NewTripSchema.safeParse(value);
        if (!validationResult.success) {
            return validationResult.error.issues.map((issue) => issue.message);
        }
    },
});

/**
 * STEP 7: what both pages' actions do. Check the user, validate, then hand the values to `save`
 * (create or update). On success the user goes to the page `successPath` names.
 *
 * @param request the request the action received
 * @param save calls the API with the validated values; returns its Status
 * @param successPath where to go after a successful save, given the API's answer
 */
export async function handleTripForm(
    request: Request,
    save: (data: NewTrip, user: SignedInUser) => Promise<Status>,
    successPath: (status: Status) => string,
) {
    // outside the try: its thrown redirect has to reach React Router
    const user = await requireSignedInUser(request);
    const formData = await request.formData();

    try {
        const validatedData = await serverValidate(formData);
        const status = await save(validatedData, user);

        //STEP 8: handle the answer
        if (status.status === 401 || status.status === 403) {
            return await endSession(request);
        }

        if (status.status === 200) {
            return redirect(successPath(status));
        }

        return {success: false, status};
    } catch (error) {
        if (error instanceof ServerValidateError) {
            return error.formState;
        }
        throw error;
    }
}
