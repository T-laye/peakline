"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { QrScannerDialog } from "@/features/pay/components/QrScannerDialog";

interface PaymentCodeCardProps {
	onLookup: (input: string) => void;
	loading: boolean;
	error: string | null;
}

/** Replaces the old fake QR-scan card — the real backend only offers
 * `GET /pay/{code}` — a lookup by one specific payment link's own code, not
 * a generic "pay any merchant" endpoint — so either scanning or pasting a
 * link ends up at the same real lookup (`onLookup`) either way. `Scan QR
 * Code` opens `QrScannerDialog`, a real camera-based decoder, for whenever
 * a merchant shows their link's QR in person instead of sending it
 * electronically; the text field below covers pasting a link/code directly. */
function PaymentCodeCard({ onLookup, loading, error }: PaymentCodeCardProps) {
	const [input, setInput] = useState("");

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!input.trim()) return;
		onLookup(input);
	}

	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
			<div className="flex flex-col gap-1">
				<h2 className="text-b2 font-semibold text-foreground sm:text-b1">
					Pay with a payment link
				</h2>
				<p className="text-c1 text-muted-foreground sm:text-b3">
					Scan a merchant&apos;s QR code, or paste the link/code they shared with you
				</p>
			</div>

			<QrScannerDialog onScan={onLookup} />

			<div className="flex items-center gap-3">
				<span className="h-px flex-1 bg-border" aria-hidden="true" />
				<span className="text-c2 text-muted-foreground">OR</span>
				<span className="h-px flex-1 bg-border" aria-hidden="true" />
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<label htmlFor="payment-code" className="text-label text-foreground">
						Payment link or code
					</label>
					<Input
						id="payment-code"
						placeholder="https://peakline.com/pay/... or code"
						value={input}
						onChange={(e) => setInput(e.target.value)}
					/>
					{error && <p className="text-c1 text-destructive">{error}</p>}
				</div>

				<Button type="submit" size="large" className="w-full" loading={loading}>
					<Search className="size-4" aria-hidden="true" />
					Look Up Payment
				</Button>
			</form>
		</div>
	);
}

export { PaymentCodeCard };
