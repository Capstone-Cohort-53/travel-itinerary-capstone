import {TableCell, TableRow} from "flowbite-react";
import type {TripTraveler} from "~/utils/models/trip-invite.model";

// invite status -> badge colors: green accepted, light orange pending, light red declined
const statusBadgeClasses: Record<TripTraveler['invite']['status'], string> = {
    accepted: 'bg-green-100 text-green-800',
    pending: 'bg-orange-100 text-orange-800',
    declined: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-700',
}

export function InviteStatusBadge({status}: {status: TripTraveler['invite']['status']}) {
    return (
        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${statusBadgeClasses[status]}`}>
            {status}
        </span>
    )
}

/** One traveler as a table row (tablet and desktop). */
export function TravelerRow({traveler}: {traveler: TripTraveler}) {
    const {invite, member, profile} = traveler
    return (
        <TableRow>
            <TableCell className="font-bold text-[#0B1533]">{profile?.name ?? invite.name}</TableCell>
            <TableCell>{profile?.cellNumber ?? invite.cellNumber ?? ''}</TableCell>
            <TableCell className="break-all">{profile?.email ?? invite.email ?? ''}</TableCell>
            <TableCell className="capitalize">{member?.going ?? '—'}</TableCell>
            <TableCell><InviteStatusBadge status={invite.status}/></TableCell>
            <TableCell>{member?.adults ?? 0}</TableCell>
            <TableCell>{member?.children ?? 0}</TableCell>
        </TableRow>
    )
}

/** One traveler as a stacked row (phones), matching the mobile mockup. */
export function TravelerCard({traveler}: {traveler: TripTraveler}) {
    const {invite, member, profile} = traveler
    const contact = profile?.email ?? invite.email ?? profile?.cellNumber ?? invite.cellNumber ?? ''
    const adults = member?.adults ?? 0
    const children = member?.children ?? 0
    return (
        <li className="border-b border-[#F7EEF6] px-4 py-3 last:border-b-0">
            <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-words font-bold text-[#0B1533]">{profile?.name ?? invite.name}</p>
                <InviteStatusBadge status={invite.status}/>
            </div>
            {contact && <p className="break-all text-xs text-[#3A4187]">{contact}</p>}
            <p className="text-xs text-[#0B1533]">
                RSVP: {member?.going ?? '—'} · {adults} {adults === 1 ? 'adult' : 'adults'} · {children} {children === 1 ? 'child' : 'children'}
            </p>
        </li>
    )
}
