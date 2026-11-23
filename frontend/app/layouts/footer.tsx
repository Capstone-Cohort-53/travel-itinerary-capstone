import {Link} from "react-router"
import {Signature} from "~/components/royal"

// navy footer that matches the navbar: the TripsQueen signature, tagline and copyright line
export function FooterCap () {

    return(
    <footer>
        {/* phones: signature above the text, centered; wider screens: signature beside the text */}
        <div className="border-t border-bay bg-navy">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:gap-6 sm:px-8 sm:text-left">
                {/* the signature links home, like the navbar's wordmark */}
                <Link to="/" aria-label="TripsQueen home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    <Signature/>
                </Link>
                <div>
                    <p className="font-display text-lg italic text-white">Share your trips easily.</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lilac">© {new Date().getFullYear()} TripsQueen</p>
                </div>
            </div>
        </div>
    </footer>
    )

}
