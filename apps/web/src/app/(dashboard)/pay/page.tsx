"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@repo/ui/sonner";
import { MobileStepHeader } from "@/features/wallet/components/MobileStepHeader";
import { PageHeader } from "@/components/layouts/PageHeader";
import { PaymentCodeCard } from "@/features/pay/components/PaymentCodeCard";
import { PaymentLinkPreviewCard } from "@/features/pay/components/PaymentLinkPreviewCard";
import { PersonPaymentCard } from "@/features/pay/components/PersonPaymentCard";
import { SendPinDialog } from "@/features/send/components/SendPinDialog";
import { usePaymentLinkLookup } from "@/features/pay/hooks";
import { usePayFlowStore } from "@/features/pay/store/payFlowStore";
import { useSendMoney } from "@/features/send/hooks";
import { useWalletLookup } from "@/features/wallet/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { parseReceiveLink, WALLET_ADDRESS_REGEX } from "@/lib/wallet";
import type { PublicPaymentLinkData } from "@/lib/api/types";

interface PersonRecipient {
	/** Set only when this came from a `?userId=`-carrying receive link — a
	 * bare wallet-address paste/scan has no id to look a name up with. */
	userId: string | null;
	address: string;
}

/**
 * `buildPersonPayTarget` turns a resolved person + the amount they were
 * just charged into the same `PublicPaymentLinkData` shape a real Payment
 * Link resolves to, purely so `/pay/success`/`/pay/failed` (and, on a
 * failed retry, `/pay/confirm`) can render this exact case with zero
 * changes of their own beyond reading `recipientRoleLabel` — see that
 * field's own note on why it exists.
 */
function buildPersonPayTarget(
	recipient: PersonRecipient,
	name: string | undefined,
	amount: number,
): PublicPaymentLinkData {
	return {
		title: "Payment",
		amount: amount.toFixed(2),
		currency: "USDC",
		description: null,
		expiresAt: "",
		status: "active",
		businessName: name ?? recipient.address,
		destinationAddress: recipient.address,
		memo: "",
		recipientRoleLabel: name ? "Peakline User" : "Wallet Address",
	};
}

function PayPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [link, setLink] = useState<PublicPaymentLinkData | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Lazy initializer, not a syncing effect — arriving straight from a
	// Receive QR/link (opened as a real URL, not pasted into
	// `PaymentCodeCard`) means `?userId=`/`?wallet=` only ever matter for
	// this page's *first* render; recognizing the same two params
	// `handleLookup` below does from pasted/scanned text, just already
	// split apart by the browser's own query-string parsing.
	const [personRecipient, setPersonRecipient] = useState<PersonRecipient | null>(() => {
		const userId = searchParams.get("userId");
		if (userId) return { userId, address: "" };
		const wallet = searchParams.get("wallet");
		if (wallet && WALLET_ADDRESS_REGEX.test(wallet)) return { userId: null, address: wallet };
		return null;
	});
	const [pinDialogOpen, setPinDialogOpen] = useState(false);
	const [pendingAmount, setPendingAmount] = useState<number | null>(null);
	const lookup = usePaymentLinkLookup();
	const sendMoney = useSendMoney();
	const setStoreLink = usePayFlowStore((state) => state.setLink);
	const setStoreResult = usePayFlowStore((state) => state.setResult);
	const setStoreErrorMessage = usePayFlowStore((state) => state.setErrorMessage);

	const { data: personLookup, isLoading: isLoadingPerson } = useWalletLookup(
		personRecipient?.userId ?? null,
	);
	const personNotFound = Boolean(
		personRecipient?.userId && !isLoadingPerson && personLookup === null,
	);
	const personName = personRecipient?.userId ? personLookup?.name : undefined;

	function handleLookup(input: string) {
		setError(null);

		// A merchant Payment Link's own code/URL is the only thing
		// `usePaymentLinkLookup` actually knows how to resolve — but this same
		// scan-or-paste box is also the obvious place someone lands after
		// scanning a *person's* Receive QR (a `buildReceiveLink` URL carrying
		// their user id, or a bare wallet address pasted directly from "Copy
		// Wallet Address"). That's a different flow entirely — no fixed
		// amount to look up, just someone to pay whatever the payer types —
		// so it's handled right here on this same page (`PersonPaymentCard`)
		// instead of a payment-link lookup. Both checked first so neither
		// ever gets treated as an unrecognized payment code.
		const userId = parseReceiveLink(input);
		if (userId) {
			setPersonRecipient({ userId, address: "" });
			return;
		}
		const trimmed = input.trim();
		if (WALLET_ADDRESS_REGEX.test(trimmed)) {
			setPersonRecipient({ userId: null, address: trimmed });
			return;
		}

		lookup.mutate(input, {
			onSuccess: (result) => setLink(result),
			onError: (err) => {
				setLink(null);
				setError(getApiErrorMessage(err, "Payment link not found"));
			},
		});
	}

	function handleChangeCode() {
		setLink(null);
		setPersonRecipient(null);
		setError(null);
	}

	function handleContinue() {
		if (!link) return;
		setStoreLink(link);
		router.push("/pay/confirm");
	}

	function handlePersonPay(amount: number) {
		const address = personLookup?.publicKey ?? personRecipient?.address;
		// Shouldn't happen — `PersonPaymentCard` only ever shows its "Pay"
		// button once a real address has resolved — but a silent no-op here
		// would look exactly like "the Pay button does nothing" (reported
		// live) with zero clue why, so surface it rather than swallow it.
		if (!address) {
			toast.error("Couldn't find this recipient's wallet address — try looking it up again");
			return;
		}
		setPendingAmount(amount);
		setPinDialogOpen(true);
	}

	function handlePinConfirm(pin: string) {
		const address = personLookup?.publicKey ?? personRecipient?.address;
		if (!address || pendingAmount === null || !personRecipient) {
			// Same "shouldn't happen, but never fail silently" reasoning as
			// `handlePersonPay` — this dialog only ever opens once both are
			// already set.
			toast.error("Something went wrong — please try again");
			setPinDialogOpen(false);
			return;
		}

		sendMoney.mutate(
			{ values: { method: "wallet", recipient: address, amount: pendingAmount }, pin },
			{
				onSuccess: (result) => {
					setPinDialogOpen(false);
					const target = buildPersonPayTarget(
						{ ...personRecipient, address },
						personName,
						pendingAmount,
					);
					setStoreLink(target);
					setStoreResult(result);
					router.push("/pay/success");
				},
				onError: (err) => {
					setPinDialogOpen(false);
					const target = buildPersonPayTarget(
						{ ...personRecipient, address },
						personName,
						pendingAmount,
					);
					setStoreLink(target);
					setStoreErrorMessage(getApiErrorMessage(err, "Payment could not be processed"));
					router.push("/pay/failed");
				},
			},
		);
	}

	const showingPerson = Boolean(personRecipient);

	return (
		<div className="flex flex-col gap-6 sm:gap-8">
			{/* No back arrow — primary bottom-tab destination (the elevated
			    center action), same as /wallet. */}
			<MobileStepHeader title="Pay" />
			<PageHeader title="Pay" subtitle="Pay a merchant using their payment link." />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
				{/* Desktop: code-entry card always visible alongside the result.
				    Mobile: replaced entirely once something's found — same space
				    constraint as the old scan-based version, with a "Look up a
				    different link" way back in if needed. */}
				<div className={link || showingPerson ? "hidden lg:block" : ""}>
					<PaymentCodeCard onLookup={handleLookup} loading={lookup.isPending} error={error} />
				</div>
				<div className={!link && !showingPerson ? "hidden lg:block" : ""}>
					{showingPerson ? (
						<PersonPaymentCard
							isLoading={isLoadingPerson}
							notFound={personNotFound}
							name={personName}
							address={personLookup?.publicKey ?? personRecipient?.address ?? ""}
							onPay={handlePersonPay}
						/>
					) : (
						<PaymentLinkPreviewCard
							link={link}
							onContinue={handleContinue}
							onChangeCode={handleChangeCode}
						/>
					)}
				</div>
			</div>

			{showingPerson && (
				<button
					type="button"
					onClick={handleChangeCode}
					className="self-center text-b4 font-medium text-muted-foreground underline hover:text-foreground lg:hidden"
				>
					Look up a different link
				</button>
			)}

			<SendPinDialog
				open={pinDialogOpen}
				onOpenChange={setPinDialogOpen}
				onConfirm={handlePinConfirm}
			/>
		</div>
	);
}

// `useSearchParams()` (for `?userId=`/`?wallet=`, above) requires a
// Suspense boundary — same reason `/send`'s own page used to need one for
// this exact param pair, and `auth/reset-password/page.tsx` needs one for
// its own token param.
export default function PayPage() {
	return (
		<Suspense>
			<PayPageContent />
		</Suspense>
	);
}
