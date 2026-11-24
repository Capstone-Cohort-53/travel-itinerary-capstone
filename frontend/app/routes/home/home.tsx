import {Link} from "react-router";
import type {Route} from "./+types/home";
import {getSession} from "~/utils/session.server";
import {GoogleSignInButton} from "~/components/google-sign-in";
import {RoyalAlbum} from "~/routes/home/royal-album";
import {RotatingTrip, RotationPauseButton, useRotatingTrip} from "~/routes/home/rotating-trip";
import {Crown, Gem, Parchment, RoyalPage, WaxSealLink, emphasis, eyebrow, headline} from "~/components/royal";


export function meta({}: Route.MetaArgs) {
    return [
        {title: "TripsQueen | Share your vacation itinerary"},
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

// the three "articles" under the hero, each with its own icon
const features = [
    {
        article: "Article I",
        title: "Thou shalt plan together",
        text: "One shared itinerary the whole court can see.",
        icon: <Crown size={40}/>,
    },
    {
        article: "Article II",
        title: "Thou shalt summon thy girls",
        text: "Send invites by email, little royals included.",
        icon: <Gem color="pink" size={40}/>,
    },
    {
        article: "Article III",
        title: "Thou shalt know who's in",
        text: "RSVPs for every activity, in one place: Going, Maybe or Not going.",
        icon: <Gem color="lilac" size={40}/>,
    },
]

// the italic "view my trips →" link beside the seal, underlined in pink like the design
const scriptLinkClasses = 'inline-flex min-h-11 items-center border-b-2 border-pink font-display text-xl italic text-navy hover:border-gold focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:text-[22px]'


// a navy rule with a gem in the middle, under the headline
function HeadlineRule() {
    return (
        <div aria-hidden="true" className="flex w-full max-w-[420px] items-center gap-2.5">
            <span className="h-px flex-1 bg-navy"/>
            <Gem color="pink" size={20}/>
            <span className="h-px flex-1 bg-navy"/>
        </div>
    )
}


export default function Home(props: Route.ComponentProps) {
    const {isLoggedIn, googleClientId} = props.loaderData
    // the signed-out headline's pink phrase rotates through kinds of trips
    const rotation = useRotatingTrip()

    return (
        <RoyalPage>
            <Parchment>
                <div className="flex flex-col gap-12 sm:gap-14">

                    {/* hero: centered proclamation, then the seal (signed in) or the Google sign-up (signed out) */}
                    <section className="flex flex-col items-center gap-6 text-center sm:gap-7">
                        <div aria-hidden="true" className="flex items-end gap-3">
                            <Gem color="lilac" size={26}/>
                            <Crown size={44}/>
                            <Gem color="sapphire" size={26}/>
                        </div>

                        <p className={eyebrow}>{isLoggedIn ? "Welcome back, Your Majesty" : "By royal decree"}</p>

                        <h1 className={`${headline} text-[34px] min-[400px]:text-[40px] sm:text-6xl lg:text-[77px]`}
                            {...(isLoggedIn ? {} : rotation.hoverHandlers)}>
                            {isLoggedIn ? (
                                <>Thy kingdom <em className={emphasis}>awaits.</em></>
                            ) : (
                                // three lines, as in the design; the middle one rotates
                                <>Hear ye, hear ye:<br/><RotatingTrip index={rotation.index}/>is happening.</>
                            )}
                        </h1>
                        {!isLoggedIn && rotation.canPause && (
                            <RotationPauseButton isPaused={rotation.isPaused} onToggle={rotation.togglePause}/>
                        )}

                        <HeadlineRule/>

                        <p className="max-w-[620px] text-base leading-relaxed text-bay sm:text-lg">
                            Plan one shared itinerary, invite your group, and see who's coming to every activity.
                        </p>

                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
                            {isLoggedIn ? (
                                <>
                                    <WaxSealLink to="/create-trip">Decree<br/>a new<br/>trip</WaxSealLink>
                                    <Link to="/my-trips" className={scriptLinkClasses}>view my trips →</Link>
                                </>
                            ) : (
                                // accounts are Google-only, so signing up and signing in are the same button
                                googleClientId && (
                                    <div className="w-full max-w-sm rounded-2xl border-[1.5px] border-navy bg-white p-5">
                                        <p className="mb-3 font-display text-xl font-bold italic">Join the court, free</p>
                                        <GoogleSignInButton clientId={googleClientId} text="signup_with"/>
                                        <p className="mt-3 text-sm text-bay">
                                            Already have an account? The same button signs you in.
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </section>

                    {/* the "From the Royal Album" photo carousel, between the welcome and the articles, as in the design */}
                    <RoyalAlbum/>

                    {/* the three articles: stacked on phones, three across with lilac rules on wider screens */}
                    <section aria-label="What TripsQueen does" className="border-t-2 border-navy pt-10">
                        <div className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-lilac">
                            {features.map((feature) => (
                                <article key={feature.title} className="flex flex-col items-center gap-2 px-2 text-center md:px-6">
                                    <span aria-hidden="true">{feature.icon}</span>
                                    <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-royal-red">{feature.article}</p>
                                    <h2 className="font-display text-2xl font-bold italic">{feature.title}</h2>
                                    <p className="text-[15px] leading-relaxed text-bay">{feature.text}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* the signature at the bottom of the decree */}
                    <div className="flex flex-col items-center gap-1 text-center">
                        <span className="font-script text-5xl leading-none sm:text-[56px]">TripsQueen</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-bay">Signed &amp; sealed</span>
                    </div>
                </div>
            </Parchment>
        </RoyalPage>
    )
}
