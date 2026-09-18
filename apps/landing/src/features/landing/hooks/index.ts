import { useMutation } from "@tanstack/react-query";
import type { SubscribeValues } from "@/lib/validations/landingValidations";

/** No newsletter endpoint exists yet — stub the same way every other
 * not-yet-backed-by-real-API form in this codebase does (see root
 * CLAUDE.md's form/data stack notes). Swap the `mutationFn` for a real call
 * when the backend exists; nothing else about `Footer` needs to change. */
async function fakeRequest<T>(payload: T, delay = 800): Promise<T> {
	await new Promise((resolve) => setTimeout(resolve, delay));
	return payload;
}

function useSubscribe() {
	return useMutation({
		mutationFn: (values: SubscribeValues) => fakeRequest(values),
	});
}

export { useSubscribe };
