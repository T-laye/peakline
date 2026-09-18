import Link from "next/link";
import { Send, QrCode, ArrowDownLeft, Link2, ListChecks } from "lucide-react";
import { Button } from "@repo/ui/button";
import { appUrl } from "@/lib/appUrl";
import { Reveal } from "@/components/Reveal";

const CHECKLIST = [
	{ icon: ArrowDownLeft, label: "Send & receive" },
	{ icon: QrCode, label: "Pay with QR" },
	{ icon: Link2, label: "Payment Links" },
	{ icon: ListChecks, label: "Track transactions" },
];

const TRANSACTION_CARDS = [
	{
		icon: Send,
		iconBg: "bg-primary-500",
		title: "Received from John Doe",
		time: "Yesterday, 10:22 AM",
		amount: "+1,000.00 USDC",
		amountColor: "text-primary-500",
	},
	{
		icon: Send,
		iconBg: "bg-[#EE443F]",
		title: "Sent to John Doe",
		time: "Yesterday, 10:22 AM",
		amount: "-1,000.00 USDC",
		amountColor: "text-[#EE443F]",
	},
	{
		icon: QrCode,
		iconBg: "bg-primary-500",
		title: "Scan & Pay",
		time: "Yesterday, 10:22 AM",
		amount: "+1,000.00 USDC",
		amountColor: "text-primary-500",
	},
] as const;

/** Figma "About" (#426:19036). The three transaction-card mockups are
 * purely decorative marketing copy of the real transaction list, not a live
 * feed — built locally rather than reusing apps/web's dashboard
 * `TransactionRow` (different app, different data shape). */
function AboutSection() {
	return (
		<section id="about" className="custom-container flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-center">
			<div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl bg-neutral-50 p-6 sm:p-10">
				{TRANSACTION_CARDS.map((card, i) => (
					<div
						key={i}
						className="flex items-center justify-between gap-4 rounded-2xl bg-background p-5"
					>
						<div className="flex items-center gap-3">
							<span
								className={`flex size-12 shrink-0 items-center justify-center rounded-full ${card.iconBg}`}
							>
								<card.icon className="size-5 text-white" aria-hidden="true" />
							</span>
							<div className="flex flex-col gap-1">
								<p className="text-s2 text-foreground">{card.title}</p>
								<p className="text-c1 text-neutral-400">{card.time}</p>
							</div>
						</div>
						<div className="flex flex-col items-end gap-1">
							<p className={`text-s2 ${card.amountColor}`}>{card.amount}</p>
							<p className="text-c1 text-neutral-400">Completed</p>
						</div>
					</div>
				))}
			</div>

			<div className="flex max-w-xl flex-col gap-8">
				<div className="flex flex-col gap-4">
					<h2 className="text-h3 text-foreground sm:text-[3rem]">
						Transforming Transactions, One Click at a Time.
					</h2>
					<p className="text-b1 text-neutral-600">
						Peakline is made for individuals and businesses, bringing sending,
						receiving, requesting, QR payments, payment links and transaction
						tracking into one experience.
					</p>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{CHECKLIST.map(({ icon: Icon, label }, i) => (
							<Reveal key={label} delay={i * 80}>
								<div className="flex items-center gap-3">
									<span className="flex size-10 items-center justify-center rounded-full bg-neutral-50">
										<Icon className="size-4 text-neutral-600" aria-hidden="true" />
									</span>
									<span className="text-b1 text-neutral-600">{label}</span>
								</div>
							</Reveal>
						))}
					</div>
				</div>

				<Button asChild variant="primary" size="large" className="w-fit rounded-full">
					<Link href={appUrl("/auth/sign-up")}>Get Started</Link>
				</Button>
			</div>
		</section>
	);
}

export { AboutSection };
