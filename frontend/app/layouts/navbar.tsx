import {useState} from "react";
import {Form, Link, NavLink, Outlet} from "react-router"
import {FooterCap} from "~/layouts/footer"
import {getSession} from "~/utils/session.server"
import type {Route} from "./+types/navbar"
import {GoogleSignInButton} from "~/components/google-sign-in";

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

// white links on navy; the current page's link is underlined in orange
function navLinkClasses() {
    return ({isActive}: { isActive: boolean }) =>
        `block rounded-lg px-3 py-2 text-lg font-bold text-white hover:bg-white/10 ${
            isActive ? 'underline decoration-[#FF5A1F] decoration-4 underline-offset-8' : ''
        }`
}

// coral pill with navy text, like the mockup's Log out button
const logoutButtonClasses = 'rounded-full bg-[#FF8A85] px-6 py-2 text-lg font-bold text-[#0B1533] hover:bg-[#FF6B6B]'

export default function Nav (props : Route.ComponentProps) {
    const {googleClientId, isLoggedIn} = props.loaderData
    // whether the phone menu is open
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const closeMenu = () => setIsMenuOpen(false)

    // a full-height column, so the footer sits at the bottom of the window on short pages
    return <div className="flex min-h-screen flex-col">
        <header>
            {/* navy bar: logo on the left, links centered, Log out (or Google sign-in) on the right */}
            <nav className="bg-[#0B1533]">
                <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
                    <div>
                        {/* the groupie.travel logo links home */}
                        <Link to="/" onClick={closeMenu}>
                            <img src="/logo.png" alt="groupie.travel home" className="h-10 w-auto sm:h-14"/>
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

                        {/* phones: coral round menu button, like the mobile mockup */}
                        {isLoggedIn && (
                            <button type="button"
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF8A85] text-[#0B1533] md:hidden"
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

            {/* retro sunset stripes under the bar, from the mockup */}
            <div aria-hidden="true">
                <div className="h-2 bg-[#FF5A1F]"/>
                <div className="h-2 bg-[#FF8A85]"/>
                <div className="h-2 bg-[#C19AC5]"/>
                <div className="h-2 bg-[#3A4187]"/>
            </div>
        </header>
        {/* the page grows to fill the space between the navbar and the footer;
            flex-col lets a page's root element use flex-1 to stretch its background down to the footer */}
        <div className="flex flex-1 flex-col">
            <Outlet/>
        </div>
        <FooterCap/>
    </div>
}
