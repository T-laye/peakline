import { z } from "zod";

const subscribeSchema = z.object({
	email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type SubscribeValues = z.infer<typeof subscribeSchema>;

export { subscribeSchema };
export type { SubscribeValues };
