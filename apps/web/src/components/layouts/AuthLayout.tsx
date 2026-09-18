"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@repo/ui/logo";
import authIllustration from "@repo/ui/assets/illustrations/auth/auth-illustration.webp";
import tellUsAboutYourselfIllustration from "@repo/ui/assets/illustrations/auth/tell-us-about-yourself-illustration.svg";

type AuthHeader =
	| { kind: "switch"; prompt: string; label: string; href: string }
	| { kind: "back" };

const SIGN_IN_SWITCH: AuthHeader = {
	kind: "switch",
	prompt: "Already have an account?",
	label: "Log in",
	href: "/auth/sign-in",
};

/**
 * Per-route chrome for every /auth/* screen: the top-right header content —
 * the "Already have an account?" switch link on most screens, a "Back" link
 * where the user's already mid-flow (a "log in" prompt makes no sense once
 * they're authenticating, e.g. two-factor's code-entry step — the Figma mock
 * showed the switch link there too, but a real logged-in-in-progress user
 * has no use for it) — and which side illustration shows next to the form,
 * or none for Verify's centered layout. Keyed by pathname so individual
 * pages don't each render their own copy of this.
 */
const AUTH_ROUTES: Record<
	string,
	{ header?: AuthHeader; illustration: typeof authIllustration | null }
> = {
	"/auth/sign-up": { header: SIGN_IN_SWITCH, illustration: authIllustration },
	"/auth/sign-in": {
		header: {
			kind: "switch",
			prompt: "Don't have an account?",
			label: "Sign up",
			href: "/auth/sign-up",
		},
		illustration: authIllustration,
	},
	"/auth/sign-up/account-type": {
		header: SIGN_IN_SWITCH,
		illustration: authIllustration,
	},
	"/auth/sign-up/personal-details": {
		header: SIGN_IN_SWITCH,
		illustration: tellUsAboutYourselfIllustration,
	},
	"/auth/sign-up/personal-details/business-information": {
		header: SIGN_IN_SWITCH,
		illustration: tellUsAboutYourselfIllustration,
	},
	"/auth/sign-up/personal-details/review": {
		header: SIGN_IN_SWITCH,
		illustration: tellUsAboutYourselfIllustration,
	},
	"/auth/sign-up/verify-otp": {
		header: { kind: "back" },
		illustration: null,
	},
	"/auth/sign-up/set-pin": {
		illustration: authIllustration,
	},
	"/auth/sign-up/success": {
		header: { kind: "back" },
		illustration: null,
	},
	"/auth/sign-in/two-factor-prompt": {
		illustration: authIllustration,
	},
	"/auth/sign-in/verify": {
		header: { kind: "back" },
		illustration: null,
	},
	"/auth/forgot-password": {
		header: { kind: "back" },
		illustration: authIllustration,
	},
	"/auth/reset-password": {
		header: { kind: "back" },
		illustration: authIllustration,
	},
};

function AuthLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const route = AUTH_ROUTES[pathname];
	const header = route?.header;
	const illustration = route ? route.illustration : authIllustration;

	return (
		<div className="flex min-h-screen flex-col px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8">
			<div className="mx-auto w-full max-w-300 shrink-0 min-[1600px]:max-w-350">
				<div className="flex items-center justify-between gap-4">
					<Logo size="lg" className="shrink-0" />
					{header?.kind === "switch" && (
						<p className="min-w-0 text-right text-b3 text-muted-foreground">
							<span className="max-md:hidden">{header.prompt} </span>
							<Link
								href={header.href}
								className="font-medium text-primary hover:underline"
							>
								{header.label}
							</Link>
						</p>
					)}
					{header?.kind === "back" && (
						<button
							type="button"
							onClick={() => router.back()}
							className="text-b3 text-muted-foreground hover:text-foreground"
						>
							Back
						</button>
					)}
				</div>
			</div>

			{/* Everything below the header fills and centers within whatever
			    vertical space is left — on a short viewport it just sits under
			    the header as before, but on a very tall/large one (the 2xl+
			    case) it no longer reads as a small block pinned to the top with
			    empty space stranded beneath it. */}
			<div className="mx-auto flex w-full max-w-300 flex-1 items-center py-10 min-[1600px]:max-w-350">
				{illustration ? (
					<div className="flex w-full items-center justify-between gap-10 2xl:gap-16">
						<div className="min-w-0 flex-1">
							<div className="max-w-120 max-lg:mx-auto 2xl:max-w-140">
								{children}
							</div>
						</div>
						<div className="hidden shrink-0 lg:block lg:w-80 xl:w-96 2xl:w-120">
							<Image
								src={illustration}
								alt=""
								sizes="(min-width: 1536px) 30rem, (min-width: 1280px) 24rem, 20rem"
								className="h-auto w-full"
							/>
						</div>
					</div>
				) : (
					<div className="mx-auto w-full max-w-120 2xl:max-w-140">
						{children}
					</div>
				)}
			</div>
		</div>
	);
}

export { AuthLayout };
