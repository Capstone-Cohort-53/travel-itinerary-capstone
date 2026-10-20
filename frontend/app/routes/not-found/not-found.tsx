import { Link, useLocation } from "react-router";
import type { Route } from "./+types/not-found";

export function meta({}: Route.MetaArgs) {
    return [{ title: "404 - Page Not Found" }];
}

export default function NotFound() {
    const { pathname } = useLocation();

    return (
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
            <h1 className="text-4xl font-bold">404 - No route matches this URL</h1>

            <p className="text-lg">
                You went to{" "}
                <code className="rounded bg-gray-100 px-2 py-1 font-mono">{pathname}</code>{" "}
                but no route is registered for it yet.
            </p>

            <section className="rounded-lg border border-gray-300 p-4">
                <h2 className="mb-2 text-xl font-semibold">How to fix it</h2>
                <ol className="list-inside list-decimal space-y-2">
                    <li>
                        Check the spelling of the URL. Routes are case sensitive and{" "}
                        <code className="font-mono">/about</code> is not the same as{" "}
                        <code className="font-mono">/About</code>.
                    </li>
                    <li>
                        Open <code className="font-mono">app/routes.ts</code> and make sure the page is
                        registered in the array <strong>above</strong> the{" "}
                        <code className="font-mono">route("*", ...)</code> catch-all:
                        <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-100">
              <code>{`route("about", "routes/about/about.tsx"),`}</code>
            </pre>
                    </li>
                    <li>
                        Make sure the file path in <code className="font-mono">routes.ts</code> matches a
                        real file under <code className="font-mono">app/</code>, and that the file has an{" "}
                        <code className="font-mono">export default function</code> component.
                    </li>
                    <li>
                        Link to the page with{" "}
                        <code className="font-mono">{`<Link to="/about">`}</code> from{" "}
                        <code className="font-mono">react-router</code>, not a plain{" "}
                        <code className="font-mono">{`<a href>`}</code>.
                    </li>
                </ol>
            </section>

            <Link to="/" className="font-semibold text-blue-700 underline hover:text-blue-900">
                &larr; Back to the home page
            </Link>
        </main>
    );
}