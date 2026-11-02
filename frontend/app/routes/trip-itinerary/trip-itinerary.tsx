import { useState } from "react";
// add end time , make the activity match the sheet doc, this component will also need the associated activity invites

type RsvpStatus = "going" | "maybe" | "not" | null;

type ActivityInvite = {
    userId: number;
    numberAdults: number;
    numberMinors: number;
    rsvp: RsvpStatus;
};

type Activity = {
    id: number;
    tripId: number;
    name: string;
    startTime: string;
    endTime: string;
    description: string;
    location: string;
    address: string;
    cost: string;
    costPerPerson: string;
    notes: string;
    invites: ActivityInvite[];
};

type Day = {
    id: number;
    title: string;
    activities: Activity[];
};

export default function tripItinerary() {
    const [days, setDays] = useState<Day[]>([
        {
            id: 1,
            title: "Day 1",
            activities: [
                {
                    id: 1,
                    tripId: 1,
                    name: "Museum Visit",
                    startTime: "09:00",
                    endTime: "11:30",
                    description: "Guided tour of the main exhibits",
                    location: "City Museum",
                    address: "123 Main St",
                    cost: "$60",
                    costPerPerson: "$15",
                    notes: "Meet at the entrance",
                    invites: [
                        {userId: 1, numberAdults: 2, numberMinors: 1, rsvp: "going"},
                        {userId: 2, numberAdults: 1, numberMinors: 0, rsvp: "maybe"},
                    ],
                },
                {
                    id: 2,
                    tripId: 1,
                    name: "Lunch at Cafe",
                    startTime: "12:30",
                    endTime: "14:00",
                    description: "Casual lunch",
                    location: "Downtown Cafe",
                    address: "45 Oak Ave",
                    cost: "$80",
                    costPerPerson: "$20",
                    notes: "",
                    invites: [],
                },
            ],
        },
        {
            id: 2,
            title: "Day 2",
            activities: [
                {
                    id: 3,
                    tripId: 1,
                    name: "Hiking Trail",
                    startTime: "10:00",
                    endTime: "13:00",
                    description: "Moderate difficulty trail",
                    location: "Mountain Park",
                    address: "Trailhead Parking Lot",
                    cost: "Free",
                    costPerPerson: "$0",
                    notes: "Bring water and sunscreen",
                    invites: [],
                },
            ],
        },
    ]);

    const handleRsvp = (dayId: number, activityId: number, status: RsvpStatus) => {
        setDays((prev) =>
            prev.map((day) =>
                day.id === dayId
                    ? {
                        ...day,
                        activities: day.activities.map((act) =>
                            act.id === activityId
                                ? {
                                    ...act,
                                    invites:
                                        act.invites.length > 0
                                            ? act.invites.map((inv, i) =>
                                                i === 0 ? {...inv, rsvp: status} : inv
                                            )
                                            : [
                                                {
                                                    userId: 0,
                                                    numberAdults: 1,
                                                    numberMinors: 0,
                                                    rsvp: status,
                                                },
                                            ],
                                }
                                : act
                        ),
                    }
                    : day
            )
        );
    };

    const allInvites = days.flatMap((d) => d.activities.flatMap((a) => a.invites));
    const totalGoing = allInvites.filter((i) => i.rsvp === "going").length;
    const totalMaybe = allInvites.filter((i) => i.rsvp === "maybe").length;
    const totalNot = allInvites.filter((i) => i.rsvp === "not").length;
}