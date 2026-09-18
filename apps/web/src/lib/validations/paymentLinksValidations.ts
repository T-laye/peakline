import { z } from "zod";

export const createPaymentLinkSchema = z.object({
	title: z.string().trim().min(1, "Enter a payment title"),
	amount: z.coerce
		.number({ message: "Enter an amount" })
		.positive("Enter an amount greater than 0"),
	description: z.string().trim().max(140, "Description is too long").optional(),
	expiration: z.string().min(1, "Choose an expiration date"),
	reference: z.string().trim().max(60, "Reference is too long").optional(),
});
export type CreatePaymentLinkValues = z.infer<typeof createPaymentLinkSchema>;
