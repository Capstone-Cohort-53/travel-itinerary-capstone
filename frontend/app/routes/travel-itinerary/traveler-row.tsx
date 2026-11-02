import {TableCell, TableRow} from "flowbite-react";
import type {Traveler} from "~/routes/travel-itinerary/travel-itinerary";

export function TravelerRow({traveler}: {traveler: Traveler}) {
    return (
        <>
        <TableRow>
            <TableCell>{traveler.name}</TableCell>
            <TableCell>{traveler.phone}</TableCell>
            <TableCell>{traveler.email}</TableCell>
            <TableCell>{traveler.going}</TableCell>
            <TableCell>{traveler.adults}</TableCell>
            <TableCell>{traveler.children}</TableCell>
        </TableRow>
        </>
    )
}