"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Badge } from "@repo/ui/badge";
import { Skeleton } from "@repo/ui/skeleton";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/sonner";
import { COUNTRY_NAMES } from "@repo/ui/lib/country-names";
import { BUSINESS_CATEGORIES } from "@/lib/validations/authValidations";
import {
	updateBusinessSchema,
	type UpdateBusinessValues,
} from "@/lib/validations/businessValidations";
import {
	useMyBusiness,
	useCreateBusiness,
	useUpdateBusiness,
} from "@/features/business/hooks";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import { DeleteBusinessDialog } from "@/features/business/components/DeleteBusinessDialog";
import type { BusinessData } from "@/lib/api/types";

const CATEGORY_LABEL = Object.fromEntries(BUSINESS_CATEGORIES.map((c) => [c.value, c.label]));

const EMPTY_VALUES: UpdateBusinessValues = {
	name: "",
	category: "" as unknown as UpdateBusinessValues["category"],
	country: "",
	city: "",
	address: "",
	phone: "",
	website: "",
	description: "",
	registrationNumber: "",
	taxId: "",
};

// The real values this can hold aren't documented (BusinessDto just says
// `"type": "object"` for `status`) — a neutral badge by default, colored
// for the two values the admin verify/suspend endpoints imply must exist,
// so an unexpected value still renders sensibly instead of breaking.
const STATUS_BADGE: Record<string, "completed" | "failed" | "outline"> = {
	active: "completed",
	verified: "completed",
	suspended: "failed",
};

function toFormValues(business: BusinessData): UpdateBusinessValues {
	return {
		name: business.name,
		category: business.category,
		country: business.country,
		city: business.city ?? "",
		address: business.address ?? "",
		phone: business.phone ?? "",
		website: business.website ?? "",
		description: business.description ?? "",
		registrationNumber: business.registrationNumber ?? "",
		taxId: business.taxId ?? "",
	};
}

function CardSkeleton() {
	return (
		<div className="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6">
			<Skeleton className="h-6 w-40" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
		</div>
	);
}

/**
 * Business Information's own real end-to-end CRUD
 * (`GET/POST/PATCH/DELETE /businesses`), unlike `PersonalInformationTab`'s
 * always-editable Cancel/Update shape — this keeps its own inline-edit
 * toggle (read-only inputs until "Edit", Cancel/Save vs Edit/Delete) since
 * no mock ever specified this screen directly (see
 * `BusinessInformationTab`, which now hosts this inside the Account page's
 * own Business Information tab). A fuller field set than onboarding's own
 * form collects (website/description/
 * registration number/tax ID are only editable from here).
 *
 * Doubles as the *only* place to add a business outside of sign-up now —
 * onboarding's Business Information step was previously the one and only
 * way to create one, with no way to add one afterward if that step was
 * skipped or the business later deleted (reported live: "where can i add
 * businesses?"). When `useMyBusiness` resolves to no business yet, the same
 * fields render as a create form instead of a dead-end "you don't have
 * one" message.
 */
function BusinessInformationCard() {
	const { data: business, isLoading, isError, error } = useMyBusiness();
	const [isEditing, setIsEditing] = useState(false);
	const createBusiness = useCreateBusiness();
	const updateBusiness = useUpdateBusiness(business?.id ?? "");
	const form = useForm<UpdateBusinessValues>({
		resolver: zodResolver(updateBusinessSchema),
		defaultValues: business ? toFormValues(business) : EMPTY_VALUES,
	});

	// Reset the form once the real business loads (or changes) — the form
	// initializes before the query resolves, so its first real values arrive
	// via this effect rather than `defaultValues`.
	useEffect(() => {
		if (business) form.reset(toFormValues(business));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [business]);

	if (isLoading) return <CardSkeleton />;

	// A real fetch failure is worth saying so, distinctly from "no business
	// yet" — the latter now gets a real create form below instead of a
	// dead-end message (this used to return `null` for both, which looked
	// identical to the section not existing at all).
	if (isError) {
		return (
			<div className="flex flex-col gap-2 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6">
				<h2 className="text-s1 text-foreground">Business Information</h2>
				<p className="text-b3 text-muted-foreground">
					{getApiErrorMessage(error, "Couldn't load your business information.")}
				</p>
			</div>
		);
	}

	// Fields are always editable while there's no business yet to view —
	// there's nothing to show read-only, so this skips straight to "fill
	// this in" rather than an Edit button that would just reveal an empty
	// form anyway.
	const fieldsEditable = !business || isEditing;
	const statusVariant = business ? (STATUS_BADGE[business.status.toLowerCase()] ?? "outline") : null;

	function handleCancel() {
		form.reset(business ? toFormValues(business) : EMPTY_VALUES);
		setIsEditing(false);
	}

	function handleSubmit(values: UpdateBusinessValues) {
		if (business) {
			updateBusiness.mutate(values, {
				onSuccess: () => {
					toast.success("Business updated");
					setIsEditing(false);
				},
				onError: (error) => {
					toast.error(getApiErrorMessage(error, "Couldn't update business"));
				},
			});
		} else {
			createBusiness.mutate(values, {
				onSuccess: () => toast.success("Business added"),
				onError: (error) => {
					toast.error(getApiErrorMessage(error, "Couldn't add business"));
				},
			});
		}
	}

	return (
		<Form {...form}>
			<form
				noValidate
				onSubmit={form.handleSubmit(handleSubmit)}
				className="flex flex-col gap-6 lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:p-6"
			>
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-s1 text-foreground">Business Information</h2>
					{statusVariant && (
						<Badge variant={statusVariant} className="capitalize">
							{business!.status}
						</Badge>
					)}
				</div>

				{!business && (
					<p className="text-b3 text-muted-foreground">
						Add your business details to start accepting payments as a registered
						business.
					</p>
				)}

				<div className="flex flex-col gap-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Business Name</FormLabel>
								<FormControl>
									<Input readOnly={!fieldsEditable} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="category"
						render={({ field }) =>
							fieldsEditable ? (
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
							) : (
								<FormItem>
									<FormLabel>Business Category</FormLabel>
									<FormControl>
										<Input readOnly value={CATEGORY_LABEL[field.value] ?? field.value} />
									</FormControl>
								</FormItem>
							)
						}
					/>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="country"
							render={({ field }) =>
								fieldsEditable ? (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Select {...field} value={field.value ?? ""}>
												<option value="" disabled>
													Select a country
												</option>
												{Object.values(COUNTRY_NAMES)
													.sort((a, b) => a.localeCompare(b))
													.map((name) => (
														<option key={name} value={name}>
															{name}
														</option>
													))}
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								) : (
									<FormItem>
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input readOnly value={field.value} />
										</FormControl>
									</FormItem>
								)
							}
						/>

						<FormField
							control={form.control}
							name="city"
							render={({ field }) => (
								<FormItem>
									<FormLabel>City</FormLabel>
									<FormControl>
										<Input readOnly={!fieldsEditable} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Address</FormLabel>
								<FormControl>
									<Input readOnly={!fieldsEditable} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone</FormLabel>
									<FormControl>
										<Input readOnly={!fieldsEditable} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="website"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Website</FormLabel>
									<FormControl>
										<Input
											readOnly={!fieldsEditable}
											placeholder="https://"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Input readOnly={!fieldsEditable} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="registrationNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Registration Number</FormLabel>
									<FormControl>
										<Input readOnly={!fieldsEditable} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="taxId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tax ID</FormLabel>
									<FormControl>
										<Input readOnly={!fieldsEditable} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex gap-3 pt-2">
						{!business ? (
							<Button type="submit" className="w-full" loading={createBusiness.isPending}>
								Add Business
							</Button>
						) : isEditing ? (
							<>
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={handleCancel}
								>
									Cancel
								</Button>
								<Button type="submit" className="flex-1" loading={updateBusiness.isPending}>
									Save
								</Button>
							</>
						) : (
							<>
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => setIsEditing(true)}
								>
									Edit
								</Button>
								<DeleteBusinessDialog
									businessId={business.id}
									businessName={business.name}
									onDeleted={() => setIsEditing(false)}
								>
									<Button type="button" variant="destructive" className="flex-1">
										Delete
									</Button>
								</DeleteBusinessDialog>
							</>
						)}
					</div>
				</div>
			</form>
		</Form>
	);
}

export { BusinessInformationCard };
