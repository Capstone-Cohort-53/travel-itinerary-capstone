import {redirect} from "react-router";
import type {Route} from "./+types/sign-out";
import {endSession} from "~/utils/session.server";

// visiting /api/sign-out directly does nothing; just go home
export function loader() {
    return redirect('/')
}

// the navbar's Log out button posts here: endSession deletes the React app's
// session cookie and redirects to the home page
export async function action({request}: Route.ActionArgs) {
    return endSession(request)
}
