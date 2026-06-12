# OJTask Notification System

## Overview

OJTask has a built-in, scalable notification system that shows red badge counters
on the sidebar nav (like the Messages "2" badge) whenever something new happens
between parties. Notifications are **role-aware** — each user only sees counts
for things relevant to them.

---

## Architecture

### Database
- Collection: `notifications` in MongoDB Atlas
- Fields: `{ id, userId, spaceId, section, referenceId, type, isRead, createdAt }`
- Methods in `server/mongo-storage.ts`:
  - `createNotification(data)` — insert a notification
  - `getNotificationCounts(spaceId, userId)` — returns `{ section: unreadCount }` map
  - `markNotificationsRead(spaceId, userId, section)` — clears a section for a user

### Server Helpers (`server/notification-helpers.ts`)
Two functions cover every case:

```ts
import { notifyUser, notifyByRole } from "./notification-helpers";

// Notify ONE specific user (e.g. student gets evaluation result):
await notifyUser(storage, targetUserId, spaceId, 'evaluations', ev.id, 'new_evaluation');

// Notify ALL members of certain role(s) (e.g. supervisors see new document):
await notifyByRole(storage, spaceId, ['supervisor', 'school'], 'documents', doc.id, 'document_uploaded');
```

### API Endpoints (in `server/routes.ts`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/spaces/:spaceId/notification-counts` | Returns `{ section: count }` for the current user |
| POST | `/api/spaces/:spaceId/notifications/mark-read` | Body `{ section }` — clears a section for the current user |

### Frontend

**Hook** (`client/src/hooks/use-notifications.ts`):
- `useNotificationCounts()` — polls every 10 s, returns `{ evaluations, documents, attendance, ... }`
- `useMarkNotificationsRead(section)` — returns an async function to clear a section

**Sidebar** (`client/src/components/layout/app-layout.tsx`):
- `NOTIFICATION_SECTION_MAP` maps each nav route → section name
- Any route with a matching key in `notifCounts` automatically gets a badge
- To add a badge for a new page: add one entry to `NOTIFICATION_SECTION_MAP`

**Pages** — clear their badge on mount:
```tsx
const markRead = useMarkNotificationsRead('my-section');
useEffect(() => { markRead(); }, [markRead]);
```

---

## How to Add Notifications for a New Feature

### Step 1 — Fire the notification in the route (server)
```ts
// routes.ts — after creating/updating the record:
import { notifyUser, notifyByRole } from "./notification-helpers";

// Example: student submits a report → notify supervisors
await notifyByRole(storage, spaceId, ['supervisor', 'school'], 'reports', report.id, 'report_submitted');

// Example: supervisor approves report → notify student
await notifyUser(storage, report.userId, spaceId, 'reports', report.id, 'report_approved');
```

### Step 2 — Add a sidebar badge (frontend)
In `client/src/components/layout/app-layout.tsx`, add one line to `NOTIFICATION_SECTION_MAP`:
```ts
const NOTIFICATION_SECTION_MAP: Record<string, string> = {
  '/evaluations': 'evaluations',
  '/documents':   'documents',
  '/attendance':  'attendance',
  '/reports':     'reports',   // ← add this
};
```

### Step 3 — Clear the badge when the user opens the page
In the page component:
```tsx
import { useMarkNotificationsRead } from "@/hooks/use-notifications";

const markRead = useMarkNotificationsRead('reports');
useEffect(() => { markRead(); }, [markRead]);
```

That's it. No schema changes, no new endpoints, no new collections.

---

## Existing Notification Triggers

| Event | Who is notified | Section | Type |
|-------|----------------|---------|------|
| Document uploaded | supervisors + school | `documents` | `document_uploaded` |
| Document approved | uploader | `documents` | `document_approved` |
| Document rejected | uploader | `documents` | `document_rejected` |
| Evaluation created | evaluatee (student) | `evaluations` | `new_evaluation` |
| Leave request filed | supervisors + school | `attendance` | `leave_filed` |
| Leave request approved | student | `attendance` | `leave_approved` |
| Leave request rejected | student | `attendance` | `leave_rejected` |

---

## Section Names (convention)
Use the route path without the leading slash as the section name.
e.g. `/reports` → `'reports'`, `/tasks` → `'tasks'`

This keeps the `NOTIFICATION_SECTION_MAP` and the `notifyUser`/`notifyByRole` calls
in sync without any extra configuration.
