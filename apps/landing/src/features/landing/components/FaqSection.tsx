import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@repo/ui/accordion";

const FAQS = [
	{
		question: "Can I use the service for business transactions?",
		answer:
			"Yes, our platform supports both personal and business transactions. Businesses can benefit from our secure and efficient transfer options tailored to their needs.",
	},
	{
		question: "What is the maximum amount I can transfer?",
		answer:
			"Transfer limits depend on your account's verification level. Complete verification to unlock higher limits.",
	},
	{
		question: "How do I update my account information?",
		answer:
			"Go to your profile settings from the dashboard to update your personal information at any time.",
	},
	{
		question: "Are there any benefits for frequent users?",
		answer:
			"Frequent users enjoy priority support and access to features as they roll out.",
	},
	{
		question: "Can I access my account from multiple devices?",
		answer:
			"Yes, your account works seamlessly across any device you sign in from.",
	},
];

/** Figma "FAQ'S" (#418:5251). Only the first question's answer was visible
 * in the fetched frame (Figma renders the rest collapsed with no content) —
 * the remaining four answers are reasonable placeholders pending real copy. */
function FaqSection() {
	return (
		<section className="custom-container flex flex-col gap-10 lg:flex-row lg:justify-between">
			<div className="flex max-w-md flex-col gap-10">
				<h2 className="text-h3 text-foreground sm:text-[3rem]">
					Frequently Asked Questions
				</h2>
				<div className="flex flex-col gap-2">
					<p className="text-s2 text-neutral-600">Ask any questions</p>
					<p className="text-h5 text-primary-500">peakline@info.com</p>
				</div>
			</div>

			<Accordion type="single" collapsible className="w-full max-w-2xl border-t border-border">
				{FAQS.map((faq) => (
					<AccordionItem key={faq.question} value={faq.question}>
						<AccordionTrigger>{faq.question}</AccordionTrigger>
						<AccordionContent>{faq.answer}</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	);
}

export { FaqSection };
