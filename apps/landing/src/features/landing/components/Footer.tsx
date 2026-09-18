"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Logo } from "@repo/ui/logo";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import { subscribeSchema, type SubscribeValues } from "@/lib/validations/landingValidations";
import { useSubscribe } from "@/features/landing/hooks";

const QUICK_LINKS = ["Home", "About", "Services", "Contact"];
const COMPANY_LINKS = ["Privacy Policy", "Support", "Terms of Service"];
const SOCIALS = [
	{ label: "Facebook", icon: Facebook },
	{ label: "Twitter", icon: Twitter },
	{ label: "Instagram", icon: Instagram },
	{ label: "Youtube", icon: Youtube },
];

function Footer() {
	const form = useForm<SubscribeValues>({
		resolver: zodResolver(subscribeSchema),
		defaultValues: { email: "" },
	});
	const subscribe = useSubscribe();

	function onSubmit(values: SubscribeValues) {
		subscribe.mutate(values, {
			onSuccess: () => {
				toast.success("You're subscribed!");
				form.reset();
			},
		});
	}

	return (
		<footer className="bg-neutral-50 pt-16 pb-10">
			<div className="custom-container flex flex-col gap-10">
				<div className="flex flex-col gap-10 border-b border-neutral-900/10 pb-12 lg:flex-row lg:justify-between">
					<div className="flex max-w-md flex-col items-start gap-8">
						{/* items-start matters here, not just tidiness: this column's
						 * default `align-items: stretch` can't actually stretch the
						 * logo <img>'s width without breaking its aspect ratio (it
						 * has a fixed height), so browsers fall back to centering it
						 * instead — silently misaligning it from every text sibling
						 * below, which stayed left-aligned because block text has no
						 * such conflict. */}
						{/* Figma's footer logo export is its own asset at 141×47 —
						 * noticeably bigger than @repo/ui/logo's "md" preset (28px),
						 * same story as the navbar logo fix (Navbar.tsx). */}
						<Logo className="h-10 sm:h-12" />
						<div className="flex flex-col gap-3">
							<p className="text-s2 text-foreground">Subscribe</p>
							<p className="text-b3 text-neutral-600">
								Join our newsletter to stay up to date on features and releases.
							</p>
						</div>

						<Form {...form}>
							<form
								noValidate
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-3"
							>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<div className="flex items-center gap-3 rounded-full bg-background p-2 pl-3">
												<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-100">
													<Mail className="size-4 text-neutral-500" aria-hidden="true" />
												</span>
												<FormControl>
													<Input
														type="email"
														autoComplete="email"
														placeholder="Enter your email"
														className="h-auto flex-1 border-none bg-transparent p-0 shadow-none focus-visible:border-none"
														{...field}
													/>
												</FormControl>
												<Button
													type="submit"
													variant="primary"
													size="medium"
													className="rounded-full bg-neutral-900 hover:bg-neutral-800"
													loading={subscribe.isPending}
												>
													Subscribe
												</Button>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<p className="text-c1 text-neutral-500">
									By subscribing you agree to with our{" "}
									<Link href="#" className="font-medium underline">
										Privacy Policy
									</Link>
								</p>
							</form>
						</Form>
					</div>

					<div className="flex gap-10 sm:gap-16 lg:gap-32">
						<div className="flex flex-col gap-4">
							<p className="text-btn-large text-foreground">Quick Links</p>
							{QUICK_LINKS.map((link) => (
								<Link key={link} href="#" className="text-b3 text-neutral-600">
									{link}
								</Link>
							))}
						</div>
						<div className="flex flex-col gap-4">
							<p className="text-btn-large text-foreground">Company</p>
							{COMPANY_LINKS.map((link) => (
								<Link key={link} href="#" className="text-b3 text-neutral-600">
									{link}
								</Link>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-col-reverse items-center gap-6 sm:flex-row sm:justify-between">
					<p className="text-b3 text-neutral-600">
						Copyright © {new Date().getFullYear()} Peakline. All Rights Reserved
					</p>
					<div className="flex items-center gap-4">
						{SOCIALS.map(({ label, icon: Icon }) => (
							<Link
								key={label}
								href="#"
								aria-label={label}
								className="flex size-10 items-center justify-center rounded-full bg-background transition-colors hover:bg-neutral-100"
							>
								<Icon className="size-4 text-neutral-600" aria-hidden="true" />
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}

export { Footer };
