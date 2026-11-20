# Member API: Status & Plan

_Last updated: 2026-11-20 (after pulling `516f0b7`)_

This doc tracks where the **member** feature stands across the backend (Express) and the frontend (React Router), and what is left to do.

---

## How the pieces fit together

```
Frontend page (loader / action)  →  frontend model function  →  getRequest / postRequest  →  Backend route  →  controller  →  model (SQL)
```

- **Backend** (`backend/src/apis/members/`): talks to the database. Files: `member.route.ts`, `member.controller.ts`, `member.model.ts`.
- **Frontend** (`frontend/app/`): asks the backend for data and shows it.
  - A **loader** *reads* data before a page renders.
  - An **action** *saves* data when a form is submitted.
- Loaders and actions only exist in the frontend. They never go in the backend member files.

---

## Backend endpoints (`/apis/member`)

All routes are guarded by `isLoggedInController`. A missing session returns **401**; a bad or missing CSRF token returns **403**.

| Method | Path | Controller | Status |
|---|---|---|---|
| POST | `/apis/member` | `postMemberController` | ✅ Working |
| GET | `/apis/member/:id` | `getMemberByIdController` | ✅ Working |
| PUT | `/apis/member/:id` | `putMemberController` | ⚠️ Needs a fix (see Task 1) |
| DELETE | `/apis/member/:id` | `deleteMemberController` | ✅ Working (minor cleanup, Task 3) |
| POST | `/apis/member/:id` | `postMemberController` | ❌ Should be removed (Task 2) |
| GET | `/apis/member/trip/:tripId` | `getMembersByTripIdController` | ✅ Working (see Task 4) |

### POST `/apis/member`: accept or decline an invite

The server builds `id`, `inviteId` and `tripId` itself (from the invite token), so the body is only:

```json
{
  "adults": 2,
  "children": 0,
  "going": "yes",
  "token": "<the invite's 64-character token>"
}
```

| Field | Rule |
|---|---|
| `adults` | Integer from 1 to 100 (a number, not `"2"`) |
| `children` | Integer from 0 to 10 |
| `going` | Exactly `"yes"`, `"no"`, or `"maybe"` (lowercase) |
| `token` | Exactly 64 characters, and it must match a real invite |

Responses:
- **201**: the member was created and the invite status was updated (`accepted` / `declined` / `pending`).
- **400**: the body failed validation. Read `details.issues` in the response to see which field.
- **401**: the invite doesn't exist, or you aren't logged in.
- **409**: this invite was already answered. On a retest, this means the first request worked.
- **410**: the invite has expired.

In Insomnia, set the body type to **JSON** so `Content-Type: application/json` is sent.

---

## Frontend status

| Piece | Where | Status |
|---|---|---|
| Show travelers and RSVPs for a trip | `routes/travel-itinerary/travel-itinerary.tsx` loader → `getTripInviteKitchenSink` (`/trip/:tripId/invite/kitchen-sink`) | ✅ Done (returns each invite with its member) |
| Accept or decline an invite | `routes/accept-invitation/accept-invitation.tsx` action → `postMember` (`POST /member`) | ✅ Done |
| Member model and form schema | `utils/models/member.model.ts` | ✅ Exists (`MemberSchema`, `AcceptInviteFormSchema`, `postMember`) |
| Change an existing RSVP | No page yet | ⏳ Not started (Task 5) |

**Decision:** the travel-itinerary page does **not** need a separate `getMembersByTripId` loader call. The kitchen-sink endpoint already includes member data. Any new member fetch functions go in the existing `frontend/app/utils/models/member.model.ts`; don't create a second file.

---

## Task list

### Task 1: Fix `putMemberController` body validation (high priority)

**File:** `backend/src/apis/members/member.controller.ts`

**Problem:** the body is validated with the full `MemberSchema`, so a PUT must include `id`, `inviteId`, `tripId`, and `role`, even though only `going`, `adults`, and `children` are used. Almost every real request returns **400**.

**Fix:**
```ts
const bodyValidationResult = MemberSchema
    .pick({going: true, adults: true, children: true})
    .safeParse(request.body)
```

Also in this controller:
- Change the "You can only update your own status on the trip." error from **400** to **403**.
- Do the ownership check **before** copying the new values onto `member`. This is cleaner, though it isn't a bug today.

Expected PUT body after the fix:
```json
{ "going": "maybe", "adults": 2, "children": 1 }
```

### Task 2: Remove the extra POST route

**File:** `backend/src/apis/members/member.route.ts`

Delete `.post(isLoggedInController, postMemberController)` from the `/:id` route. Creating a member goes through `POST /apis/member` only.

### Task 3: Clean up `deleteMemberController`

**File:** `backend/src/apis/members/member.controller.ts`

- Change "You must own the trip to remove members." from **400** to **403**.
- `response.status(204).send('Member deleted.')`: a 204 response has no body, so the text is never sent. Use `response.status(204).send()`.

### Task 4 (optional): Protect `GET /apis/member/trip/:tripId`

Right now any logged-in user can list the members of **any** trip. Consider allowing only the trip owner or a member of that trip.

### Task 5 (later): Let a member change their RSVP from the frontend

#### The goal, in plain words

Today a person can answer an invite **once**: the accept-invitation page creates their member row with `POST /member`. After that, the backend blocks a second answer with **409**. If they first said "maybe" and later want to say "yes", there's no button for that yet.

The backend already has the endpoint for changing an answer: `PUT /apis/member/:id` (fixed in Task 1). Task 5 builds the **frontend** pieces that call it.

#### Where it goes

On the **travel-itinerary page** (`frontend/app/routes/travel-itinerary/travel-itinerary.tsx`). That's where `accept-invitation.tsx` sends people after they RSVP (`redirect('/travel-itinerary/<tripId>')`), and the page already loads every traveler's member row. We add a small "Change my RSVP" card that only shows for the signed-in person's own row.

#### How the data flows

```
UpdateRsvpForm (browser)
   └─ fetcher.submit({ intent: 'update-rsvp', memberId, going, adults, children })
        └─ travel-itinerary action  (server)
             └─ putMember(memberId, body, signedInUser)      ← member.model.ts
                  └─ putRequest('/member/<memberId>', body)  ← request.utils.ts
                       └─ PUT /apis/member/:id  →  putMemberController  →  updateMember (SQL)
```

After the action finishes, React Router automatically re-runs the loader, so the table shows the new answer without extra code.

#### Step-by-step

**Step 0: finish Task 1 first.** Until then, the PUT endpoint rejects the body this form sends with **400**. Test it in Insomnia before starting the frontend:
```json
PUT /apis/member/<memberId>
{ "going": "maybe", "adults": 2, "children": 1 }
```

**Step 1: add a `putRequest` helper.** _File:_ `frontend/app/utils/request.utils.ts`

There's only `getRequest` and `postRequest` today; no PUT helper exists. Copy `postRequest`, rename it `putRequest`, and change two things:
- `method: "POST"` → `method: "PUT"`
- the console message `POST ${path} failed` → `PUT ${path} failed`

Everything else (headers, cookie, CSRF `Authorization`, timeout, error handling) stays the same. Successful PUTs return **200**, which `postRequest`'s success check already accepts.

**Step 2: add `putMember` to the frontend member model.** _File:_ `frontend/app/utils/models/member.model.ts` (the existing file; don't create a new one)

```ts
import {postRequest, putRequest} from "~/utils/request.utils";

/** Changes the signed-in member's RSVP (going / adults / children). */
export async function putMember(memberId: string, body: AcceptInviteForm, signedInUser: SignedInUser): Promise<Status> {
    return putRequest(`/member/${memberId}`, body, signedInUser)
}
```

`AcceptInviteForm` already holds exactly `going`, `adults`, and `children`, the same three fields the PUT needs. Reuse it; you don't need a new schema.

**Step 3: find "my" member row in the loader.** _File:_ `travel-itinerary.tsx`, `loader`

The loader already has `travelers` (each one is `{invite, member, profile}`) and `signedInUser`. Pick out the row that belongs to the signed-in person and return it:

```ts
const myMember = travelers.find(
    (t) => t.invite.acceptedProfileId === signedInUser.profile.id
)?.member ?? null

return {trip, travelers, myMember}
```

Also return `myMember: null` in the early `trip === null` return, so the loader always returns the same shape.

`invite.acceptedProfileId` is set by the backend when someone accepts an invite, so it's how we know which row is "me".

**Step 4: teach the action to handle two forms.** _File:_ `travel-itinerary.tsx`, `action`

The page **already has an action**: it sends new invites (`InviteForm`). A page can only have one action, so both forms submit to it. Each form adds a hidden `intent` value, and the action branches on it:

```ts
export async function action({request, params}: Route.ActionArgs): Promise<FormActionResponse> {
    const signedInUser = await requireSignedInUser(request)
    const formData = Object.fromEntries(await request.formData())

    if (formData.intent === 'update-rsvp') {
        const result = AcceptInviteFormSchema.safeParse(formData)
        if (!result.success) {
            return {success: false, status: {status: 400, data: null, message: result.error.issues[0].message}}
        }
        const status = await putMember(String(formData.memberId), result.data, signedInUser)
        if (status.status !== 200) {
            return {success: false, status}
        }
        return {success: true, status: {...status, message: 'Your RSVP was updated!'}}
    }

    // otherwise: the existing invite code, unchanged
    ...
}
```

The existing invite form doesn't send an `intent`, so "anything that isn't `update-rsvp`" keeps working as before. For extra clarity, you can also have `InviteForm` send `intent: 'invite'`.

**Step 5: build the form component.** _New file:_ `frontend/app/routes/travel-itinerary/update-rsvp-form.tsx`

Start by copying `routes/accept-invitation/accept-invite-form.tsx`. It already has the going / adults / children inputs, TanStack Form validation with `AcceptInviteFormSchema`, the `useFetcher` setup, and `StatusMessage`. Then change:
- **Props:** take `member: Member` instead of `tripTitle` / `signedInName`.
- **Default values:** pre-fill with the member's current answer, `going: member.going`, `adults: String(member.adults)`, `children: String(member.children)`. Inputs hold strings, and `z.coerce` turns them back into numbers.
- **Submit:** add the two hidden values:
  ```ts
  await fetcher.submit({...value, intent: 'update-rsvp', memberId: member.id}, {method: 'post'})
  ```
  The method stays `'post'`. That's the **browser → our action** request. The action is the one that sends the real `PUT` to the backend.
- **Heading and button text:** "Change my RSVP" / "Update RSVP".

**Step 6: show the form on the page.** _File:_ `travel-itinerary.tsx`, component

```tsx
const {trip, travelers, myMember} = props.loaderData
...
{myMember && <UpdateRsvpForm member={myMember}/>}
```

It only appears for someone who has a member row on this trip. If you don't want the trip owner to see it, use `myMember && myMember.role === 'member'`.

#### How to check it works

1. Sign in as an invitee who already accepted, and open `/travel-itinerary/<tripId>`.
2. The "Change my RSVP" card shows your current answer.
3. Change "yes" to "maybe" and submit. You should see "Your RSVP was updated!", and your row in the table should change.
4. Refresh the page. The new answer is still there, which means it was saved to the database.
5. Try a bad value (e.g. 0 adults). You should get an error message, and nothing should be saved.

#### Things to know

- **The invite status doesn't change on PUT.** `putMemberController` updates the member row only. The `invite.status` of `accepted`/`declined` stays as it was first set. The table shows `member.going`, so the display is correct. If you later want the invite status to follow (e.g. switching to "no" marks the invite `declined`), that's a backend change in `putMemberController`, similar to what `postMemberController` does.
- **Any logged-in user can currently open any trip's itinerary page** (the kitchen-sink endpoint doesn't check who's asking). That's the same concern as Task 4, and it doesn't block Task 5.

#### Files touched by Task 5

| File | Change |
|---|---|
| `frontend/app/utils/request.utils.ts` | add `putRequest` |
| `frontend/app/utils/models/member.model.ts` | add `putMember` |
| `frontend/app/routes/travel-itinerary/travel-itinerary.tsx` | loader returns `myMember`; action branches on `intent`; render the form |
| `frontend/app/routes/travel-itinerary/update-rsvp-form.tsx` | **new**, copied from `accept-invite-form.tsx` |

### Task 6: Insomnia tests

Add a member requests file (like the existing `insomnia-*.json` files) covering:
- POST with a valid body → 201
- the same POST again → 409
- POST with a bad body (e.g. `"adults": "2"`) → 400
- GET by id → 200, then with an unknown id → 404
- PUT by the member themselves → 200, then by another user → 403
- DELETE by the trip owner → 204, then by a non-owner → 403
- GET by trip → 200 with a list

---

## Already resolved

- `frontend/.env.development`: the extra `.` at the end of `GOOGLE_CLIENT_ID` is gone, so it now matches `project.env`.
- `updateMember` now takes a `Member` and updates with `WHERE id = ${id}`. Before, `going` was undefined and the update had no `WHERE`.
- `selectMemberById`, `deleteMember`, and `selectMembersByTripId` are now used by controllers, so they're no longer greyed out.
- `putMemberController` is now imported in `member.route.ts`.
- POST no longer requires client-supplied UUIDv7 ids, which was the original cause of the 400 in Insomnia.
