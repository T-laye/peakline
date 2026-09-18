import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { WALLET_ADDRESS_REGEX } from "@/lib/wallet";

// Values match `SendMoneyDto`'s own `mode` enum exactly (phone/username/
// wallet) so building the request body needs no extra mapping step.
export const TRANSFER_METHODS = [
	{ value: "phone", label: "Phone Number" },
	{ value: "username", label: "Username" },
	{ value: "wallet", label: "Wallet Address" },
] as const;

export const sendMoneySchema = z
	.object({
		method: z.enum(
			TRANSFER_METHODS.map((method) => method.value) as [string, ...string[]],
			{ message: "Select a transfer method" },
		),
		// One combined field for whichever recipient identifier the chosen
		// method needs — validated per-method below rather than carrying three
		// separate (mostly-empty) fields.
		recipient: z.string().trim().min(1, "Enter recipient details"),
		// A real name, only ever set once `GET /wallets/search` (a phone
		// exact-match auto-verify, or a picked name-search result) or
		// `GET /wallets/lookup/{userId}` (arriving via a Receive QR/link)
		// actually resolved one — see `RecipientSearchField`/`SendMoneyPage`.
		// Not itself sent to `POST /transfers/send`; purely a display label so
		// Review can show a real name instead of the raw identifier for a
		// verified recipient, same as it always could for a QR/link arrival.
		recipientName: z.string().optional(),
		amount: z.coerce
			.number({ message: "Enter an amount" })
			.positive("Enter an amount greater than 0"),
		note: z.string().trim().max(140, "Note is too long").optional(),
	})
	.superRefine((data, ctx) => {
		if (data.method === "phone") {
			if (!isValidPhoneNumber(data.recipient)) {
				ctx.addIssue({
					code: "custom",
					path: ["recipient"],
					message: "Enter a valid phone number",
				});
			}
		} else if (data.method === "username") {
			if (data.recipient.length < 3) {
				ctx.addIssue({
					code: "custom",
					path: ["recipient"],
					message: "Enter a valid username",
				});
			}
		} else if (data.method === "wallet") {
			if (!WALLET_ADDRESS_REGEX.test(data.recipient)) {
				ctx.addIssue({
					code: "custom",
					path: ["recipient"],
					message: "Enter a valid Stellar wallet address",
				});
			}
		}
	});
export type SendMoneyValues = z.infer<typeof sendMoneySchema>;
