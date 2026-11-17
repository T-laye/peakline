import { z } from "zod";

/** `customerId` is either an existing customer's id or `NEW_CUSTOMER`, in
 * which case the name (and optionally email) typed below are used. */
export const NEW_CUSTOMER = "new";

export const createPaymentRequestSchema = z.object({
	customerId: z.string().min(1, "Select a customer"),
	customerName: z.string().trim().min(1, "Enter the customer's name").max(80, "Name is too long"),
	customerEmail: z
		.union([z.literal(""), z.string().trim().email("Enter a valid email address")])
		.optional(),
	amount: z.coerce
		.number({ message: "Enter an amount" })
		.positive("Enter an amount greater than 0"),
	description: z.string().trim().max(140, "Description is too long").optional(),
	dueDate: z
		.string()
		.optional()
		.refine(
			(value) => !value || value >= new Date().toISOString().slice(0, 10),
			"Due date can't be in the past",
		),
	reference: z.string().trim().max(60, "Reference is too long").optional(),
});
export type CreatePaymentRequestValues = z.infer<typeof createPaymentRequestSchema>;
