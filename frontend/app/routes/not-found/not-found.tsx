import { Link, useLocation } from "react-router";
import type { Route } from "./+types/not-found";
import { Crown, Gem, GemDivider, Parchment, RoyalPage, emphasis, eyebrow, goldButton, headline } from "~/components/royal";

export function meta({}: Route.MetaArgs) {
    return [{ title: "404 - Page Not Found | TripsQueen" }];
}

// inline code on parchment: a soft mist chip
const codeClasses = "rounded bg-mist px-1.5 py-0.5 font-mono text-[0.9em] text-navy";

export default function NotFound() {
    const { pathname } = useLocation();

    return (
        <RoyalPage width="max-w-3xl">
            <Parchment>
                <div className="flex flex-col items-center gap-6 text-center">
                    <div aria-hidden="true" className="flex items-end gap-3">
                        <Gem color="lilac" size={24} />
                        <Crown size={40} />
                        <Gem color="sapphire" size={24} />
                    </div>

                    <p className={eyebrow}>404 · Alas, Your Majesty</p>

                    <h1 className={`${headline} text-4xl sm:text-5xl`}>
                        This page has been <em className={emphasis}>banished</em>
                    </h1>

                    <p className="max-w-lg text-lg text-bay">
                        You went to{" "}
                        <code className={`${codeClasses} break-all`}>{pathname}</code>{" "}
                        but no route is registered for it yet.
                    </p>

                    <Link to="/" className={goldButton}>
                        &larr; Back to the home page
                    </Link>
                </div>

                <div className="my-10">
                    <GemDivider />
                </div>

                {/* notes for whoever is building the app */}
                <section className="rounded-2xl border-[1.5px] border-navy bg-white p-5 text-left sm:p-6">
                    <h2 className="mb-3 font-display text-2xl font-bold italic">How to fix it</h2>
                    <ol className="list-inside list-decimal space-y-3 text-[15px] leading-relaxed text-navy marker:font-bold marker:text-bay">
                        <li>
                            Check the spelling of the URL. Routes are case sensitive and{" "}
                            <code className={codeClasses}>/about</code> is not the same as{" "}
                            <code className={codeClasses}>/About</code>.
                        </li>
                        <li>
                            Open <code className={codeClasses}>app/routes.ts</code> and make sure the page is
                            registered in the array <strong>above</strong> the{" "}
                            <code className={codeClasses}>route("*", ...)</code> catch-all:
                            <pre className="mt-2 overflow-x-auto rounded-xl bg-navy p-3 text-sm text-parchment">
                                <code>{`route("about", "routes/about/about.tsx"),`}</code>
                            </pre>
                        </li>
                        <li>
                            Make sure the file path in <code className={codeClasses}>routes.ts</code> matches a
                            real file under <code className={codeClasses}>app/</code>, and that the file has an{" "}
                            <code className={codeClasses}>export default function</code> component.
                        </li>
                        <li>
                            Link to the page with{" "}
                            <code className={codeClasses}>{`<Link to="/about">`}</code> from{" "}
                            <code className={codeClasses}>react-router</code>, not a plain{" "}
                            <code className={codeClasses}>{`<a href>`}</code>.
                        </li>
                    </ol>
                </section>
            </Parchment>
        </RoyalPage>
    );
}
