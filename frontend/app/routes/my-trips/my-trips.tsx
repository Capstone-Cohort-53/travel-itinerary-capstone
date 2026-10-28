export default function myTrips () {
    return (
        <>

        <section className={'px-35 py-25 bg-[#C7A2CB] font-serif'}>

            <section className={'left-column-information align-left'}>
                <h1 className={'text-3xl font-bold'}> My Trips </h1>
                    <div className="w-full max-w-lg overflow-hidden rounded-xl flex items-center">
                        <img className={'size-10'}
                            src="plus-icon.png"
                            alt="Add Icon"
                        />
                    <h2 className={'text-2xl'}> Create a New Trip! </h2>
                    </div>
                    <div>
                    <h2 className={'text-2xl m-15'}> Re-use a past itinerary! </h2>
                    </div>
                </section>

                <section>
                    <div className="max-w-md rounded-xl overflow-hidden">
                        <button onClick={'toggle-box()'}
                                className="w-125 h-25 flex items-center text-center p-4 bg-purple-100 rounded-xl my-15 hover:bg-purple-300 transition-colors">
                        <span className="flex items-center text-center justify-center font-medium text-gray-900"> Balloon Fiesta 2027! </span>
                        <svg id="arrow" className="w-5 h-5 text-gray-500 align-right transition-transform duration-300"
                             fill="none"
                             viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <div id="contentBox" className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                        <div className="text-gray-600 border-t border-gray-100 text-sm">
                            This is the hidden container. It uses overflow-hidden to prevent layout jumps and max-height transitions to seamlessly roll down when triggered.
                        </div>
                    </div>

                    {/*<script>*/}
                    {/*    function toggleBox() {*/}
                    {/*    const box = document.getElementById('contentBox');*/}
                    {/*    const arrow = document.getElementById('arrow');*/}

                    {/*    if (box.classList.contains('max-h-0')) {*/}
                    {/*    box.classList.remove('max-h-0');*/}
                    {/*    box.classList.add('max-h-40'); // Set a max-height large enough for your text*/}
                    {/*    arrow.classList.add('rotate-180');*/}
                    {/*} else {*/}
                    {/*    box.classList.remove('max-h-40');*/}
                    {/*    box.classList.add('max-h-0');*/}
                    {/*    arrow.classList.remove('rotate-180');*/}
                    {/*}*/}
                    {/*</script>*/}

                </div>

            </section>
            </section>
            <section>
                <h1 className={'text-3xl font-bold my-10 align-right justify-items-start w-[50%]'}> Trip Invites </h1>
            </section>

            <section>
                <div className="max-w-md bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <button onClick={'toggle-box()'}
                            className="w-125 h-25 flex items-center text-center p-4 bg-gray-50 rounded-xl my-15 hover:bg-gray-100 transition-colors">
                        <span className="flex items-center text-center justify-center font-medium text-gray-900"> Balloon Fiesta 2027! </span>
                        <svg id="arrow" className="w-5 h-5 text-gray-500 align-right transition-transform duration-300"
                             fill="none"
                             viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <div id="contentBox" className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                        <div className="p-4 text-gray-600 border-t border-gray-100 text-sm">
                            This is the hidden container. It uses overflow-hidden to prevent layout jumps and max-height transitions to seamlessly roll down when triggered.
                        </div>
                    </div>
                </div>

            </section>

        </>
)
}


