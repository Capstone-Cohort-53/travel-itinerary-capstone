import {TableCell, TableRow} from "flowbite-react";
import type {TripTraveler} from "~/utils/models/trip-invite.model";

export function TravelerRow({traveler}: {traveler: TripTraveler}) {
    const {invite, member, profile} = traveler
    return (
        <TableRow>
            <TableCell>{profile?.name ?? invite.name}</TableCell>
            <TableCell>{profile?.cellNumber ?? invite.cellNumber ?? ''}</TableCell>
            <TableCell>{profile?.email ?? invite.email ?? ''}</TableCell>
            <TableCell>{member?.going ?? invite.status}</TableCell>
            <TableCell>{member?.adults ?? 0}</TableCell>
            <TableCell>{member?.children ?? 0}</TableCell>
        </TableRow>
    )
}
