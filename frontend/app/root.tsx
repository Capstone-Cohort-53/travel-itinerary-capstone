import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ThemeInit } from "../.flowbite-react/init";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  // the TripsQueen crown in the browser tab (the PNG for browsers without SVG icons), and on phone home screens
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/png", href: "/favicon.png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    // TripsQueen type: Playfair Display headlines, Montserrat for everything else, Pinyon Script for the signature
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700;1,800&family=Pinyon+Script&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      {/* browser extensions such as Grammarly add attributes to <body> before React loads */}
      <body suppressHydrationWarning>
      {/* flowbite-react theme bootstrap; dark mode is off via "dark": false in .flowbite-react/config.json */}
      <ThemeInit />
      {children}
      <ScrollRestoration />
      <Scripts />
      </body>
      </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
        error.status === 404
            ? "The requested page could not be found."
            : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  // shown when a page crashes; the navbar may not have loaded, so this paints its own navy page
  return (
      <main className="min-h-screen bg-navy px-3 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-parchment p-2.5 text-navy sm:p-4">
          <div className="rounded-2xl border-2 border-navy px-6 py-10 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-bay">Alas, Your Majesty</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">{message}</h1>
            <p className="mt-3 text-bay">{details}</p>
            <a href="/" className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-[13px] font-bold uppercase tracking-[0.14em] text-navy shadow-[0_4px_0_var(--color-gold-dark)]">
              Back to TripsQueen
            </a>
            {stack && (
                <pre className="mt-6 w-full overflow-x-auto rounded-xl bg-mist p-4 text-xs">
              <code>{stack}</code>
            </pre>
            )}
          </div>
        </div>
      </main>
  );
}