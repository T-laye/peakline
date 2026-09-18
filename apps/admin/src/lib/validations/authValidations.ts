import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
	password: z.string().min(1, "Enter your password"),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const verifyMfaSchema = z.object({
	totpCode: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type VerifyMfaValues = z.infer<typeof verifyMfaSchema>;
