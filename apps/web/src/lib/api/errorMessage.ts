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

export { getApiErrorMessage };
