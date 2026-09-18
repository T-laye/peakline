"use client";

import { Logo } from "@repo/ui/logo";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@repo/ui/card";
import { Badge, StatusBadge } from "@repo/ui/badge";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { Label } from "@repo/ui/label";
import { HelperText } from "@repo/ui/helper-text";
import { Alert } from "@repo/ui/alert";
import { Code } from "@repo/ui/code";
import { Separator } from "@repo/ui/separator";

const RAMPS: { name: string; prefix: string; steps: string[] }[] = [
	{
		name: "Primary",
		prefix: "bg-primary",
		steps: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	},
	{
		name: "Secondary",
		prefix: "bg-secondary",
		steps: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	},
	{
		name: "Neutral",
		prefix: "bg-neutral",
		steps: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	},
];

const SEMANTIC_RAMPS: { name: string; prefix: string }[] = [
	{ name: "Success", prefix: "bg-success" },
	{ name: "Danger", prefix: "bg-danger" },
	{ name: "Warning", prefix: "bg-warning" },
	{ name: "Info", prefix: "bg-info" },
];

export default function Home() {
	return (
		<div className="custom-container flex flex-col gap-16 py-16">
			<header className="flex flex-col gap-2">
				<Logo size="lg" />
				<Badge>Design tokens preview</Badge>
				<h1 className="text-h1 text-foreground">Peakline</h1>
				<p className="text-b1 text-muted-foreground max-w-xl">
					One wallet for simple digital payments. This page is a scratch
					surface for the shared <Code>@repo/ui</Code> tokens &mdash; colors,
					type scale, and base components &mdash; not the real landing page.
				</p>
			</header>

			{/* Type scale */}
			<section className="flex flex-col gap-4">
				<h2 className="text-h2">Type scale</h2>
				<p className="text-b3 text-muted-foreground">
					Exact spec from the Figma typography page &mdash; size / line-height,
					weight baked into each token.
				</p>
				<Card>
					<CardContent className="flex flex-col gap-3 py-6">
						<p className="text-h1">H1 &middot; Headline &mdash; 48/58</p>
						<p className="text-h2">H2 &middot; Headline &mdash; 40/48</p>
						<p className="text-h3">H3 &middot; Headline &mdash; 32/38</p>
						<p className="text-h4">H4 &middot; Headline &mdash; 28/34</p>
						<p className="text-h5">H5 &middot; Headline &mdash; 24/28</p>
						<Separator className="my-1" />
						<p className="text-s1">S1 &middot; Subtitle &mdash; 18/28</p>
						<p className="text-s2">S2 &middot; Subtitle &mdash; 16/24</p>
						<Separator className="my-1" />
						<p className="text-b1">B1 &middot; Body Regular &mdash; 16/24</p>
						<p className="text-b2">B2 &middot; Body Medium &mdash; 16/24</p>
						<p className="text-b3">B3 &middot; Body Regular &mdash; 14/20</p>
						<p className="text-b4">B4 &middot; Body Medium &mdash; 14/20</p>
						<Separator className="my-1" />
						<p className="text-c1 text-muted-foreground">
							C1 &middot; Caption Regular &mdash; 12/16
						</p>
						<p className="text-c2 text-muted-foreground">
							C2 &middot; Caption Medium &mdash; 12/16
						</p>
						<p className="text-c3 text-muted-foreground">
							C3 &middot; Caption Medium &mdash; 10/14
						</p>
						<p className="text-label text-muted-foreground uppercase">
							Label &mdash; 12/16
						</p>
					</CardContent>
				</Card>

				<p className="text-b4 mt-2">Button font</p>
				<Card>
					<CardContent className="flex flex-wrap items-center gap-4 py-6">
						<span className="text-btn-giant">Giant 18/24</span>
						<span className="text-btn-large">Large 16/20</span>
						<span className="text-btn-medium">Medium 14/16</span>
						<span className="text-btn-small">Small 12/16</span>
						<span className="text-btn-tiny">Tiny 10/12</span>
					</CardContent>
				</Card>
			</section>

			{/* Brand ramps */}
			<section className="flex flex-col gap-4">
				<h2 className="text-h2">Brand colors</h2>
				<div className="grid gap-6">
					{RAMPS.map((ramp) => (
						<div key={ramp.name} className="flex flex-col gap-2">
							<p className="text-b4">{ramp.name}</p>
							<div className="grid grid-cols-9 gap-1 rounded-lg overflow-hidden">
								{ramp.steps.map((step) => (
									<div
										key={step}
										className={`${ramp.prefix}-${step} flex h-16 items-end justify-center pb-1`}
									>
										<span className="text-c1 text-white/70 mix-blend-difference">
											{step}
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Semantic colors */}
			<section className="flex flex-col gap-4">
				<h2 className="text-h2">Semantic colors (payment states)</h2>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{SEMANTIC_RAMPS.map((ramp) => (
						<div key={ramp.name} className="flex flex-col gap-2">
							<div
								className={`${ramp.prefix}-600 h-16 rounded-lg flex items-center justify-center text-white text-b4`}
							>
								{ramp.name}
							</div>
						</div>
					))}
				</div>
				<div className="flex flex-wrap gap-2">
					<StatusBadge status="pending" />
					<StatusBadge status="processing" />
					<StatusBadge status="completed" />
					<StatusBadge status="failed" />
					<StatusBadge status="cancelled" />
				</div>
			</section>

			{/* Alerts / toasts */}
			<section className="flex flex-col gap-4">
				<h2 className="text-h2">Alerts</h2>
				<p className="text-b3 text-muted-foreground">
					From the Figma &quot;Alert&quot; sheet &mdash; also used for the
					Toaster (click a button below to see it as a toast).
				</p>
				<div className="flex flex-col gap-3 max-w-md">
					<Alert variant="success" onDismiss={() => {}}>
						Callout text
					</Alert>
					<Alert variant="info" onDismiss={() => {}}>
						Callout text
					</Alert>
					<Alert variant="error" onDismiss={() => {}}>
						Callout text
					</Alert>
					<Alert variant="warning" onDismiss={() => {}}>
						Callout text
					</Alert>
				</div>
			</section>

			<Separator />

			{/* Components */}
			<section className="flex flex-col gap-6">
				<h2 className="text-h2">Components</h2>

				<div className="flex flex-wrap items-center gap-3">
					<Button
						variant="primary"
						onClick={() => toast.success("Sent 50 USDC to John")}
					>
						Send money
					</Button>
					<Button
						variant="secondary"
						onClick={() => toast.info("Payment request sent")}
					>
						Request
					</Button>
					<Button
						variant="outline"
						onClick={() => toast.warning("Wallet balance is low")}
					>
						Cancel
					</Button>
					<Button variant="ghost">Ghost</Button>
					<Button
						variant="destructive"
						onClick={() => toast.error("Payment could not be completed")}
					>
						Delete
					</Button>
					<Button variant="link">Learn more</Button>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button size="giant">Giant</Button>
					<Button size="large">Large</Button>
					<Button size="medium">Medium</Button>
					<Button size="small">Small</Button>
					<Button size="tiny">Tiny</Button>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Button loading>Confirming</Button>
					<Button disabled>Disabled</Button>
					<Button variant="outline" disabled>
						Disabled outline
					</Button>
					<Button size="medium" iconOnly aria-label="Icon button">
						+
					</Button>
				</div>

				<Card className="max-w-md">
					<CardHeader>
						<CardTitle>Form fields</CardTitle>
						<CardDescription>
							Default, focused, error, disabled, and password &mdash; from the
							Input sheet.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 pb-6">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="fields-default">Label</Label>
							<Input id="fields-default" placeholder="Placeholder" />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="fields-error">Label</Label>
							<Input
								id="fields-error"
								placeholder="Placeholder"
								aria-invalid
								defaultValue="Placeholder"
							/>
							<HelperText error>Helper text</HelperText>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="fields-disabled">Label</Label>
							<Input id="fields-disabled" placeholder="Placeholder" disabled />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="fields-password">Label</Label>
							<PasswordInput id="fields-password" placeholder="Placeholder" />
						</div>
					</CardContent>
				</Card>

				<Card className="max-w-md">
					<CardHeader>
						<CardTitle>Payment to John</CardTitle>
						<CardDescription>Wallet-to-wallet transfer</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 pb-6">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="amount">Amount</Label>
							<Input id="amount" placeholder="50 USDC" />
						</div>
						<div className="flex items-center justify-between">
							<span className="text-b3 text-muted-foreground">
								Status
							</span>
							<StatusBadge status="completed" />
						</div>
						<div className="flex items-center justify-between">
							<span className="text-b3 text-muted-foreground">
								Transaction ID
							</span>
							<Code>...ABC123</Code>
						</div>
						<Button
							className="w-full"
							onClick={() => toast.success("Payment sent")}
						>
							Confirm &amp; Send
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
