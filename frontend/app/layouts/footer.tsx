import {Link} from "react-router"

// navy footer that matches the navbar: sunset stripes on top, then the logo,
// tagline and copyright line
export function FooterCap () {

    return(
    <footer>
        {/* retro sunset stripes above the bar, in the navbar's colors */}
        <div aria-hidden="true">
            <div className="h-2 bg-[#FF5A1F]"/>
            <div className="h-2 bg-[#FF8A85]"/>
            <div className="h-2 bg-[#C19AC5]"/>
            <div className="h-2 bg-[#3A4187]"/>
        </div>

        {/* phones: logo above the text, centered; wider screens: logo beside the text */}
        <div className="bg-[#0B1533]">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:gap-6 sm:px-8 sm:text-left">
                {/* the logo links home, like the navbar's */}
                <Link to="/">
                    <img src="/logo.png" alt="groupie.travel home" className="h-10 w-auto sm:h-12"/>
                </Link>
                <div>
                    <p className="text-lg font-bold text-white">Share your trips easily.</p>
                    <p className="text-sm text-white/70">© {new Date().getFullYear()} groupie.travel</p>
                </div>
            </div>
        </div>
    </footer>
    )

}
