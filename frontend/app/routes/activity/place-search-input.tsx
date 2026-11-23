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
    /** where the trip is, so nearby places come first; null searches everywhere */
    near: Coordinates | null,
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export function PlaceSearchInput({value, onChange, onPick, near, onBlur, onKeyDown, className, ...inputProps}: PlaceSearchInputProps) {
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
                const places = await searchPlaces(query, near, controller.signal)
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
    }, [value, near])

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
                    className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-xl border-2 border-[#031136] bg-white py-1 shadow-[4px_4px_0_#C9A3CB]">
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
                            className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 ${index === activeIndex ? 'bg-[#FBF3FA]' : ''}`}>
                            <span aria-hidden="true" className="mt-0.5 text-[#FF5903]">📍</span>
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-[#031136]">{place.name}</span>
                                {place.detail && <span className="block truncate text-xs text-[#434A90]">{place.detail}</span>}
                            </span>
                        </li>
                    ))}
                    {/* Photon's data comes from OpenStreetMap, which asks for this credit */}
                    <li role="presentation" className="border-t border-[#ECE9F3] px-3 pt-1.5 pb-1 text-[10px] text-gray-500">
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
