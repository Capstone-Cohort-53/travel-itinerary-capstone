import {Button, Navbar, NavbarBrand, NavbarCollapse, NavbarLink, NavbarToggle} from "flowbite-react";

export default function myTrips () {
    return (
        <>
            <section className={'px-45 py-25 font-serif grid grid-cols-1 md:grid-cols-2 gap-4'}>
                    <div className="md:col-span-1">
                        <section className={'my-10'}>
                            <h1 className={'text-3xl font-bold underline'}> My Trips </h1>
                            <div className="w-full max-w-lg overflow-hidden rounded-xl flex items-center mt-10">
                                <img className={'size-10 border-2 border-black rounded-xl mr-3'}
                                     src="plus-icon.png"
                                     alt="Add Icon"
                                />
                                <h2 className={'text-2xl'}> Create a New Trip! </h2>
                            </div>
                            <div className="w-full max-w-lg overflow-hidden rounded-xl flex items-center mt-5">
                                <img className={'size-10 border-2 border-black rounded-xl mr-3'}
                                     src="plus-icon.png"
                                     alt="Add Icon"
                                />
                                <h2 className={'text-2xl'}> Re-use a past itinerary! </h2>
                            </div>
                        </section>

                        <section className={'mt-10'}>
                            <div className="max-w-sm">
                                <button
                                        className="w-100 h-20 flex items-center text-center justify-center p-4 bg-blue-100 rounded-2xl my-2 hover:bg-blue-300 transition-colors font-medium text-blue-900">
                                    <span className="font-medium text-blue-900"> Trip Name * Location * Countdown </span>
                                    <svg id="arrow"
                                         className="w-5 h-5 text-gray-500 align-right transition-transform duration-300"
                                         fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                                <div id="contentBox"
                                     className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                                    <div className="text-gray-600 border-t border-gray-100 text-sm">
                                        This is the hidden container. It uses overflow-hidden to prevent layout jumps
                                        and max-height
                                        transitions to seamlessly roll down when triggered.
                                    </div>
                                </div>
                                <button
                                        className="w-100 h-20 flex items-center text-center justify-center p-4 bg-green-100 rounded-2xl my-2 hover:bg-green-300 transition-colors">
                                    <span
                                        className="flex items-center justify-items-center-safe text-center font-medium text-blue-900"> Trip Name * Location * Countdown  </span>
                                    <svg id="arrow"
                                         className="w-5 h-5 text-gray-500 align-right transition-transform duration-300"
                                         fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                                <div id="contentBox"
                                     className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                                    <div className="text-gray-600 border-t border-gray-100 text-sm">
                                        This is the hidden container. It uses overflow-hidden to prevent layout jumps
                                        and max-height
                                        transitions to seamlessly roll down when triggered.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="px-25">
                        <section className="md:col-span-2">
                            <h1 className={'text-3xl font-bold my-10 align-right justify-items-start max-w-[50%] underline'}> Trip Invites </h1>
                        </section>

                        <section>
                            <div className="max-w-sm">
                                <button
                                        className="w-100 h-20 flex items-center text-center justify-center p-4 bg-red-100 rounded-2xl my-10 hover:bg-red-300 transition-colors">
                                    <span
                                        className="flex items-center text-center justify-center font-medium text-blue-900"> Trip Name * Location * Countdown  </span>
                                    <svg id="arrow"
                                         className="w-5 h-5 text-gray-500 align-right transition-transform duration-300"
                                         fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                                <div id="contentBox"
                                     className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                                    <div className="p-4 text-gray-600 border-t border-gray-100 text-sm">
                                        This is the hidden container. It uses overflow-hidden to prevent layout jumps
                                        and max-height
                                        transitions to seamlessly roll down when triggered.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
            </section>
        </>
    )
}