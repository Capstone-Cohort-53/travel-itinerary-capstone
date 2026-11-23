import {useState} from "react";
import {Form, Link, NavLink, Outlet} from "react-router"
import {FooterCap} from "~/layouts/footer"
import {getSession} from "~/utils/session.server"
import type {Route} from "./+types/navbar"
import {GoogleSignInButton} from "~/components/google-sign-in";
import {outlineButtonOnNavy, Wordmark} from "~/components/royal";

export async function loader({ request }: Route.LoaderArgs) {
    const cookie = request.headers.get("Cookie") ?? "";
    const session = await getSession(cookie);
    const googleClientId = process.env.GOOGLE_CLIENT_ID ?? null

    const profile = session.get("profile");
    const authorization = session.get("authorization");
    return { googleClientId, isLoggedIn: Boolean(profile && authorization) };
}

// the pages a signed-in user can jump to. A trip's itinerary and travelers are
// reached from My Trips and from the itinerary page itself, so they aren't here
const navLinks = [
    {to: '/my-trips', label: 'My Trips'},
    {to: '/create-trip', label: 'Create Trip'},
    {to: '/profile', label: 'My Profile'},
]

// white spaced-out capitals on navy; the current page's link is underlined in gold
function navLinkClasses() {
    return ({isActive}: { isActive: boolean }) =>
        `block rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10 ${
            isActive ? 'underline decoration-gold decoration-2 underline-offset-[10px]' : ''
        }`
}

// lilac-outlined pill, like the design's Log out button
const logoutButtonClasses = `${outlineButtonOnNavy} !px-4 !py-2.5 !text-xs`

export default function Nav (props : Route.ComponentProps) {
    const {googleClientId, isLoggedIn} = props.loaderData
    // whether the phone menu is open
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const closeMenu = () => setIsMenuOpen(false)

    // a full-height column, so the footer sits at the bottom of the window on short pages
    return <div className="flex min-h-screen flex-col bg-navy">
        <header>
            {/* navy bar: wordmark on the left, links centered, Log out (or Google sign-in) on the right */}
            <nav className="bg-navy">
                <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
                    <div>
                        {/* the TripsQueen wordmark links home */}
                        <Link to="/" onClick={closeMenu} aria-label="TripsQueen home"
                              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                            <Wordmark/>
                        </Link>
                    </div>

                    {/* desktop links, centered in the bar; hidden on phones. The list is there even when
                        signed out (empty), so the sign-in button stays in the right-hand column */}
                    <ul className="hidden items-center gap-2 md:flex">
                        {isLoggedIn && navLinks.map((link) => (
                            <li key={link.label}>
                                <NavLink to={link.to} end className={navLinkClasses()}>{link.label}</NavLink>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center justify-end gap-3">
                        {isLoggedIn ? (
                            // desktop Log out button; on phones it moves into the menu
                            <Form method="post" action="/api/sign-out" className="hidden md:block">
                                <button type="submit" className={logoutButtonClasses}>Log out</button>
                            </Form>
                        ) : (
                            googleClientId && <GoogleSignInButton clientId={googleClientId} text={"signin_with"}/>
                        )}

                        {/* phones: round menu button, lilac-outlined like Log out */}
                        {isLoggedIn && (
                            <button type="button"
                                    className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-lilac text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:hidden"
                                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                                    aria-expanded={isMenuOpen}
                                    aria-controls="mobile-menu"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {/* three-line "hamburger" icon */}
                                <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* phone menu: drops down under the bar when the menu button is tapped */}
                {isLoggedIn && isMenuOpen && (
                    <div id="mobile-menu" className="border-t border-white/20 px-4 pb-4 md:hidden">
                        <ul className="flex flex-col gap-1 pt-2">
                            {navLinks.map((link) => (
                                <li key={link.label}>
                                    <NavLink to={link.to} end className={navLinkClasses()} onClick={closeMenu}>{link.label}</NavLink>
                                </li>
                            ))}
                        </ul>
                        <Form method="post" action="/api/sign-out" className="mt-3" onSubmit={closeMenu}>
                            <button type="submit" className={`${logoutButtonClasses} w-full`}>Log out</button>
                        </Form>
                    </div>
                )}
            </nav>

        </header>
        {/* the page grows to fill the space between the navbar and the footer */}
        <div className="flex-1">
            <Outlet/>
        </div>
        <FooterCap/>
    </div>
}
