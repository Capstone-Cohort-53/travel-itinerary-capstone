import {useEffect, useId, useState} from "react";
import {findTripIdeas, type IdeaCategory, type TripIdea, type TripIdeas} from "~/utils/trip-ideas";
import type {SearchArea} from "~/utils/place-search";
import {Gem} from "~/components/royal";

/**
 * "Need ideas?" on the Add Activity page: things to see, do, eat and drink at
 * the trip's destination, from Wikivoyage, in four tabs. Choosing one hands it
 * to `onPick`, which fills in the form; the organizer can change anything
 * before saving.
 *
 * Loads in the browser after the page shows, so the form never waits for it.
 * When the destination has no guide (or Wikivoyage can't be reached), the box
 * doesn't appear at all.
 *
 * Royal Decree look: a lilac-tinted panel on the parchment, a gold pill for the
 * chosen tab and parchment idea cards.
 */

const TABS: { category: IdeaCategory, label: string, emoji: string }[] = [
    {category: 'sights', label: 'Sights', emoji: '📸'},
    {category: 'culture', label: 'Culture', emoji: '🏛️'},
    {category: 'outdoors', label: 'Outdoors', emoji: '🏖️'},
    {category: 'food', label: 'Food & Drink', emoji: '🌮'},
]

// how many ideas a tab shows before "Show more"
const FIRST_SHOWN = 6

type NeedIdeasProps = SearchArea & {
    onPick: (idea: TripIdea) => void,
}

export function NeedIdeas({near, destination, onPick}: NeedIdeasProps) {
    const id = useId()
    const [result, setResult] = useState<TripIdeas | null | 'loading'>('loading')
    const [tab, setTab] = useState<IdeaCategory>('sights')
    const [showAll, setShowAll] = useState(false)
    const [isOpen, setIsOpen] = useState(true)
    const [picked, setPicked] = useState<string | null>(null)

    useEffect(() => {
        let isCurrent = true
        setResult('loading')
        void findTripIdeas({near, destination}).then((ideas) => {
            if (!isCurrent) return
            setResult(ideas)
            // start on the first tab that has something in it
            const first = TABS.find(({category}) => ideas?.ideas.some((idea) => idea.category === category))
            if (first) setTab(first.category)
        })
        return () => {
            isCurrent = false
        }
    }, [near?.lat, near?.lng, destination])

    // nothing to suggest: no box at all (after loading, so the page doesn't jump around twice)
    if (result === null) return null

    const tabs = result === 'loading' ? [] : TABS.filter(({category}) => result.ideas.some((idea) => idea.category === category))
    const ideas = result === 'loading' ? [] : result.ideas.filter((idea) => idea.category === tab)
    const shown = showAll ? ideas : ideas.slice(0, FIRST_SHOWN)

    return (
        <section aria-labelledby={`${id}-title`}
                 className="rounded-2xl border-[1.5px] border-navy bg-[#f6eff7] p-5 text-navy shadow-[5px_5px_0_var(--color-lilac)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-royal-red">Counsel for the court</p>
                    <h2 id={`${id}-title`} className="mt-1 flex items-center gap-2 font-display text-2xl font-bold italic">
                        Need ideas? <Gem color="pink" size={20}/>
                    </h2>
                    <p className="mt-1 text-sm text-bay">
                        Popular things to do in {destination?.trim() || 'this area'}. Pick one to fill in the form, then make it your own.
                    </p>
                </div>
                <button type="button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls={`${id}-body`}
                        className="inline-flex min-h-11 shrink-0 items-center rounded-full border-[1.5px] border-navy px-4 text-xs font-bold uppercase tracking-[0.14em] text-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment">
                    {isOpen ? 'Hide' : 'Show'}
                </button>
            </div>

            {isOpen && (
                <div id={`${id}-body`} className="mt-4">
                    {result === 'loading' ? (
                        <p className="text-sm italic text-bay" role="status">Finding ideas…</p>
                    ) : (
                        <>
                            {/* the four tabs; arrow keys move between them, as a tab list should */}
                            <div role="tablist" aria-label="Kinds of ideas" className="flex flex-wrap gap-2"
                                 onKeyDown={(event) => {
                                     if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                                     const index = tabs.findIndex(({category}) => category === tab)
                                     const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
                                     setTab(next.category)
                                     setShowAll(false)
                                     document.getElementById(`${id}-tab-${next.category}`)?.focus()
                                 }}>
                                {tabs.map(({category, label, emoji}) => {
                                    const selected = category === tab
                                    return (
                                        <button key={category} type="button" role="tab"
                                                id={`${id}-tab-${category}`}
                                                aria-selected={selected}
                                                aria-controls={`${id}-panel`}
                                                tabIndex={selected ? 0 : -1}
                                                onClick={() => {
                                                    setTab(category)
                                                    setShowAll(false)
                                                }}
                                                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-navy px-4 text-sm font-bold text-navy transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-parchment ${selected ? 'bg-gold shadow-[0_3px_0_var(--color-gold-dark)]' : 'bg-parchment hover:bg-white'}`}>
                                            <span aria-hidden="true">{emoji}</span> {label}
                                        </button>
                                    )
                                })}
                            </div>

                            <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="mt-4">
                                <ul className="grid gap-3 sm:grid-cols-2">
                                    {shown.map((idea) => (
                                        <li key={idea.id} className="min-w-0">
                                            <button type="button"
                                                    onClick={() => {
                                                        setPicked(idea.id)
                                                        onPick(idea)
                                                    }}
                                                    className="group flex h-full min-h-11 w-full flex-col rounded-xl border-[1.5px] border-navy bg-parchment px-4 py-3 text-left text-navy transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-lilac)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment">
                                                <span className="flex items-start justify-between gap-2">
                                                    <span className="min-w-0 break-words font-bold leading-snug">{idea.name}</span>
                                                    <span className={`shrink-0 rounded-full border border-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-navy ${picked === idea.id ? 'bg-lilac' : 'bg-transparent group-hover:bg-gold'}`}>
                                                        {picked === idea.id ? 'Added ✓' : '+ Use'}
                                                    </span>
                                                </span>
                                                {idea.description && (
                                                    <span className="mt-1 line-clamp-2 text-xs text-bay">{idea.description}</span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {ideas.length > FIRST_SHOWN && (
                                    <button type="button" onClick={() => setShowAll(!showAll)}
                                            className="mt-2 inline-flex min-h-11 items-center rounded-md px-1 text-sm font-bold text-royal-red underline decoration-[1.5px] underline-offset-4 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                                        {showAll ? 'Show fewer' : `Show all ${ideas.length}`}
                                    </button>
                                )}
                            </div>

                            {/* tells screen reader users the form was filled in */}
                            <p className="sr-only" aria-live="polite">
                                {picked ? 'Added to the form below. Change anything before you save.' : ''}
                            </p>

                            {/* Wikivoyage's text is CC BY-SA: credit it and link to the guide */}
                            <p className="mt-4 border-t border-lilac pt-3 text-xs text-bay">
                                Ideas from the <a href={result.pageUrl} target="_blank" rel="noreferrer" className="underline hover:text-navy">
                                Wikivoyage guide to {result.pageTitle}<span className="sr-only"> (opens in a new tab)</span></a>, shared under{' '}
                                <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline hover:text-navy">
                                    CC BY-SA<span className="sr-only"> (opens in a new tab)</span></a>.
                            </p>
                        </>
                    )}
                </div>
            )}
        </section>
    )
}
