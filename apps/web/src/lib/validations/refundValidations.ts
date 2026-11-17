import { z } from "zod";

/** Built per payment so the max is that payment's remaining refundable
 * balance (which already reserves in-flight refunds). */
export function createRefundSchema(remainingRefundable: number) {
	return z.object({
		type: z.enum(["full", "partial"]),
		amount: z.coerce
			.number({ message: "Enter an amount" })
			.positive("Refund amount must be greater than 0")
			.max(remainingRefundable, `You can refund at most ${remainingRefundable.toFixed(2)} USDC`),
		reason: z.string().trim().min(3, "Add a reason for this refund").max(140, "Reason is too long"),
	});
}

export type CreateRefundValues = z.infer<ReturnType<typeof createRefundSchema>>;
