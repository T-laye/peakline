"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { DateOfBirthInput } from "@repo/ui/date-of-birth-input";
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
	personalDetailsSchema,
	type PersonalDetailsValues,
} from "@/lib/validations/authValidations";
import { usePersonalInfoFlowStore } from "@/lib/stores/personalInfoFlowStore";
import { useSignUpFlowStore } from "@/lib/stores/signUpFlowStore";
import { getOnboardingSteps } from "@/features/auth/onboardingSteps";

// Same country list the phone country picker uses — a "Nationality" picker
// asking for a country of origin, not a linguistically-correct demonym
// (there's no reliable "Ghana" -> "Ghanaian" rule that covers all 245
// entries), matching how most sign-up forms handle this field. Value is the
// ISO 3166-1 alpha-2 code, not the display name — `POST /onboarding/individual`
// wants "GH", not "Ghana" (confirmed against the real API). Plain
// lexicographic sort by name, not `localeCompare` — see phone-input.tsx's
// own note on why: collation can differ between Node's SSR pass and the
// browser's, which would reorder (and mismatch) this list between them.
const NATIONALITIES = Object.entries(COUNTRY_NAMES)
	.map(([iso2, name]) => ({ iso2, name }))
	.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/**
 * Step 1 (Personal Information) of onboarding — first of 2 steps for an
 * Individual account, or 3 for Merchant (Business Information comes next).
 */
function PersonalDetailsForm() {
	const router = useRouter();
	const accountType = useSignUpFlowStore((state) => state.accountType);
	const stored = usePersonalInfoFlowStore((state) => state.personalDetails);
	const setPersonalDetails = usePersonalInfoFlowStore(
		(state) => state.setPersonalDetails,
	);
	const form = useForm<PersonalDetailsValues>({
		resolver: zodResolver(personalDetailsSchema),
		defaultValues: stored ?? {
			dateOfBirth: "",
			nationality: "",
			residentialAddress: "",
			city: "",
		},
	});

	function onSubmit(values: PersonalDetailsValues) {
		setPersonalDetails(values);
		router.push(
			accountType === "merchant"
				? "/auth/sign-up/personal-details/business-information"
				: "/auth/sign-up/personal-details/review",
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<Stepper steps={getOnboardingSteps(accountType)} currentStep={1} />

			<div className="flex flex-col gap-2">
				<h1 className="text-h4 sm:text-h3 text-foreground">
					Tell Us About Yourself
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
						name="dateOfBirth"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date of Birth</FormLabel>
								<FormControl>
									<DateOfBirthInput
										name={field.name}
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="nationality"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nationality</FormLabel>
								<FormControl>
									<Select {...field} value={field.value ?? ""}>
										<option value="" disabled>
											Select Nationality
										</option>
										{NATIONALITIES.map(({ iso2, name }) => (
											<option key={iso2} value={iso2}>
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
						name="residentialAddress"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Residential Address</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter your residential address"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>City</FormLabel>
								<FormControl>
									<Input placeholder="Enter your city" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button type="submit" size="large" className="w-full">
						Next
					</Button>
				</form>
			</Form>
		</div>
	);
}

export { PersonalDetailsForm };
