import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import type { StaffRole } from "@/lib/api/types";

const STAFF_ROLES: [StaffRole, ...StaffRole[]] = [
	"admin",
	"super_admin",
	"support",
	"compliance",
	"operations",
];

/** Ported from apps/web's identical `phoneSchema` — `PhoneInput` (@repo/ui)
 * lets the invite-picker choose any country, not just Ghana. */
const phoneSchema = z
	.string()
	.trim()
	.min(1, "Enter a phone number")
	.refine((value) => isValidPhoneNumber(value), "Enter a valid phone number");

export const inviteStaffSchema = z.object({
	firstName: z.string().trim().min(1, "Enter a first name"),
	lastName: z.string().trim().min(1, "Enter a last name"),
	email: z.string().trim().min(1, "Enter an email address").email("Enter a valid email address"),
	phone: phoneSchema,
	staffRole: z.enum(STAFF_ROLES),
});
export type InviteStaffValues = z.infer<typeof inviteStaffSchema>;
