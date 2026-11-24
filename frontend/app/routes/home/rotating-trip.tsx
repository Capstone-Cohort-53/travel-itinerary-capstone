import {useEffect, useState} from "react";
import {emphasis} from "~/components/royal";

/**
 * The pink phrase in the landing headline, "Hear ye, hear ye: *the girls' trip*
 * is happening.", rotating through the kinds of trips TripsQueen plans.
 *
 * - Every phrase sits in the same spot, so the space is always the size of the
 *   longest one: the page never jumps as the words change.
 * - Screen readers hear one steady headline ("the girls' trip"), not a new
 *   phrase every few seconds.
 * - It stays still for people whose device asks for reduced motion, pauses
 *   while hovered, and has a pause button (text that changes on its own for
 *   more than 5 seconds needs a way to stop it: WCAG 2.2.2).
 */

// the first one is what screen readers hear and what shows before the page loads
export const TRIP_TYPES = [
    "the girls' trip",
    'the beach vacay',
    'the bachelorette trip',
    'the staycation',
    'the birthday getaway',
    'the spa weekend',
    'the wine weekend',
]

const SECONDS_EACH = 2.6

/** Whether the visitor's device asks for less motion; updates if they change the setting. */
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        setReduced(query.matches)
        const onChange = () => setReduced(query.matches)
        query.addEventListener('change', onChange)
        return () => query.removeEventListener('change', onChange)
    }, [])
    return reduced
}

/** Shared between the phrase and its pause button, so the button can sit outside the <h1>. */
export function useRotatingTrip() {
    const reducedMotion = usePrefersReducedMotion()
    const [index, setIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const isRotating = !reducedMotion && !isPaused && !isHovered

    useEffect(() => {
        if (!isRotating) return
        const timer = setInterval(() => setIndex((current) => (current + 1) % TRIP_TYPES.length), SECONDS_EACH * 1000)
        return () => clearInterval(timer)
    }, [isRotating])

    return {
        index,
        // reduced motion: no rotation, so no pause button either
        canPause: !reducedMotion,
        isPaused,
        togglePause: () => setIsPaused(!isPaused),
        hoverHandlers: {onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false)},
    }
}

/** The rotating pink phrase; goes inside the <h1>. */
export function RotatingTrip({index}: { index: number }) {
    return (
        <>
            {/* screen readers: one steady phrase */}
            <span className="sr-only">{TRIP_TYPES[0]}</span>

            {/* sighted visitors: every phrase stacked in one grid cell, sized to the longest; only the current one shows */}
            <span aria-hidden="true" className="grid justify-items-center">
                {TRIP_TYPES.map((trip, i) => (
                    <em key={trip}
                        className={`${emphasis} col-start-1 row-start-1 ${i === index ? 'animate-trip-in' : 'invisible'}`}>
                        {trip}
                    </em>
                ))}
            </span>
        </>
    )
}

/** Small pause / play button for the rotation; goes under the headline. */
export function RotationPauseButton({isPaused, onToggle}: { isPaused: boolean, onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle}
                className="-mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-bay hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:-mt-4">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                {isPaused ? <path d="M3 1.5v9l7.5-4.5z"/> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z"/>}
            </svg>
            {isPaused ? 'Play trip ideas' : 'Pause trip ideas'}
        </button>
    )
}
