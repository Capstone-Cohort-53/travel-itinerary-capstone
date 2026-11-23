import {useEffect, useState} from "react";
import {useFetcher} from "react-router";
import {TableCell, TableRow} from "flowbite-react";
import type {TripTraveler} from "~/utils/models/trip-invite.model";
import type {FormActionResponse} from "~/utils/interfaces/FormActionResponse";

// invite status -> badge colors (Royal Decree): lilac accepted, peach pending
// (the team's peach, kept on Travelers & Invites), royal red declined, mist expired
const statusBadgeClasses: Record<TripTraveler['invite']['status'], string> = {
    accepted: 'bg-lilac text-navy',
    pending: 'bg-peach text-navy',
    declined: 'bg-royal-red text-white',
    expired: 'bg-mist text-navy',
}

export function InviteStatusBadge({status}: {status: TripTraveler['invite']['status']}) {
    return (
        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusBadgeClasses[status]}`}>
            {status}
        </span>
    )
}

type EditValues = { name: string, email: string, cellNumber: string }

const inputClass = 'block w-full min-w-0 rounded-xl border-[1.5px] border-navy bg-white px-3 py-2 text-sm text-navy placeholder:text-[#6b6f8f] focus:outline-none focus:ring-2 focus:ring-gold'
// small roster pills: still 44px tall so they are easy to tap on phones
const smallButton = 'inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment disabled:cursor-not-allowed disabled:opacity-50'
const smallOutline = `${smallButton} border-navy bg-white text-navy hover:bg-navy/5 focus-visible:ring-gold`
const smallPeach = `${smallButton} border-navy bg-peach text-navy hover:brightness-105 focus-visible:ring-navy`
const smallDanger = `${smallButton} border-royal-red bg-white text-royal-red hover:bg-royal-red/5 focus-visible:ring-royal-red`
const smallDangerSolid = `${smallButton} border-royal-red bg-royal-red text-white hover:brightness-110 focus-visible:ring-royal-red`

/**
 * What one roster row can do for the trip owner:
 * - Edit: only pending invites (accepted travelers' details come from their own profile)
 * - Remove: anyone except the owner themselves
 * Both post to the travel-itinerary action, which calls the API.
 */
function useRosterActions(traveler: TripTraveler, isOwner: boolean) {
    const {invite, member} = traveler
    const fetcher = useFetcher<FormActionResponse>()
    const isSending = fetcher.state !== 'idle'
    const [mode, setMode] = useState<'view' | 'edit' | 'confirm-remove'>('view')
    const [values, setValues] = useState<EditValues>({
        name: invite.name,
        email: invite.email ?? '',
        cellNumber: invite.cellNumber ?? '',
    })

    // close the edit row once the save worked (the page reloads its data on its own)
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data?.success) {
            setMode('view')
        }
    }, [fetcher.state, fetcher.data])

    return {
        canEdit: isOwner && invite.status === 'pending',
        canRemove: isOwner && member?.role !== 'owner',
        mode,
        setMode,
        values,
        setValue: (field: keyof EditValues, value: string) => setValues({...values, [field]: value}),
        isSending,
        error: fetcher.data && !fetcher.data.success ? fetcher.data.status.message : null,
        save: () => fetcher.submit({intent: 'edit-invite', inviteId: invite.id, ...values}, {method: 'post'}),
        remove: () => fetcher.submit({intent: 'remove-traveler', inviteId: invite.id}, {method: 'post'}),
        cancel: () => {
            setValues({name: invite.name, email: invite.email ?? '', cellNumber: invite.cellNumber ?? ''})
            setMode('view')
        },
    }
}

type RosterActions = ReturnType<typeof useRosterActions>

/** Edit / Remove buttons, or Save / Cancel while editing, or the "remove?" confirmation. */
function ActionButtons({actions, name}: { actions: RosterActions, name: string }) {
    const {mode, setMode, isSending, canEdit, canRemove} = actions
    if (mode === 'edit') {
        return (
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={actions.save} disabled={isSending}
                        className={smallPeach}>
                    {isSending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={actions.cancel} disabled={isSending}
                        className={smallOutline}>
                    Cancel
                </button>
            </div>
        )
    }
    if (mode === 'confirm-remove') {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-royal-red">Remove {name}?</span>
                <button type="button" onClick={actions.remove} disabled={isSending}
                        className={smallDangerSolid}>
                    {isSending ? 'Removing…' : 'Yes, remove'}
                </button>
                <button type="button" onClick={() => setMode('view')} disabled={isSending}
                        className={smallOutline}>
                    Cancel
                </button>
            </div>
        )
    }
    return (
        <div className="flex flex-wrap gap-2">
            {canEdit && (
                <button type="button" onClick={() => setMode('edit')} aria-label={`Edit ${name}`}
                        className={smallOutline}>
                    Edit
                </button>
            )}
            {canRemove && (
                <button type="button" onClick={() => setMode('confirm-remove')} aria-label={`Remove ${name}`}
                        className={smallDanger}>
                    Remove
                </button>
            )}
        </div>
    )
}

/** One traveler as a table row (tablet and desktop). The owner gets an Actions cell at the end. */
export function TravelerRow({traveler, isOwner}: { traveler: TripTraveler, isOwner: boolean }) {
    const {invite, member, profile} = traveler
    const actions = useRosterActions(traveler, isOwner)
    const name = profile?.name ?? invite.name
    const email = profile?.email ?? invite.email ?? ''
    const phone = profile?.cellNumber ?? invite.cellNumber ?? ''
    const isEditing = actions.mode === 'edit'
    return (
        <TableRow>
            {/* the name in Playfair, like the design's roster */}
            <TableCell className="font-display text-base font-semibold text-navy">
                {isEditing
                    ? <input aria-label="Name" className={inputClass} value={actions.values.name}
                             onChange={(event) => actions.setValue('name', event.target.value)}/>
                    : name}
            </TableCell>
            {/* email over phone. [overflow-wrap:anywhere] only breaks an email if there is truly no room;
                normally the table gives this column enough width to show it whole */}
            <TableCell className="[overflow-wrap:anywhere]">
                {isEditing ? (
                    <div className="flex flex-col gap-1">
                        <input aria-label="Email" type="email" placeholder="Email" className={inputClass} value={actions.values.email}
                               onChange={(event) => actions.setValue('email', event.target.value)}/>
                        <input aria-label="Phone number" type="tel" placeholder="Phone number" className={inputClass} value={actions.values.cellNumber}
                               onChange={(event) => actions.setValue('cellNumber', event.target.value)}/>
                    </div>
                ) : (
                    <>
                        {email && <p>{email}</p>}
                        {phone && <p className="whitespace-nowrap text-xs text-bay">{phone}</p>}
                    </>
                )}
            </TableCell>
            <TableCell className="whitespace-nowrap capitalize">{member?.going ?? '—'}</TableCell>
            <TableCell className="whitespace-nowrap"><InviteStatusBadge status={invite.status}/></TableCell>
            <TableCell className="text-center">{member?.adults ?? 0}</TableCell>
            <TableCell className="text-center">{member?.children ?? 0}</TableCell>
            {isOwner && (
                <TableCell>
                    <ActionButtons actions={actions} name={name}/>
                    {actions.error && <p role="alert" className="mt-1 text-xs font-medium text-royal-red">{actions.error}</p>}
                </TableCell>
            )}
        </TableRow>
    )
}

/** One traveler as a stacked row (phones), matching the mobile mockup. */
export function TravelerCard({traveler, isOwner}: { traveler: TripTraveler, isOwner: boolean }) {
    const {invite, member, profile} = traveler
    const actions = useRosterActions(traveler, isOwner)
    const name = profile?.name ?? invite.name
    const contact = profile?.email ?? invite.email ?? profile?.cellNumber ?? invite.cellNumber ?? ''
    const adults = member?.adults ?? 0
    const children = member?.children ?? 0
    return (
        <li className="border-b border-mist px-4 py-4 last:border-b-0">
            {actions.mode === 'edit' ? (
                // editing on a phone: the three fields stacked
                <div className="flex flex-col gap-2">
                    <input aria-label="Name" className={inputClass} value={actions.values.name} placeholder="Name"
                           onChange={(event) => actions.setValue('name', event.target.value)}/>
                    <input aria-label="Email" type="email" className={inputClass} value={actions.values.email} placeholder="Email"
                           onChange={(event) => actions.setValue('email', event.target.value)}/>
                    <input aria-label="Phone number" type="tel" className={inputClass} value={actions.values.cellNumber} placeholder="Phone number"
                           onChange={(event) => actions.setValue('cellNumber', event.target.value)}/>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words font-display text-lg font-semibold text-navy">{name}</p>
                        <InviteStatusBadge status={invite.status}/>
                    </div>
                    {contact && <p className="mt-0.5 break-all text-xs text-bay">{contact}</p>}
                    <p className="mt-0.5 text-xs text-navy">
                        RSVP: {member?.going ?? '—'} · {adults} {adults === 1 ? 'adult' : 'adults'} · {children} {children === 1 ? 'child' : 'children'}
                    </p>
                </>
            )}
            {(actions.canEdit || actions.canRemove) && (
                <div className="mt-3">
                    <ActionButtons actions={actions} name={name}/>
                </div>
            )}
            {actions.error && <p role="alert" className="mt-1 text-xs font-medium text-royal-red">{actions.error}</p>}
        </li>
    )
}
