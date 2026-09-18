/** `POST /users/me/avatar`'s own real limits (confirmed live) — checked
 * client-side before the file ever gets uploaded so a wrong-type/oversized
 * pick fails instantly with a clear message, instead of a round trip just
 * to learn the same thing from a 4xx. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
export const AVATAR_ACCEPT_ATTR = "image/jpeg,image/png";

export function validateAvatarFile(file: File): string | null {
	if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
		return "Please choose a JPEG or PNG image";
	}
	if (file.size > AVATAR_MAX_BYTES) {
		return "Image must be 5MB or smaller";
	}
	return null;
}
