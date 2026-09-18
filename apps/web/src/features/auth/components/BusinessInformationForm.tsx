"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { PhoneInput } from "@repo/ui/phone-input";
import { Stepper } from "@repo/ui/stepper";
import { COUNTRY_NAMES } from "@repo/ui/lib/country-names";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import {
	merchantSetupSchema,
	BUSINESS_CATEGORIES,
	type MerchantSetupValues,
} from "@/lib/validations/authValidations";
import { usePersonalInfoFlowStore } from "@/lib/stores/personalInfoFlowStore";
import { useSignUpFlowStore } from "@/lib/stores/signUpFlowStore";
import { getOnboardingSteps } from "@/features/auth/onboardingSteps";

/**
 * Step 2 of 3 — merchant accounts only (Individual skips straight from
 * Personal Information to Review). Stored locally like Personal
 * Information is, not submitted on its own — the whole onboarding payload
 * goes to the backend together on Review's final confirm, which for a
 * merchant account calls the real `POST /onboarding/merchant` (see
 * `useCompleteSignUp` for why that's a dedicated endpoint, not
 * `/onboarding/individual` + `POST /businesses`).
 *
 * Fields mostly match `OnboardMerchantDto`: a fixed category enum instead
 * of free text, and Country/City/Address split out instead of one
 * "Business Location" field (that used to be a single free-text field with
 * no real backend to match against). Country is a plain display name here
 * (matching that DTO's `businessCountry`), not the ISO code Personal
 * Information's nationality field uses. `phone` is the one field with no
 * home in `OnboardMerchantDto` — see `useCompleteSignUp`'s own note on how
 * it's still saved, via a follow-up `PATCH /businesses/{id}`.
 */
function BusinessInformationForm() {
	const router = useRouter();
	const accountType = useSignUpFlowStore((state) => state.accountType);
	const personalDetails = usePersonalInfoFlowStore((state) => state.personalDetails);
	const stored = usePersonalInfoFlowStore((state) => state.businessInfo);
	const setBusinessInfo = usePersonalInfoFlowStore((state) => state.setBusinessInfo);
	const form = useForm<MerchantSetupValues>({
		resolver: zodResolver(merchantSetupSchema),
		defaultValues: stored ?? {
			businessName: "",
			businessCategory: "" as unknown as MerchantSetupValues["businessCategory"],
			phone: "",
			country: "",
			businessCity: "",
			businessAddress: "",
		},
	});
	const countryNames = useMemo(
		() => Object.values(COUNTRY_NAMES).sort((a, b) => a.localeCompare(b)),
		[],
	);

	// Reached without Personal Information filled in this session — send
	// back rather than let Review show a blank summary.
	useEffect(() => {
		if (!personalDetails) {
			router.replace("/auth/sign-up/personal-details");
		}
	}, [personalDetails, router]);

	if (!personalDetails) return null;

	function onSubmit(values: MerchantSetupValues) {
		setBusinessInfo(values);
		router.push("/auth/sign-up/personal-details/review");
	}

	return (
		<div className="flex flex-col gap-8">
			<Stepper steps={getOnboardingSteps(accountType)} currentStep={2} />

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Your Business Information
				</h1>
				<p className="text-sm sm:text-b1 text-muted-foreground">
					This helps us secure your account and comply with regulations.
				</p>
			</div>

			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-5"
				>
					<FormField
						control={form.control}
						name="businessName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Business Name</FormLabel>
								<FormControl>
									<Input placeholder="Enter business name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="businessCategory"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Business Category</FormLabel>
								<FormControl>
									<Select {...field} value={field.value ?? ""}>
										<option value="" disabled>
											Select a category
										</option>
										{BUSINESS_CATEGORIES.map(({ value, label }) => (
											<option key={value} value={value}>
												{label}
											</option>
										))}
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number</FormLabel>
								<FormControl>
									<PhoneInput
										name={field.name}
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
										placeholder="Enter your phone number"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="country"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Country</FormLabel>
								<FormControl>
									<Select {...field} value={field.value ?? ""}>
										<option value="" disabled>
											Select a country
										</option>
										{countryNames.map((name) => (
											<option key={name} value={name}>
												{name}
											</option>
										))}
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="businessCity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>City</FormLabel>
								<FormControl>
									<Input placeholder="Enter your business city" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="businessAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Address (optional)</FormLabel>
								<FormControl>
									<Input placeholder="Enter your business address" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							size="large"
							className="flex-1"
							onClick={() => router.push("/auth/sign-up/personal-details")}
						>
							Back
						</Button>
						<Button type="submit" size="large" className="flex-1">
							Next
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

export { BusinessInformationForm };
