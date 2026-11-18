"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { toast } from "@repo/ui/sonner";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@repo/ui/form";
import {
	NEW_CUSTOMER,
	createPaymentRequestSchema,
	type CreatePaymentRequestValues,
} from "@/lib/validations/paymentRequestsValidations";
import {
	useCreatePaymentRequest,
	usePaymentRequestCustomers,
} from "@/features/payment-requests/hooks";
import { formatUsdc, usdcToGhs } from "@/lib/currency";
import { getApiErrorMessage } from "@/lib/api/errorMessage";
import type { CustomerCollectionData, PaymentLinkData } from "@/lib/api/types";

const customerKey = (c: CustomerCollectionData) => c.customerEmail ?? c.customerName ?? "";

interface CreatePaymentRequestFormProps {
	onCreated: (request: PaymentLinkData) => void;
}

/**
 * Per the c2 mock: customer selection (customers you've requested from
 * before, via `GET /merchant/reports/customers`, or "New customer"), name +
 * email, a title (required by the API, absent from the mock), amount, then
 * optional description / due date / customer reference. Sending customer
 * fields is what makes the API create a single-use request. The mock's
 * selection field shows a calendar icon — treated as a mock slip.
 */
function CreatePaymentRequestForm({ onCreated }: CreatePaymentRequestFormProps) {
	const { data: customers = [] } = usePaymentRequestCustomers();
	const createRequest = useCreatePaymentRequest();
	const form = useForm<CreatePaymentRequestValues>({
		resolver: zodResolver(createPaymentRequestSchema),
		defaultValues: {
			customerId: "",
			customerName: "",
			customerEmail: "",
			title: "",
			amount: "" as unknown as number,
			description: "",
			dueDate: "",
			reference: "",
		},
	});
	const customerId = useWatch({ control: form.control, name: "customerId" });
	const isExistingCustomer = !!customerId && customerId !== NEW_CUSTOMER;
	const amount = Number(useWatch({ control: form.control, name: "amount" }));
	const amountValid = amount > 0 && !form.formState.errors.amount;

	function handleCustomerChange(id: string) {
		form.setValue("customerId", id, { shouldValidate: form.formState.isSubmitted });
		const customer = customers.find((c) => customerKey(c) === id);
		form.setValue("customerName", customer?.customerName ?? "");
		form.setValue("customerEmail", customer?.customerEmail ?? "");
		if (form.formState.isSubmitted) void form.trigger(["customerName", "customerEmail"]);
	}

	function handleSubmit(values: CreatePaymentRequestValues) {
		createRequest.mutate(values, {
			onSuccess: (request) => {
				toast.success(`Payment request ${request.reference} created`);
				onCreated(request);
			},
			onError: (error) =>
				toast.error(getApiErrorMessage(error, "Couldn't create payment request")),
		});
	}

	return (
		<Form {...form}>
			<form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
				<FormField
					control={form.control}
					name="customerId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer selection</FormLabel>
							<FormControl>
								<Select
									name={field.name}
									ref={field.ref}
									value={field.value}
									onBlur={field.onBlur}
									onChange={(e) => handleCustomerChange(e.target.value)}
								>
									<option value="" disabled>
										Select customer
									</option>
									{customers.map((customer) => (
										<option key={customerKey(customer)} value={customerKey(customer)}>
											{customer.customerName ?? customer.customerEmail}
											{customer.customerName && customer.customerEmail ? ` (${customer.customerEmail})` : ""}
										</option>
									))}
									<option value={NEW_CUSTOMER}>+ New customer</option>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="customerName"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer name</FormLabel>
							<FormControl>
								<Input placeholder="Enter name" disabled={isExistingCustomer} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="customerEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer email</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="Enter email"
									disabled={isExistingCustomer}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Request title</FormLabel>
							<FormControl>
								<Input placeholder="e.g. Custom order" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Requested Amount</FormLabel>
							<div className="flex gap-3">
								<FormControl>
									<Input
										type="number"
										inputMode="decimal"
										min={0}
										step="any"
										placeholder="0"
										{...field}
									/>
								</FormControl>
								<div className="flex h-11 w-24 shrink-0 items-center justify-center rounded-lg border border-input bg-muted text-b1 text-foreground">
									USDC
								</div>
							</div>
							{amountValid && (
								<p className="text-c1 text-muted-foreground">
									~ GHS {formatUsdc(usdcToGhs(amount))}
								</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Payment Description (optional)</FormLabel>
							<FormControl>
								<Input placeholder="Add note" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="dueDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Due/Expiration Date (optional)</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="reference"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Customer reference (optional)</FormLabel>
							<FormControl>
								<Input placeholder="e.g INV-001" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" size="large" className="w-full" loading={createRequest.isPending}>
					Create Request
				</Button>
			</form>
		</Form>
	);
}

export { CreatePaymentRequestForm };
