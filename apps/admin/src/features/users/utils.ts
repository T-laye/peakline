import type { AdminUserData } from "@/lib/api/types";

/** No documented "is this user currently locked" boolean on `AdminUserData`
 * itself — derived from `lockedAt`/`lockedUntil` (an indefinite lock has
 * `lockedUntil: null`; a timed one has already lifted once that timestamp
 * passes). Flagged since it's an inference, not a confirmed field. Shared
 * by `UsersList`, `UserDetail`, and `UserActions` rather than duplicated in
 * each. */
function isCurrentlyLocked(user: Pick<AdminUserData, "lockedAt" | "lockedUntil">): boolean {
	if (!user.lockedAt) return false;
	if (!user.lockedUntil) return true;
	return new Date(user.lockedUntil).getTime() > Date.now();
}

export { isCurrentlyLocked };
