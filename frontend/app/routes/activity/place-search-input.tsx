import {useEffect, useId, useRef, useState, type InputHTMLAttributes} from "react";
import {searchPlaces, type Coordinates, type PlaceSuggestion} from "~/utils/place-search";

/**
 * The Location Name box with place suggestions: as the organizer types, a
 * list of matching places from Photon drops down; picking one hands it to
 * `onPick`, which fills in the address boxes. Typing a name by hand still
 * works the same as a plain text box.
 *
 * Keyboard: ↓/↑ move through the list, Enter picks, Escape closes it.
 * Built as an ARIA combobox so screen readers announce the suggestions.
 */

const MIN_LETTERS = 3
const DEBOUNCE_MS = 300

type PlaceSearchInputProps = {
    value: string,
    onChange: (value: string) => void,
    onPick: (place: PlaceSuggestion) => void,
    /** a pin on this trip, to tell apart destinations with the same name; null when there isn't one yet */
    near: Coordinates | null,
    /** the trip's destination (e.g. "Cancun, MX"): places there are suggested first */
    destination: string | null,
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export function PlaceSearchInput({value, onChange, onPick, near, destination, onBlur, onKeyDown, className, ...inputProps}: PlaceSearchInputProps) {
    const listId = useId()
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [isSearching, setIsSearching] = useState(false)
    // only search after the organizer types, not for the saved name an Edit page starts with
    const hasTyped = useRef(false)

    // look places up a moment after typing stops; a newer search cancels the one before it
    useEffect(() => {
        const query = value.trim()
        if (!hasTyped.current || query.length < MIN_LETTERS) {
            setSuggestions([])
            return
        }
        const controller = new AbortController()
        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const places = await searchPlaces(query, {near, destination}, controller.signal)
                setSuggestions(places)
                setActiveIndex(-1)
                setIsOpen(true)
            } catch {
                // aborted, or Photon couldn't be reached: no suggestions, typing still works
                if (!controller.signal.aborted) setSuggestions([])
            } finally {
                if (!controller.signal.aborted) setIsSearching(false)
            }
        }, DEBOUNCE_MS)
        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [value, near, destination])

    const showList = isOpen && suggestions.length > 0

    function pick(place: PlaceSuggestion) {
        hasTyped.current = false
        setIsOpen(false)
        setSuggestions([])
        onPick(place)
    }

    return (
        <div className="relative">
            <input
                {...inputProps}
                type="text"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={listId}
                aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                value={value}
                className={className}
                onChange={(event) => {
                    hasTyped.current = true
                    onChange(event.target.value)
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={(event) => {
                    setIsOpen(false)
                    onBlur?.(event)
                }}
                onKeyDown={(event) => {
                    if (showList && event.key === 'ArrowDown') {
                        event.preventDefault()
                        setActiveIndex((index) => (index + 1) % suggestions.length)
                    } else if (showList && event.key === 'ArrowUp') {
                        event.preventDefault()
                        setActiveIndex((index) => (index <= 0 ? suggestions.length : index) - 1)
                    } else if (showList && event.key === 'Enter' && activeIndex >= 0) {
                        // pick the highlighted place instead of submitting the form
                        event.preventDefault()
                        pick(suggestions[activeIndex])
                    } else if (event.key === 'Escape') {
                        setIsOpen(false)
                    }
                    onKeyDown?.(event)
                }}
            />

            {showList && (
                <ul id={listId} role="listbox" aria-label="Suggested places"
                    className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-xl border-[1.5px] border-navy bg-parchment py-1 shadow-[4px_4px_0_var(--color-lilac)]">
                    {suggestions.map((place, index) => (
                        <li key={place.id}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            // mousedown, not click: it fires before the input loses focus and closes the list
                            onMouseDown={(event) => {
                                event.preventDefault()
                                pick(place)
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`flex min-h-11 cursor-pointer items-start gap-3 px-3 py-2.5 ${index === activeIndex ? 'bg-lilac/40' : ''}`}>
                            {/* a small map pin: pink with a navy outline */}
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="#FD6B6C" stroke="#031136"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/>
                                <circle cx="12" cy="10" r="2.5" fill="#FFFAF7"/>
                            </svg>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-navy">{place.name}</span>
                                {place.detail && <span className="block truncate text-xs text-bay">{place.detail}</span>}
                            </span>
                        </li>
                    ))}
                    {/* Photon's data comes from OpenStreetMap, which asks for this credit */}
                    <li role="presentation" className="border-t border-lilac px-3 pt-1.5 pb-1 text-[11px] text-bay">
                        Suggestions by Photon · © OpenStreetMap contributors
                    </li>
                </ul>
            )}

            {/* tells screen reader users when suggestions arrive */}
            <p className="sr-only" aria-live="polite">
                {isSearching ? '' : showList ? `${suggestions.length} suggested places. Use the arrow keys to choose one.` : ''}
            </p>
        </div>
    )
}
