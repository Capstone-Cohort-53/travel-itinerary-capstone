import {Button, Navbar, NavbarBrand, NavbarCollapse, NavbarLink, NavbarToggle} from "flowbite-react";
import {Outlet, redirect} from "react-router"
import {FooterCap} from "~/layouts/footer"
import {getSession} from "~/utils/session.server"
import type {Route} from "./+types/navbar"
import {GoogleSignInButton} from "~/components/google-sign-in";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    if (session.has("profile")) {
        return { googleClientId: process.env.GOOGLE_CLIENT_ID ?? null , isLoggedIn: true};
    }

    return { googleClientId: process.env.GOOGLE_CLIENT_ID ?? null , isLoggedIn:false};
}

export default function Nav (props : Route.ComponentProps) {
    const {googleClientId, isLoggedIn} = props.loaderData
    return <>

        <Navbar fluid rounded>
            <NavbarBrand href="https://flowbite-react.com">
                <img src="/favicon.svg" className="mr-3 h-6 sm:h-9" alt="Flowbite React Logo" />
                <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">[Company Name]</span>
            </NavbarBrand>
            <div className="flex md:order-2">
                {isLoggedIn? <></>:<GoogleSignInButton clientId={googleClientId as string} text={"signin_with"}></GoogleSignInButton>}
                <NavbarToggle />
            </div>
            <NavbarCollapse>
                {/*<NavbarLink href="#" active>*/}
                {/*    Home*/}
                {/*</NavbarLink>*/}
                <NavbarLink href="#">My Trips</NavbarLink>
                <NavbarLink href="#">Manage Travelers</NavbarLink>
            </NavbarCollapse>
        </Navbar>
<Outlet/>
        <FooterCap/>
    </>
}