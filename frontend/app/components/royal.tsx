import {useId, type ReactNode} from "react";
import {Link} from "react-router";

/**
 * TripsQueen · Royal Decree: the shared pieces every page is built from, so the
 * look stays the same everywhere. From the team's design canvas, page
 * "TripsQueen · Royal Decree (all screens)".
 *
 * - Parchment: the framed cream page with crowns and gems in the corners
 * - WaxSeal: the gold seal used for a page's one big action ("Decree a new trip")
 * - Crown, Gem: the icons used in corners, headings and dividers
 * - Wordmark: TRIPSQUEEN with its crown (navbar), or the script signature (footer)
 * - class strings for buttons, labels and chips, for use on plain elements:
 *   <button className={goldButton}>, <Link className={outlineButton}>, …
 *
 * These only change how things look: put them around the existing forms and
 * buttons without changing what those do.
 */


// ── buttons, labels and chips ──

const buttonBase = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

/** The main action: gold pill with a pressed edge. One per section, at most. */
export const goldButton = `${buttonBase} bg-gold text-navy shadow-[0_4px_0_var(--color-gold-dark)] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-gold-dark)] focus-visible:ring-navy focus-visible:ring-offset-parchment`

/** A second action beside a gold one, on parchment: navy outline. */
export const outlineButton = `${buttonBase} border-[1.5px] border-navy bg-transparent text-navy hover:bg-navy/5 focus-visible:ring-gold focus-visible:ring-offset-parchment`

/** A second action on the navy background (navbar, footer): lilac outline. */
export const outlineButtonOnNavy = `${buttonBase} border-[1.5px] border-lilac bg-transparent text-white hover:bg-white/10 focus-visible:ring-gold focus-visible:ring-offset-navy`

/** A destructive action (delete, remove): royal red outline. */
export const dangerButton = `${buttonBase} border-[1.5px] border-royal-red bg-transparent text-royal-red hover:bg-royal-red/5 focus-visible:ring-royal-red focus-visible:ring-offset-parchment`

/** The small spaced-out capitals above a heading: "WELCOME BACK, YOUR MAJESTY". */
export const eyebrow = 'text-xs font-bold uppercase tracking-[0.18em] text-bay'

/** A big Playfair headline; wrap the words to emphasize in <em className={emphasis}>. */
export const headline = 'font-display font-extrabold leading-[1.02] text-navy'

/** Italic watermelon-pink emphasis inside a headline ("Thy kingdom awaits, *Ana.*"). Large text only: too light for small text on cream. */
export const emphasis = 'italic text-pink'

/** A small pill tag: lilac (selected RSVPs and tags) by default. */
export const chip = 'inline-flex items-center rounded-full bg-lilac px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy'

/** A plain card inside a parchment page. */
export const card = 'rounded-2xl border-[1.5px] border-navy bg-parchment p-5'

/** Form labels stay plain (Montserrat, navy) so the forms are easy to use. */
export const label = 'mb-1.5 block text-sm font-bold text-navy'

/** Text boxes, selects and text areas on parchment. */
export const input = 'block w-full rounded-xl border-[1.5px] border-navy bg-white px-3.5 py-2.5 text-navy placeholder:text-[#6b6f8f] focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold'


// ── icons ──

/** The TripsQueen crown: gold, with a pink jewel. `outline` is its stroke: navy on parchment, white on navy. */
export function Crown({size = 30, outline = '#031136', className}: { size?: number, outline?: string, className?: string }) {
    return (
        <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" className={className}>
            <path d="M4 24h24l-2.5-14-6 5.5L16 6l-3.5 9.5-6-5.5z" fill="#D4AF37" stroke={outline} strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="16" cy="5" r="2.2" fill="#D4AF37" stroke={outline} strokeWidth="1.6"/>
            <circle cx="4.5" cy="9" r="2" fill="#D4AF37" stroke={outline} strokeWidth="1.6"/>
            <circle cx="27.5" cy="9" r="2" fill="#D4AF37" stroke={outline} strokeWidth="1.6"/>
            <rect x="4" y="25.5" width="24" height="3" rx="1.5" fill={outline}/>
            <path d="M16 14.5l2.6 3-2.6 3.6-2.6-3.6z" fill="#FD6B6C" stroke={outline} strokeWidth="1.2"/>
        </svg>
    )
}

const GEM_COLORS = {pink: '#FD6B6C', lilac: '#C7A2CB', sapphire: '#434A90'}

/** A faceted gemstone: pink, lilac or sapphire. */
export function Gem({color = 'pink', size = 28, outline = '#031136', className}: {
    color?: keyof typeof GEM_COLORS, size?: number, outline?: string, className?: string,
}) {
    return (
        <svg aria-hidden="true" width={size} height={size * 0.875} viewBox="0 0 32 28" className={className}>
            <path d="M8 2h16l6 8-14 17L2 10z" fill={GEM_COLORS[color]} stroke={outline} strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M2 10h28M8 2l3 8 5-8 5 8 3-8M11 10l5 17 5-17" fill="none" stroke={outline} strokeWidth="1.1" strokeLinejoin="round"/>
            <path d="M8 2l3 8H2z" fill="#ffffff" opacity="0.55"/>
            <path d="M16 2l-5 8h10z" fill="#ffffff" opacity="0.3"/>
        </svg>
    )
}

/** A thin lilac rule with a gem in the middle, between sections. */
export function GemDivider({color = 'lilac'}: { color?: keyof typeof GEM_COLORS }) {
    return (
        <div aria-hidden="true" className="flex items-center gap-3">
            <span className="h-px flex-1 bg-lilac"/>
            <Gem color={color} size={20}/>
            <span className="h-px flex-1 bg-lilac"/>
        </div>
    )
}


// ── the brand ──

/** TRIPSQUEEN with its crown, for the navy navbar. */
export function Wordmark({className = ''}: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 text-lg font-bold tracking-[0.1em] text-white sm:text-[22px] ${className}`}>
            <Crown size={26} outline="#ffffff"/>
            TRIPSQUEEN
        </span>
    )
}

/** The "TripsQueen" signature in Pinyon Script with a gem, for the footer. */
export function Signature({className = ''}: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 font-script text-[26px] leading-none text-white ${className}`}>
            <Gem size={20} outline="#ffffff"/>
            TripsQueen
        </span>
    )
}


// ── the framed parchment page ──

/**
 * The cream "parchment" page every screen sits on: a double navy frame with
 * crowns in two corners and gems in the other two. `compact` trims the padding
 * for phones and side panels.
 */
export function Parchment({children, compact = false, className = '', as: Tag = 'div'}: {
    children: ReactNode, compact?: boolean, className?: string, as?: 'div' | 'section' | 'article',
}) {
    return (
        <Tag className={`rounded-3xl bg-parchment p-2.5 text-navy sm:p-4 ${className}`}>
            <div className={`relative rounded-2xl border-2 border-navy outline outline-1 -outline-offset-[7px] outline-navy ${compact ? 'px-5 py-8 sm:px-8' : 'px-5 py-10 sm:px-10 sm:py-12 lg:px-14'}`}>
                <Crown size={24} className="absolute left-2.5 top-2.5 sm:h-[30px] sm:w-[30px]"/>
                <Gem color="lilac" size={22} className="absolute right-2.5 top-3 sm:h-6 sm:w-7"/>
                <Gem color="sapphire" size={22} className="absolute bottom-3 left-2.5 sm:h-6 sm:w-7"/>
                <Crown size={24} className="absolute bottom-2.5 right-2.5 sm:h-[30px] sm:w-[30px]"/>
                {children}
            </div>
        </Tag>
    )
}

/**
 * The navy page behind the parchment: a centered column with room around it.
 * Most pages are: <RoyalPage><Parchment>…</Parchment></RoyalPage>.
 */
export function RoyalPage({children, width = 'max-w-6xl'}: { children: ReactNode, width?: string }) {
    return (
        <main className={`mx-auto w-full ${width} px-3 pb-14 pt-4 sm:px-8 sm:pt-6`}>
            {children}
        </main>
    )
}


// ── the wax seal ──

// the seal's melted, uneven edge (from the design's seal study)
const SEAL_EDGE = 'M112.2 54.6Q114.0 60.0 114.7 65.9Q115.4 71.8 110.6 76.1Q105.7 80.4 104.2 85.7Q102.6 91.0 99.1 95.3Q95.6 99.6 90.9 102.5Q86.2 105.4 81.8 109.5Q77.4 113.6 71.6 114.5Q65.8 115.4 60.1 114.3Q54.4 113.1 48.5 113.3Q42.6 113.5 38.2 109.5Q33.7 105.5 29.0 102.6Q24.3 99.6 20.8 95.3Q17.3 91.1 15.8 85.7Q14.4 80.3 9.6 76.0Q4.8 71.7 5.3 65.9Q5.7 60.0 8.5 54.8Q11.3 49.6 11.0 43.8Q10.7 38.0 14.2 33.7Q17.8 29.3 19.1 22.7Q20.5 16.1 25.6 12.8Q30.8 9.4 37.8 11.5Q44.9 13.5 49.7 10.4Q54.4 7.2 60.1 5.9Q65.8 4.6 70.9 7.7Q76.0 10.8 81.5 12.0Q87.1 13.1 91.6 16.5Q96.2 19.8 99.0 24.7Q101.8 29.6 107.1 33.1Q112.4 36.7 111.4 43.0Q110.4 49.3 112.2 54.6Z'
const SEAL_CROWN = 'M44 52h32l-3.4-17-7.6 6.6L60 30l-5 11.6-7.6-6.6z'

/** The gold wax seal artwork: an uneven melted edge, a pressed rim and an embossed crown with a pink jewel. */
function SealArt() {
    // gradient ids must be unique on the page, and the same on server and browser
    const id = useId().replace(/:/g, '')
    return (
        <svg aria-hidden="true" viewBox="0 0 120 120" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
                <radialGradient id={`${id}-wax`} cx="38%" cy="32%" r="75%">
                    <stop offset="0" stopColor="#f8e7a6"/><stop offset="0.5" stopColor="#D4AF37"/><stop offset="1" stopColor="#8a6a12"/>
                </radialGradient>
                <radialGradient id={`${id}-center`} cx="60%" cy="65%" r="70%">
                    <stop offset="0" stopColor="#f8e7a6"/><stop offset="0.55" stopColor="#D4AF37"/><stop offset="1" stopColor="#8a6a12"/>
                </radialGradient>
            </defs>
            <path d={SEAL_EDGE} fill="#6f540c" transform="translate(2 4)" opacity="0.55"/>
            <path d={SEAL_EDGE} fill={`url(#${id}-wax)`}/>
            <circle cx="60" cy="60" r="41" fill="none" stroke="#8a6a12" strokeWidth="3" opacity="0.7"/>
            <circle cx="60" cy="61" r="41" fill="none" stroke="#fff6d6" strokeWidth="1.2" opacity="0.6"/>
            <circle cx="60" cy="60" r="38" fill={`url(#${id}-center)`}/>
            <circle cx="60" cy="60" r="33" fill="none" stroke="#8a6a12" strokeWidth="0.9" strokeDasharray="1.5 2.5" opacity="0.8"/>
            <path d={SEAL_CROWN} fill="#fff6d6" opacity="0.7" transform="translate(0.8 1)"/>
            <path d={SEAL_CROWN} fill="#8a6a12" opacity="0.85"/>
            <circle cx="60" cy="29" r="2.4" fill="#8a6a12"/><circle cx="44.6" cy="34" r="2" fill="#8a6a12"/><circle cx="75.4" cy="34" r="2" fill="#8a6a12"/>
            <path d="M60 43l2.6 3-2.6 3.6-2.6-3.6z" fill="#FD6B6C" stroke="#6f540c" strokeWidth="0.8"/>
            <ellipse cx="44" cy="30" rx="10" ry="5" fill="#ffffff" opacity="0.18" transform="rotate(-30 44 30)"/>
        </svg>
    )
}

const sealClasses = 'group relative flex shrink-0 -rotate-6 items-center justify-center rounded-full drop-shadow-[0_10px_14px_rgba(3,17,54,0.35)] transition hover:-rotate-3 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60'
const sealText = 'relative mt-5 block text-center font-bold uppercase leading-[1.15] tracking-[0.08em] text-navy [text-shadow:0_1px_0_#fff6d6]'
const SEAL_SIZES = {small: 'h-[104px] w-[104px] text-[9px]', large: 'h-[150px] w-[150px] text-[11px]'}

/**
 * The gold wax seal as a link, for a page's one big action, e.g.
 * <WaxSealLink to="/create-trip">Decree<br/>a new<br/>trip</WaxSealLink>.
 * Keep the words short: they sit in the middle of the seal.
 */
export function WaxSealLink({to, children, size = 'large'}: { to: string, children: ReactNode, size?: keyof typeof SEAL_SIZES }) {
    return (
        <Link to={to} className={`${sealClasses} ${SEAL_SIZES[size]}`}>
            <SealArt/>
            <span className={sealText}>{children}</span>
        </Link>
    )
}

/**
 * The gold wax seal as a button, e.g. a form's submit button. Takes the same
 * props as <button>, so it can replace one without changing what it does.
 */
export function WaxSealButton({children, size = 'large', className = '', ...buttonProps}: {
    children: ReactNode, size?: keyof typeof SEAL_SIZES,
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button {...buttonProps} className={`${sealClasses} ${SEAL_SIZES[size]} ${className}`}>
            <SealArt/>
            <span className={sealText}>{children}</span>
        </button>
    )
}
