import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type {
	TransactionData,
	TransactionDirection,
	TransactionLedgerStatus,
	TransactionMethod,
	TransactionType,
} from "@/lib/api/types";

/** Shared by every list that renders a transaction row (dashboard's
 * abbreviated "Recent Transactions", the full `/transactions` history,
 * merchant's Transactions/Payments tables) — a real ledger row has no
 * display title, icon, or "kind" of its own, just `type`/`counterparty`/
 * `direction`/`method`, so these derive the same copy the app has always
 * shown from those real fields instead of a fixed fake string.
 *
 * There's no "scan_pay" concept in the real ledger — paying a merchant's
 * payment link is just an ordinary internal/external transfer once it
 * settles, indistinguishable here from any other outgoing send. */

const DIRECTION_STYLE: Record<
	TransactionDirection,
	{ icon: typeof ArrowDownLeft; className: string }
> = {
	incoming: { icon: ArrowDownLeft, className: "bg-primary-600" },
	outgoing: { icon: ArrowUpRight, className: "bg-destructive" },
};

/** Defaults to "outgoing" styling for the rare row with no `direction` at
 * all (only omitted on write-endpoint responses, never on anything a list
 * or detail page would render). */
function transactionDirectionStyle(transaction: TransactionData) {
	return DIRECTION_STYLE[transaction.direction ?? "outgoing"];
}

const STATUS_LABEL: Record<TransactionLedgerStatus, string> = {
	pending: "Pending",
	processing: "Processing",
	completed: "Completed",
	failed: "Failed",
	reversed: "Reversed",
};

const TYPE_LABEL: Record<TransactionType, string> = {
	deposit: "Deposit",
	withdrawal: "Withdrawal",
	internal_transfer: "Transfer",
	conversion: "Conversion",
	withdrawal_ghs: "GHS Withdrawal",
};

const METHOD_LABEL: Record<TransactionMethod, string> = {
	intent: "QR / Funding",
	stellar: "Stellar",
	peakline: "Peakline",
	bank: "Bank",
	conversion: "Conversion",
};

function truncateAddress(address: string) {
	return address.length > 12 ? `${address.slice(0, 5)}...${address.slice(-5)}` : address;
}

/** Whoever's on the other end, when it's identifiable — a name/username/
 * phone for an internal Peakline counterparty, or a truncated wallet
 * address for an on-chain external send/receive. `null` for a transaction
 * type with no "other party" concept at all (a faucet deposit, a
 * conversion). */
function transactionCounterpartyLabel(transaction: TransactionData): string | null {
	const counterparty = transaction.counterparty;
	const name = counterparty?.name || counterparty?.username || counterparty?.phone;
	if (name) return name;
	if (transaction.externalAddress) return truncateAddress(transaction.externalAddress);
	return null;
}

function transactionTitle(transaction: TransactionData): string {
	const who = transactionCounterpartyLabel(transaction);
	if (who) {
		return transaction.direction === "outgoing" ? `Sent to ${who}` : `Received from ${who}`;
	}
	if (transaction.type === "deposit") return "Wallet Funded";
	if (transaction.type === "conversion") return "Currency Conversion";
	if (transaction.type === "withdrawal" || transaction.type === "withdrawal_ghs") {
		return "Withdrawal";
	}
	return transaction.direction === "outgoing" ? "Sent" : "Received";
}

/** The detail page's own heading noun ("Transfer Successful!", "Payment
 * Pending", ...) — "Payment" for money coming in, "Transfer" for money
 * going out, both derived from the transaction's own real `direction` now
 * rather than a fixed per-account-type default that didn't actually know
 * which way any given row went. */
function transactionNoun(transaction: TransactionData): string {
	if (transaction.type === "deposit") return "Deposit";
	if (transaction.type === "withdrawal" || transaction.type === "withdrawal_ghs") {
		return "Withdrawal";
	}
	if (transaction.type === "conversion") return "Conversion";
	return transaction.direction === "outgoing" ? "Transfer" : "Payment";
}

function transactionCounterpartyFieldLabel(transaction: TransactionData): string {
	return transaction.direction === "outgoing" ? "To" : "From";
}

function formatTransactionAmount(transaction: TransactionData) {
	const sign = transaction.direction === "outgoing" ? "−" : "+";
	const value = Number(transaction.amount).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return `${sign}${value} ${transaction.currency}`;
}

function formatTransactionDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatTransactionTimestamp(iso: string) {
	return new Date(iso).toLocaleString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

export {
	transactionDirectionStyle,
	STATUS_LABEL,
	TYPE_LABEL,
	METHOD_LABEL,
	transactionTitle,
	transactionNoun,
	transactionCounterpartyLabel,
	transactionCounterpartyFieldLabel,
	formatTransactionAmount,
	formatTransactionDate,
	formatTransactionTimestamp,
};
