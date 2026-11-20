import {redirect} from "react-router";

import type {Route} from './+types/sign-in'
import {GoogleSignInSchema, postGoogleSignIn} from "~/utils/models/sign-in.model";
import {ProfileSchema} from "~/utils/models/profile.model";
import {commitSession, getSession} from "~/utils/session.server";

export function loader (){
    return redirect('/')
}
export async function action ({request}: Route.ActionArgs){
    const formData= await request.formData()
    let validationResult = GoogleSignInSchema.safeParse(Object.fromEntries(formData))
    if (!validationResult.success){
        return {success:false, status:400, data:null, message:'sign-in failed.'}
    }
    const signInResult = await postGoogleSignIn(validationResult.data.credential)
    const {status, headers } = signInResult
    if (status.status !== 200){
        return {success:false, status}
    }
    const authorization = headers.get('Authorization')
    const profileResult = ProfileSchema.safeParse (status.data)
    if (!authorization || !profileResult.success){
        console.error('sign-in succeeded but the response was incomplete.')
        return {success:false, status:{status:504, data:null, message:'sign-in failed.'}}
    }
    const session = await getSession(request.headers.get('Cookie'))
    session.set ('authorization', authorization)
    session.set ('profile',profileResult.data)
    const responseHeaders = new Headers ()

    responseHeaders.append('Authorization', authorization)
    responseHeaders.append('Set-Cookie', await commitSession(session))
    for(const apiCookie of headers.getSetCookie()){
        responseHeaders.append('Set-Cookie', apiCookie)
    }
    // only follow a path on this site ("/x" but not "//evil.com"), so the field can't send users elsewhere
    const redirectTo = formData.get('redirectTo')
    const isLocalPath = typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
    return redirect (isLocalPath ? redirectTo : '/my-trips', {headers: responseHeaders})
}

