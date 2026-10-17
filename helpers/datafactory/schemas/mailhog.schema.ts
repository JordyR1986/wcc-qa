import { z } from "zod";

/**
 * Header values are arrays because a header may repeat. `From` and `Subject` are
 * always set by the backend; any other header is kept as `string[]`.
 */
export const mailHogHeadersSchema = z
	.object({
		From: z.array(z.string()).min(1),
		Subject: z.array(z.string()).min(1),
	})
	.catchall(z.array(z.string()));

/**
 * One stored message — only the fields tests use. Recipients come from the SMTP
 * envelope (`Raw.To`): the backend sends as BCC, so there is no `To` header.
 */
export const mailHogMessageSchema = z.object({
	ID: z.string().min(1),
	Created: z.iso.datetime(),
	Content: z.object({
		Headers: mailHogHeadersSchema,
		Body: z.string(),
	}),
	Raw: z.object({
		From: z.string(),
		To: z.array(z.string()).min(1),
	}),
});

export type MailHogMessage = z.infer<typeof mailHogMessageSchema>;

/** Shape returned by `GET /api/v2/messages` and `GET /api/v2/search`. */
export const mailHogMessagesSchema = z.object({
	total: z.number().int().nonnegative(),
	count: z.number().int().nonnegative(),
	start: z.number().int().nonnegative(),
	items: z.array(mailHogMessageSchema),
});

export type MailHogMessages = z.infer<typeof mailHogMessagesSchema>;
