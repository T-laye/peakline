import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@/lib/api/types";

/**
 * The backend's default NestJS exception filter always includes a
 * human-readable `message` (confirmed live) — either a single string or,
 * from class-validator on a 400, an array of them. Safe to show directly in
 * a toast.
 */
function getApiErrorMessage(
	error: unknown,
	fallback = "Something went wrong. Please try again.",
) {
	if (isAxiosError<ApiErrorResponse>(error)) {
		const message = error.response?.data?.message;
		if (Array.isArray(message)) {
			return message.length > 0 ? message.join(" ") : fallback;
		}
		if (typeof message === "string" && message) return message;
	}
	return fallback;
}

function getApiErrorStatus(error: unknown) {
	return isAxiosError(error) ? error.response?.status : undefined;
}

/** e.g. `INVALID_PIN`, `PIN_LOCKED`, `PIN_NOT_SET`. */
function getApiErrorCode(error: unknown) {
	return isAxiosError<ApiErrorResponse>(error) ? error.response?.data?.code : undefined;
}

/** `details.issues` from a 422 (refund authorize, transfer send/preview). */
function getApiErrorIssues(error: unknown): string[] {
	if (!isAxiosError<ApiErrorResponse>(error)) return [];
	const issues = error.response?.data?.details?.issues;
	return Array.isArray(issues) ? issues : [];
}

export { getApiErrorMessage, getApiErrorStatus, getApiErrorCode, getApiErrorIssues };
