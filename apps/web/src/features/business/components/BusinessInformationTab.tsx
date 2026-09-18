"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Skeleton } from "@repo/ui/skeleton";
import { Separator } from "@repo/ui/separator";
import { DateOfBirthInput } from "@repo/ui/date-of-birth-input";
import { COUNTRY_NAMES } from "@repo/ui/lib/country-names";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import { BusinessInformationCard } from "@/features/business/components/BusinessInformationCard";
import { useProfile, useUpdatePersonalDetails } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import {
	personalDetailsSchema,
	type PersonalDetailsValues,
} from "@/lib/validations/authValidations";
import type { ProfileData } from "@/lib/api/types";

// Same list/sort/rationale as `PersonalDetailsForm`'s own — see its note on
// why this isn't `localeCompare`-sorted.
const NATIONALITIES = Object.entries(COUNTRY_NAMES)
	.map(([iso2, name]) => ({ iso2, name }))
	.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

function toFormValues(profile: ProfileData): PersonalDetailsValues {
	return {
		dateOfBirth: profile.dateOfBirth ?? "",
		nationality: profile.nationality ?? "",
		residentialAddress: profile.residentialAddress ?? "",
		city: profile.city ?? "",
	};
}

function DetailsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
		</div>
	);
}

/**
 * Business Information's own onboarding-details section — dateOfBirth/
 * nationality/residentialAddress/city, per the mock's own inclusion of
 * these fields on this tab (they're the merchant's own personal details,
 * not the business's, but the mock places them here rather than under
 * Personal Information — followed as designed). Reuses
 * `POST /onboarding/individual` since it's the *only* endpoint that
 * accepts these fields at all (see `useUpdatePersonalDetails`'s own note —
 * unverified whether a second call is treated as an update).
 */
function PersonalDetailsSection() {
	const { data: profile, isLoading, isError, error } = useProfile();
	const updateDetails = useUpdatePersonalDetails();
	const form = useForm<PersonalDetailsValues>({
		resolver: zodResolver(personalDetailsSchema),
		defaultValues: profile
			? toFormValues(profile)
			: { dateOfBirth: "", nationality: "", residentialAddress: "", city: "" },
	});

	useEffect(() => {
		if (profile) form.reset(toFormValues(profile));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile]);

	if (isLoading) return <DetailsSkeleton />;

	if (isError || !profile) {
		return (
			<p className="text-b3 text-muted-foreground">
				{getApiErrorMessage(error, "Couldn't load your details.")}
			</p>
		);
	}

	function handleCancel() {
		form.reset(toFormValues(profile!));
	}

	function handleSave(values: PersonalDetailsValues) {
		updateDetails.mutate(values, {
			onSuccess: () => toast.success("Details updated"),
			onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't update details")),
		});
	}

	return (
		<Form {...form}>
			<form noValidate onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4">
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
								<Input placeholder="Enter your residential address" {...field} />
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

				<div className="flex gap-3 pt-2">
					<Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
						Cancel
					</Button>
					<Button type="submit" className="flex-1" loading={updateDetails.isPending}>
						Update
					</Button>
				</div>
			</form>
		</Form>
	);
}

/**
 * The Business Information tab — the existing, fully-featured
 * `BusinessInformationCard` (real create/update/delete, status badge, the
 * full business field set) unchanged, plus the onboarding-details section
 * above it isn't part of any existing screen. Both sections update
 * independently (different endpoints, different forms) rather than one
 * combined save.
 */
function BusinessInformationTab() {
	return (
		<div className="flex flex-col gap-6">
			<PersonalDetailsSection />
			<Separator />
			<BusinessInformationCard />
		</div>
	);
}

export { BusinessInformationTab };
