import { useState } from "react";

// RSVP choices, listed once and used for both the type and the buttons.
const RSVP_OPTIONS = ["Going", "Maybe", "Not Going"] as const;
type RSVPStatus = typeof RSVP_OPTIONS[number];

type FamilyMember = {
    id: number;
    name: string;
};

// Activity Invite
type ActivityInvite = {
    user_id: number;
    activity_id: number;
    children: number[];
    adults: number[];
    going: RSVPStatus;
};

// Matches the ACTIVITY table.
type Activity = {
    id: number;
    trip_id: number;
    name: string;
    start_time: string;
    end_time: string;
    description: string;
    location: string;
    address: string;
    lat: number;
    lng: number;
    cost: number;
    notes: string;
    cost_per_person: number;
};

// Sample activity data. Later this can come from our database.
const activity: Activity = {
    id: 1,
    trip_id: 1,
    name: "Family Welcome Dinner",
    start_time: "2026-10-24T18:00:00",
    end_time: "2026-10-24T20:00:00",
    description: "Join the family for our welcome dinner to kick off the reunion weekend.",
    location: "Family Dinner Restaurant",
    address: "123 Main Street, Albuquerque, NM",
    lat: 35.0844,
    lng: -106.6504,
    cost: 0,
    notes: "Casual attire. Parking is available near the entrance.",
    cost_per_person: 35,
};

// Sample user contact information.
const userEmail = "user@example.com";

// Sample family data. Later this can come from our database.
const familyAdults: FamilyMember[] = [
    { id: 1, name: "Penelope Martinez" },
];
const familyChildren: FamilyMember[] = [
    { id: 2, name: "Emma Martinez" },
    { id: 3, name: "Noah Martinez" },
];

// Format start_time / end_time for display.
function formatDate(time: string) {
    return new Date(time).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(time: string) {
    return new Date(time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function ActivityDetails() {

    // The current user's invite for this activity.
    const [invite, setInvite] = useState<ActivityInvite>({
        user_id: 1,
        activity_id: activity.id,
        children: [2, 3],
        adults: [1],
        going: "Going",
    });

    // Tracks whether the RSVP has been submitted.
    const [isSaved, setIsSaved] = useState(false);

    // Update one field of the invite.
    function updateInvite(changes: Partial<ActivityInvite>) {
        setInvite(previous => ({ ...previous, ...changes }));
        setIsSaved(false);
    }

    // Add or remove a family member from the adults or children list.
    function toggleMember(group: "adults" | "children", id: number) {
        const list = invite[group];
        updateInvite({
            [group]: list.includes(id) ? list.filter(memberId => memberId !== id) : [...list, id],
        });
    }

    // Temporarily save the invite in React state.
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaved(true);
        console.log("Submitted RSVP:", invite);
    }

    return (
        <main className="min-h-screen bg-white px-5 py-10 text-[#031136] md:px-10 lg:px-16">

            <div className="mx-auto max-w-7xl">

                {/* BACK LINK */}
                <a
                    href="#"
                    className="mb-6 inline-block text-sm text-[#434A90] hover:underline"
                >
                    ← Back to Itinerary
                </a>

                {/* PAGE HEADER */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold md:text-4xl">
                        {activity.name}
                    </h1>
                    <p className="mt-2 text-[#434A90]">
                        Martinez Family Reunion
                    </p>
                </header>

                {/* MAIN TWO-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

                    {/* LEFT: ACTIVITY DETAILS */}
                    <section className="space-y-10 lg:col-span-2">

                        <div>
                            <h2 className="mb-5 text-2xl font-semibold">
                                Activity Overview
                            </h2>

                            {/* DATE / TIME / TYPE */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                <div className="rounded-lg bg-[#031136]/5 p-5">
                                    <p className="mb-2 text-xs uppercase tracking-wider text-[#434A90]">
                                        Date
                                    </p>
                                    <p className="font-medium">
                                        {formatDate(activity.start_time)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-[#031136]/5 p-5">
                                    <p className="mb-2 text-xs uppercase tracking-wider text-[#434A90]">
                                        Time
                                    </p>
                                    <p className="font-medium">
                                        {formatTime(activity.start_time)} – {formatTime(activity.end_time)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-[#031136]/5 p-5">
                                    <p className="mb-2 text-xs uppercase tracking-wider text-[#434A90]">
                                        Activity Type
                                    </p>
                                    <p className="font-medium">
                                        Core Activity
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* LOCATION */}
                        <div>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#434A90]">
                                Location
                            </h3>

                            <div className="flex gap-5 rounded-lg border border-[#C7A2CB]/50 p-5">
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-[#434A90]/10 text-sm text-[#434A90]">
                                    Map Pin
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold">
                                        {activity.location}
                                    </h4>
                                    <p className="mt-2 text-sm text-[#434A90]">
                                        {activity.address}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#434A90]">
                                Description
                            </h3>
                            <p className="leading-7">
                                {activity.description}
                            </p>
                        </div>

                        {/* COST AND LOGISTICS */}
                        <div>
                            <h2 className="mb-5 text-2xl font-semibold">
                                Cost and Logistics
                            </h2>

                            <div className="overflow-hidden rounded-lg border border-[#C7A2CB]/50">

                                <div className="grid gap-2 border-b border-[#C7A2CB]/50 p-4 sm:grid-cols-2">
                                    <p className="font-medium">
                                        Estimated Cost Per Person
                                    </p>
                                    <p>${activity.cost_per_person} per person</p>
                                </div>

                                <div className="grid gap-2 border-b border-[#C7A2CB]/50 p-4 sm:grid-cols-2">
                                    <p className="font-medium">
                                        Total Cost
                                    </p>
                                    <p>${activity.cost}</p>
                                </div>

                                <div className="grid gap-2 p-4 sm:grid-cols-2">
                                    <p className="font-medium">
                                        Event Notes / What to Bring
                                    </p>
                                    <p>
                                        {activity.notes}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* USER CONTACT */}
                        <div>
                            <h2 className="mb-4 text-2xl font-semibold">
                                Organizer
                            </h2>

                            <div className="rounded-lg bg-[#031136]/5 p-5">
                                <p className="font-semibold">
                                    Organizer Name
                                </p>
                                <a
                                    href={`mailto:${userEmail}`}
                                    className="mt-2 inline-block text-sm text-[#434A90] hover:underline"
                                >
                                    {userEmail}
                                </a>
                            </div>
                        </div>

                    </section>

                    {/* RIGHT: RSVP FORM */}
                    <aside className="lg:col-span-1">

                        <div className="overflow-hidden rounded-xl border border-[#434A90]/30">

                            <div className="bg-[#031136] p-6 text-white">
                                <h2 className="text-2xl font-semibold">
                                    Will you attend?
                                </h2>
                                <p className="mt-2 text-sm text-white/80">
                                    Respond once for your family.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">

                                {/* GOING / MAYBE / NOT GOING */}
                                <fieldset className="border-b border-[#C7A2CB]/50 pb-5">
                                    <legend className="mb-3 text-lg font-semibold">
                                        Your response
                                    </legend>

                                    <div className="flex flex-wrap gap-2">
                                        {RSVP_OPTIONS.map(option => (
                                            <label
                                                key={option}
                                                className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                                                    invite.going === option
                                                        ? "border-[#434A90] bg-[#434A90] text-white"
                                                        : "border-[#C7A2CB] bg-white hover:bg-[#C7A2CB]/20"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="going"
                                                    value={option}
                                                    checked={invite.going === option}
                                                    onChange={() => updateInvite({ going: option })}
                                                    className="sr-only"
                                                />
                                                {option}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                {/* WHO IS INCLUDED */}
                                {([
                                    ["adults", "Adults", familyAdults],
                                    ["children", "Children", familyChildren],
                                ] as const).map(([group, label, members]) => (
                                    <fieldset key={group} className="mt-5">
                                        <legend className="mb-2 font-semibold">
                                            {label}
                                        </legend>

                                        <div className="space-y-2">
                                            {members.map(person => (
                                                <label key={person.id} className="flex cursor-pointer items-center gap-3 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={invite[group].includes(person.id)}
                                                        onChange={() => toggleMember(group, person.id)}
                                                        className="h-4 w-4 accent-[#434A90]"
                                                    />
                                                    {person.name}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                ))}

                                {/* SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    className="mt-6 w-full rounded-lg bg-[#FF5903] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#031136]"
                                >
                                    Submit RSVP
                                </button>

                                {/* SUCCESS MESSAGE */}
                                {isSaved && (
                                    <div
                                        role="status"
                                        className="mt-5 rounded-lg border border-[#434A90]/30 bg-[#434A90]/5 p-4"
                                    >
                                        <p className="font-semibold">
                                            Your RSVP has been saved.
                                        </p>
                                        <p className="mt-1 text-sm">
                                            Change a response anytime and submit again.
                                        </p>
                                    </div>
                                )}

                            </form>

                            {/* CONTACT USER */}
                            <a
                                href={`mailto:${userEmail}`}
                                className="block px-6 pb-6 text-center text-sm font-medium text-[#434A90] underline"
                            >
                                Contact Organizer
                            </a>

                        </div>

                    </aside>

                </div>
            </div>
        </main>
    );
}
