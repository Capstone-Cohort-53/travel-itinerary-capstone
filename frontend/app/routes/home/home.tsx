import {Link} from "react-router";
import type {Route} from "./+types/home";
import {getSession} from "~/utils/session.server";
import {GoogleSignInButton} from "~/components/google-sign-in";


export function meta({}: Route.MetaArgs) {
    return [
        {title: "groupie.travel | Share your vacation itinerary"},
        {name: "description", content: "Plan one shared itinerary, invite your group, and see who's coming to every activity."},
    ];
}

// signed-in visitors get links into the app; everyone else gets the Google sign-up button
export async function loader({request}: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"))
    return {
        isLoggedIn: session.has("profile"),
        googleClientId: process.env.GOOGLE_CLIENT_ID ?? null,
    }
}

// the three feature cards under the hero; each has its own stripe and title color
const features = [
    {
        title: "Plan together",
        text: "Build one itinerary everyone can see.",
        titleColor: "text-[#FF5A1F]",
        stripes: ["bg-[#FF5A1F]", "bg-[#FF8A85]"],
    },
    {
        title: "Invite your people",
        text: "Send invites by email, kids included.",
        titleColor: "text-[#FF8A85]",
        stripes: ["bg-[#FF8A85]", "bg-[#C19AC5]"],
    },
    {
        title: "Know who's coming",
        text: "RSVPs for every activity, in one place.",
        titleColor: "text-[#C19AC5]",
        stripes: ["bg-[#C19AC5]", "bg-[#3A4187]"],
    },
]

// the two hero buttons: solid orange with a coral offset shadow, and a lavender outline
const primaryButtonClasses = 'block w-full rounded-full border-2 border-[#0B1533] bg-[#FF5A1F] px-6 py-3 text-center text-lg font-bold text-[#0B1533] shadow-[6px_6px_0_#FF8A85] hover:bg-[#FF7A45]'
const secondaryButtonClasses = 'block w-full rounded-full border-2 border-[#C19AC5] px-6 py-3 text-center text-lg font-bold text-white hover:bg-white/10'


// a picture placeholder icon, as in the wireframe; swap for an <img> when photos are ready
function ImageIcon({className}: { className: string }) {
    return (
        <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4"/>
            <circle cx="15.5" cy="8.5" r="1.5"/>
            <path strokeLinejoin="round" d="m3 16 5-5 4 4 2-2 7 7"/>
        </svg>
    )
}


// retro sunset with two photo cards overlapping its bottom edge
function SunsetArt() {
    return (
        <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
            {/* the sun: orange on top, coral bands below separated by navy gaps, lavender at the bottom */}
            <div className="mx-auto aspect-square w-[85%] overflow-hidden rounded-full">
                <div className="h-[42%] bg-[#FF5A1F]"/>
                <div className="h-[10%] bg-[#FF8A85]"/>
                <div className="h-[3%] bg-[#0B1533]"/>
                <div className="h-[10%] bg-[#FF8A85]"/>
                <div className="h-[3%] bg-[#0B1533]"/>
                <div className="h-[32%] bg-[#C19AC5]"/>
            </div>

            {/* photo cards, pulled up over the lower half of the sun */}
            <div className="relative -mt-[38%] flex items-start">
                <div className="flex aspect-[4/3] w-[58%] items-center justify-center rounded-2xl border-4 border-[#0B1533] bg-[#3A4187] text-[#C19AC5] shadow-[8px_8px_0_#FF5A1F]">
                    <ImageIcon className="h-10 w-10"/>
                </div>
                <div className="-ml-[4%] mt-[10%] flex aspect-square w-[45%] items-center justify-center rounded-2xl border-4 border-[#0B1533] bg-[#C19AC5] text-[#0B1533] shadow-[8px_8px_0_#FF8A85]">
                    <ImageIcon className="h-10 w-10"/>
                </div>
            </div>
        </div>
    )
}


export default function Home(props: Route.ComponentProps) {
    const {isLoggedIn, googleClientId} = props.loaderData

    return (
        // navy page, matching the navbar and footer
        <main className="bg-[#0B1533] text-white">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 md:py-16">

                {/* hero: stacked on phones, text left and sunset right on wider screens */}
                <section className="grid items-center gap-12 md:grid-cols-2">
                    <div>
                        <p className="inline-block rounded-full border-2 border-[#FF8A85] px-4 py-1 text-sm font-bold uppercase tracking-[0.2em] text-[#FF8A85]">
                            Group trips, simplified
                        </p>

                        <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
                            Share your vacation itinerary, <span className="text-[#FF5A1F]">seamlessly.</span>
                        </h1>

                        <p className="mt-5 max-w-lg text-lg text-white/85">
                            Plan one shared itinerary, invite your group, and see who's coming to every activity.
                        </p>

                        <div className="mt-8 flex max-w-sm flex-col gap-4">
                            {isLoggedIn ? (
                                <>
                                    <Link to="/create-trip" className={primaryButtonClasses}>Plan a new trip</Link>
                                    <Link to="/my-trips" className={secondaryButtonClasses}>Go to My Trips</Link>
                                </>
                            ) : (
                                // accounts are Google-only, so signing up and signing in are the same button
                                googleClientId && (
                                    <div className="rounded-3xl border-2 border-[#C19AC5] p-5">
                                        <p className="mb-3 text-center font-bold">Create a free account</p>
                                        <GoogleSignInButton clientId={googleClientId} text="signup_with"/>
                                        <p className="mt-3 text-center text-sm text-white/70">
                                            Already have one? The same button signs you in.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <SunsetArt/>
                </section>

                {/* feature cards: stacked on phones, three across on wider screens */}
                <section className="mt-16 grid gap-6 md:grid-cols-3">
                    {features.map((feature) => (
                        <article key={feature.title} className="overflow-hidden rounded-2xl border-2 border-[#3A4187] bg-[#111D47]">
                            <div aria-hidden="true">
                                <div className={`h-2 ${feature.stripes[0]}`}/>
                                <div className={`h-1 ${feature.stripes[1]}`}/>
                            </div>
                            <div className="p-5">
                                <h2 className={`font-display text-2xl font-bold ${feature.titleColor}`}>{feature.title}</h2>
                                <p className="mt-1 text-white/85">{feature.text}</p>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </main>
    )
}
