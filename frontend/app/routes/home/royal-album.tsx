import {useState} from "react";
import {Gem} from "~/components/royal";

/**
 * "From the Royal Album": the landing page's photo carousel, from the design
 * (RD00 Landing). Four photos at a time on wider screens and two on phones (arrows under them),
 * gold arrow buttons to step through, and a dot per starting photo.
 *
 * The photos are free Unsplash photos (Unsplash License: free to use, no
 * credit required; credited below anyway), saved in public/album at 640×640.
 * To swap one, replace its file and update its caption and alt text here.
 */

type AlbumPhoto = {
    src: string,
    /** the short label on the photo */
    caption: string,
    /** what the photo shows, for screen readers */
    alt: string,
}

const PHOTOS: AlbumPhoto[] = [
    {src: '/album/toasting.jpg', caption: 'Raising a toast', alt: 'A group of women raising champagne flutes at a party'},
    {src: '/album/brunch.jpg', caption: 'Brunch for the court', alt: 'Friends reaching across a brunch table of waffles, eggs and coffee'},
    {src: '/album/pool-day.jpg', caption: 'Pool day', alt: 'A group of women relaxing at the edge of a swimming pool with a flamingo float'},
    {src: '/album/packing.jpg', caption: 'Packing the suitcase', alt: 'An open suitcase packed with clothes, a sun hat and travel essentials'},
    {src: '/album/night-out.jpg', caption: 'Night out', alt: 'Three women in sparkly outfits on a night out'},
    {src: '/album/road-trip.jpg', caption: 'Road trip', alt: 'Friends riding in a car with sunlight streaming through the windshield'},
]

/** Round gold arrow button, like the design's. */
function ArrowButton({direction, onClick, className = ''}: { direction: 'previous' | 'next', onClick: () => void, className?: string }) {
    return (
        <button type="button" onClick={onClick} aria-label={direction === 'previous' ? 'Previous photos' : 'Next photos'}
                className={`${className} h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-navy shadow-[0_4px_0_var(--color-gold-dark)] transition hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-gold-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-parchment sm:h-12 sm:w-12`}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={direction === 'previous' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}/>
            </svg>
        </button>
    )
}

export function RoyalAlbum() {
    // the photo the row starts on; the row wraps around to the beginning
    const [start, setStart] = useState(0)
    const count = PHOTOS.length
    const step = (by: number) => setStart((start + by + count) % count)
    // four in a row (two on phones: the last two are hidden by CSS below the sm breakpoint)
    const shown = Array.from({length: 4}, (_, offset) => PHOTOS[(start + offset) % count])

    return (
        <section aria-label="From the Royal Album: trip photos" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-royal-red">From the Royal Album</h2>
                <span aria-hidden="true" className="h-px flex-1 bg-lilac"/>
                <Gem color="pink" size={18}/>
            </div>

            <div className="flex items-center gap-2 sm:gap-3.5">
                {/* wider screens: arrows either side of the photos; phones: under them, beside the dots */}
                <ArrowButton direction="previous" onClick={() => step(-1)} className="hidden sm:flex"/>

                <ul className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
                    {shown.map((photo, offset) => (
                        <li key={`${photo.src}-${offset}`} className={offset >= 2 ? 'hidden sm:block' : ''}>
                            <figure className="relative m-0 h-[210px] overflow-hidden rounded-[18px] border-[3px] border-gold shadow-[0_10px_24px_rgba(3,17,54,0.25)] sm:h-[260px]">
                                <img src={photo.src} alt={photo.alt} width={640} height={640} loading="lazy"
                                     className="h-full w-full object-cover"/>
                                <figcaption className="absolute inset-x-2 bottom-3 flex justify-center">
                                    <span className="rounded-full bg-parchment/95 px-3 py-1.5 text-center text-xs font-semibold text-navy">
                                        {photo.caption}
                                    </span>
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>

                <ArrowButton direction="next" onClick={() => step(1)} className="hidden sm:flex"/>
            </div>

            {/* one dot per starting photo; the current one is a longer gold pill */}
            <div className="flex items-center justify-center gap-1">
                <ArrowButton direction="previous" onClick={() => step(-1)} className="mr-2 flex sm:hidden"/>
                {PHOTOS.map((photo, index) => (
                    <button key={photo.src} type="button" onClick={() => setStart(index)}
                            aria-label={`Show photos starting with ${photo.caption}`}
                            aria-pressed={index === start}
                            className="flex h-6 items-center justify-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-full">
                        <span aria-hidden="true" className={`block h-2.5 rounded-full transition-all ${index === start ? 'w-[26px] bg-gold' : 'w-2.5 bg-lilac'}`}/>
                    </button>
                ))}
                <ArrowButton direction="next" onClick={() => step(1)} className="ml-2 flex sm:hidden"/>
            </div>

            <p className="text-center text-[11px] text-bay">
                Photos from <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline hover:text-navy">
                Unsplash<span className="sr-only"> (opens in a new tab)</span></a>
            </p>
        </section>
    )
}
