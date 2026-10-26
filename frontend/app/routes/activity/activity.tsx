
import type { FormEvent } from "react";

export default function Activity() {

    // SAVE ACTIVITY FUNCTION

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {

        // Prevent browser from refreshing the page
        event.preventDefault();

        // Read all form values using each input's "name"
        const formData = new FormData(event.currentTarget);
        const activityData = {
            ...Object.fromEntries(formData),
            collectAttendance: formData.has("collectAttendance")
        };

        // Check that end time is after start time
        if (String(formData.get("endTime")) <= String(formData.get("startTime"))) {
            alert("End time must be after start time.");
            return;
        }

        // Temporary: view data in browser console
        console.log("Activity Data:", activityData);

        alert("Activity form validated! Backend saving will be added later.");
    };


    // JSX - ACTIVITY PAGE LAYOUT

    return (
        <main className="w-full px-4 py-8 bg-gray-50 min-h-screen">

            {/* ======================================
                PAGE HEADING
            ====================================== */}

            <header className="mb-8">

                <h1 className="text-3xl font-bold text-[#031136]">
                    Add Activity
                </h1>

                <h2 className="text-lg font-semibold text-[#434A90] mt-2">
                    Martinez Family Reunion
                </h2>

                <p className="text-sm text-gray-600 mt-2">
                    Add an event to your shared trip itinerary.
                </p>

                {/* Orange accent line */}
                <div className="w-16 h-1 bg-[#FF5903] mt-4 rounded-full"></div>

            </header>

            {/* ======================================
                ACTIVITY FORM
            ====================================== */}

            <form
                onSubmit={handleSubmit}
                className="max-w-4xl space-y-8"
            >

                {/* ==============================
                    BASIC ACTIVITY INFORMATION
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Basic Activity Information
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    {/* Activity Name */}
                    <div className="mb-5">

                        <label
                            htmlFor="activityName"
                            className="block text-sm font-medium text-[#031136] mb-2"
                        >
                            Activity Name *
                        </label>

                        <input
                            id="activityName"
                            name="activityName"
                            type="text"
                            required
                            placeholder="Family Welcome Dinner"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                        />

                    </div>

                    {/* Activity Type */}
                    <fieldset className="mb-5">

                        <legend className="block text-sm font-medium text-[#031136] mb-3">
                            Activity Type *
                        </legend>

                        <div className="flex flex-wrap gap-6">

                            <label className="flex items-center gap-2 text-sm text-[#031136]">

                                <input
                                    type="radio"
                                    name="activityType"
                                    value="mandatory"
                                    defaultChecked
                                    className="accent-[#434A90]"
                                />

                                Mandatory

                            </label>

                            <label className="flex items-center gap-2 text-sm text-[#031136]">

                                <input
                                    type="radio"
                                    name="activityType"
                                    value="optional"
                                    className="accent-[#434A90]"
                                />

                                Optional

                            </label>

                        </div>

                    </fieldset>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

                        {/* Activity Date */}
                        <div>

                            <label
                                htmlFor="activityDate"
                                className="block text-sm font-medium text-[#031136] mb-2"
                            >
                                Activity Date *
                            </label>

                            <input
                                id="activityDate"
                                name="activityDate"
                                type="date"
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                            />

                        </div>

                        {/* Start Time */}
                        <div>

                            <label
                                htmlFor="startTime"
                                className="block text-sm font-medium text-[#031136] mb-2"
                            >
                                Start Time *
                            </label>

                            <input
                                id="startTime"
                                name="startTime"
                                type="time"
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                            />

                        </div>

                        {/* End Time */}
                        <div>

                            <label
                                htmlFor="endTime"
                                className="block text-sm font-medium text-[#031136] mb-2"
                            >
                                End Time *
                            </label>

                            <input
                                id="endTime"
                                name="endTime"
                                type="time"
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                            />

                        </div>

                    </div>

                    {/* Description */}
                    <div>

                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-[#031136] mb-2"
                        >
                            Description (optional)
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            placeholder="Join the family for our welcome dinner to kick off the reunion weekend."
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                        />

                    </div>

                </section>

                {/* ==============================
                    LOCATION
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Location
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Map Placeholder */}
                        <div className="md:col-span-1">

                            <div className="h-40 md:h-full min-h-40 bg-gray-100 border-2 border-dashed border-[#C7A2CB] rounded-lg flex flex-col items-center justify-center">

                                <span className="text-3xl mb-2">📍</span>

                                <p className="text-xs text-gray-500">
                                    Map Preview
                                </p>

                            </div>

                        </div>

                        {/* Location Form Fields */}
                        <div className="md:col-span-3 space-y-4">

                            {/* Location Name */}
                            <div>

                                <label
                                    htmlFor="locationName"
                                    className="block text-sm font-medium text-[#031136] mb-2"
                                >
                                    Location Name
                                </label>

                                <input
                                    id="locationName"
                                    name="locationName"
                                    type="text"
                                    placeholder="Family Dinner Restaurant"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                                />

                            </div>

                            {/* Street Address */}
                            <div>

                                <label
                                    htmlFor="streetAddress"
                                    className="block text-sm font-medium text-[#031136] mb-2"
                                >
                                    Street Address
                                </label>

                                <input
                                    id="streetAddress"
                                    name="streetAddress"
                                    type="text"
                                    placeholder="123 Main Street"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                                />

                            </div>

                            {/* City, State, ZIP */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                <div>

                                    <label
                                        htmlFor="city"
                                        className="block text-sm font-medium text-[#031136] mb-2"
                                    >
                                        City
                                    </label>

                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        placeholder="Albuquerque"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                                    />

                                </div>

                                <div>

                                    <label
                                        htmlFor="state"
                                        className="block text-sm font-medium text-[#031136] mb-2"
                                    >
                                        State
                                    </label>

                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        placeholder="NM"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                                    />

                                </div>

                                <div>

                                    <label
                                        htmlFor="zip"
                                        className="block text-sm font-medium text-[#031136] mb-2"
                                    >
                                        ZIP
                                    </label>

                                    <input
                                        id="zip"
                                        name="zip"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="87101"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ==============================
                    COST AND LOGISTICS
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Cost and Logistics
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

                        {/* Estimated Cost */}
                        <div>

                            <label
                                htmlFor="estimatedCost"
                                className="block text-sm font-medium text-[#031136] mb-2"
                            >
                                Estimated Cost Per Person
                            </label>

                            <input
                                id="estimatedCost"
                                name="estimatedCost"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="35.00"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                            />

                        </div>

                        {/* Cost Notes */}
                        <div>

                            <label
                                htmlFor="costNotes"
                                className="block text-sm font-medium text-[#031136] mb-2"
                            >
                                Cost Notes
                            </label>

                            <input
                                id="costNotes"
                                name="costNotes"
                                type="text"
                                placeholder="Guests pay for their own meals."
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                            />

                        </div>

                    </div>

                    {/* Event Notes */}
                    <div>

                        <label
                            htmlFor="eventNotes"
                            className="block text-sm font-medium text-[#031136] mb-2"
                        >
                            Event Notes / What to Bring
                        </label>

                        <textarea
                            id="eventNotes"
                            name="eventNotes"
                            rows={3}
                            placeholder="Casual attire. Parking is available near the entrance."
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#434A90]"
                        />

                    </div>

                </section>

                {/* ==============================
                    WHO'S COMING?
                ============================== */}

                <section className="bg-white rounded-xl border border-gray-200 p-6">

                    <h2 className="text-xl font-semibold text-[#434A90]">
                        Who's Coming?
                    </h2>

                    <div className="h-px bg-[#C7A2CB] mt-3 mb-6"></div>

                    <label className="flex items-start gap-3 cursor-pointer">

                        <input
                            type="checkbox"
                            name="collectAttendance"
                            defaultChecked
                            className="mt-1 h-5 w-5 accent-[#434A90]"
                        />

                        <span className="text-sm text-[#031136]">
                            Collect Attendance for this activity?
                            <span className="block text-gray-500 mt-1">
                                Travelers can respond Going, Not Going, or Maybe.
                            </span>
                        </span>

                    </label>

                </section>

                {/* ==============================
                    FORM BUTTONS
                ============================== */}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pb-8">

                    {/* Cancel Button */}
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-8 py-3 rounded-lg border-2 border-[#434A90] text-[#434A90] font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>

                    {/* Save Activity Button */}
                    <button
                        type="submit"
                        className="px-8 py-3 rounded-lg bg-[#FF5903] text-white font-semibold hover:bg-[#031136] transition-colors"
                    >
                        Save Activity
                    </button>

                </div>

            </form>

        </main>
    );
}
