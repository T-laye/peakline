"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Stepper } from "@repo/ui/stepper";
import { toast } from "@repo/ui/sonner";
import { COUNTRY_NAMES } from "@repo/ui/lib/country-names";
import { BUSINESS_CATEGORIES } from "@/lib/validations/authValidations";
import { useCompleteSignUp } from "@/features/auth/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { useSignUpFlowStore } from "@/lib/stores/signUpFlowStore";
import { usePersonalInfoFlowStore } from "@/lib/stores/personalInfoFlowStore";
import { getOnboardingSteps } from "@/features/auth/onboardingSteps";

function SummarySection({
	title,
	editHref,
	rows,
}: {
	title: string;
	editHref: string;
	rows: { label: string; value: string }[];
}) {
	const router = useRouter();
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border p-5">
			<div className="flex items-center justify-between">
				<h2 className="text-b2 text-foreground">{title}</h2>
				<button
					type="button"
					onClick={() => router.push(editHref)}
					className="text-b4 font-medium text-primary hover:underline"
				>
					Edit
				</button>
			</div>
			<dl className="flex flex-col gap-2">
				{rows.map(({ label, value }) => (
					<div key={label} className="flex items-baseline justify-between gap-4">
						<dt className="text-b3 text-muted-foreground">{label}</dt>
						<dd className="truncate text-b3 font-medium text-foreground">
							{value || "—"}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

/**
 * Last onboarding step — a read-only cross-check of everything collected
 * across Sign Up, Personal Information, and (merchant only) Business
 * Information before the account is actually created. Confirming here is
 * what "logs the user in" per the brief; PIN setup (and the wallet it
 * triggers) comes right after. No more ID Verification section — that step
 * was dropped from onboarding entirely.
 */
function ReviewForm() {
	const router = useRouter();
	const accountType = useSignUpFlowStore((state) => state.accountType);
	const firstName = useSignUpFlowStore((state) => state.firstName);
	const lastName = useSignUpFlowStore((state) => state.lastName);
	const otherName = useSignUpFlowStore((state) => state.otherName);
	const email = useSignUpFlowStore((state) => state.email);
	const phone = useSignUpFlowStore((state) => state.phone);
	const personalDetails = usePersonalInfoFlowStore((state) => state.personalDetails);
	const businessInfo = usePersonalInfoFlowStore((state) => state.businessInfo);
	const completeSignUp = useCompleteSignUp();
	const isMerchant = accountType === "merchant";
	const steps = getOnboardingSteps(accountType);
	const backHref = isMerchant
		? "/auth/sign-up/personal-details/business-information"
		: "/auth/sign-up/personal-details";

	useEffect(() => {
		if (!personalDetails || (isMerchant && !businessInfo)) {
			router.replace(backHref);
		}
	}, [personalDetails, businessInfo, isMerchant, backHref, router]);

	if (!personalDetails || (isMerchant && !businessInfo)) return null;

	function handleConfirm() {
		completeSignUp.mutate(
			{ ...personalDetails!, ...(businessInfo ?? {}) },
			{
				onSuccess: () => {
					toast.success("Account verified");
					router.push("/auth/sign-up/set-pin");
				},
				onError: (error) => {
					toast.error(getApiErrorMessage(error, "Couldn't save your details"));
				},
			},
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<Stepper steps={steps} currentStep={steps.length} />

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Review Your Details
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					Please confirm all your information is correct.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<SummarySection
					title="Personal information"
					editHref="/auth/sign-up/personal-details"
					rows={[
						{ label: "First Name", value: firstName },
						{ label: "Last Name", value: lastName },
						{ label: "Other Name", value: otherName },
						{ label: "Email", value: email },
						{ label: "Phone", value: phone },
						{ label: "Date of birth", value: personalDetails.dateOfBirth },
						{
							label: "Nationality",
							// Stored as an ISO 3166-1 alpha-2 code (what the API wants),
							// not a display name — map back for a readable summary.
							value:
								COUNTRY_NAMES[personalDetails.nationality] ??
								personalDetails.nationality,
						},
						{
							label: "Residential address",
							value: personalDetails.residentialAddress,
						},
						{ label: "City", value: personalDetails.city },
					]}
				/>

				{isMerchant && businessInfo && (
					<SummarySection
						title="Business information"
						editHref="/auth/sign-up/personal-details/business-information"
						rows={[
							{ label: "Business name", value: businessInfo.businessName },
							{
								label: "Business category",
								value:
									BUSINESS_CATEGORIES.find((c) => c.value === businessInfo.businessCategory)
										?.label ?? businessInfo.businessCategory,
							},
							{ label: "Phone", value: businessInfo.phone },
							{ label: "Country", value: businessInfo.country },
							{ label: "City", value: businessInfo.businessCity },
							{ label: "Address", value: businessInfo.businessAddress ?? "" },
						]}
					/>
				)}
			</div>

			<div className="flex gap-3">
				<Button
					type="button"
					variant="outline"
					size="large"
					className="flex-1"
					onClick={() => router.push(backHref)}
				>
					Back
				</Button>
				<Button
					type="button"
					size="large"
					className="flex-1"
					loading={completeSignUp.isPending}
					onClick={handleConfirm}
				>
					Confirm & Continue
				</Button>
			</div>
		</div>
	);
}

export { ReviewForm };
