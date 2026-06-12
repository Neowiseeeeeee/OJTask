/**
 * NOTIFICATION HELPERS
 * ─────────────────────────────────────────────────────────────────────────────
 * Central module for firing notifications anywhere in routes.ts.
 * Adding a new notification for a new feature = ONE LINE.
 *
 * USAGE IN ROUTES:
 *   import { notifyUser, notifyByRole } from "./notification-helpers";
 *
 *   // Notify a specific user:
 *   await notifyUser(storage, targetUserId, spaceId, 'tasks', task.id, 'task_assigned');
 *
 *   // Notify every space member with a given role:
 *   await notifyByRole(storage, spaceId, ['supervisor','school'], 'documents', doc.id, 'document_uploaded');
 *
 * SECTIONS (maps to sidebar badges — add new sections freely, no schema change needed):
 *   'evaluations' | 'documents' | 'attendance' | 'tasks' | 'scrums' | <any-string>
 *
 * TYPES (free-form string, used for filtering/display in future):
 *   'new_evaluation' | 'document_uploaded' | 'document_approved' | 'document_rejected'
 *   'leave_filed' | 'leave_approved' | 'leave_rejected' | 'task_assigned' | <any-string>
 *
 * The frontend automatically shows a badge for any section returned by
 * GET /api/spaces/:spaceId/notification-counts with a count > 0.
 * The sidebar NOTIFICATION_SECTION_MAP in app-layout.tsx maps routes → sections.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function notifyUser(
  storage: any,
  userId: number,
  spaceId: number,
  section: string,
  referenceId: number,
  type: string
): Promise<void> {
  try {
    await storage.createNotification({ userId, spaceId, section, referenceId, type });
  } catch (err) {
    console.error(`[notify] Failed to notify user ${userId}:`, err);
  }
}

export async function notifyByRole(
  storage: any,
  spaceId: number,
  roles: string[],
  section: string,
  referenceId: number,
  type: string
): Promise<void> {
  try {
    const members = await storage.getSpaceMembers(spaceId);
    await Promise.all(
      members.map(async (m: any) => {
        const user = await storage.getUser(m.userId);
        if (user && roles.includes(user.role)) {
          await storage.createNotification({ userId: m.userId, spaceId, section, referenceId, type });
        }
      })
    );
  } catch (err) {
    console.error(`[notify] Failed to notifyByRole in space ${spaceId}:`, err);
  }
}
