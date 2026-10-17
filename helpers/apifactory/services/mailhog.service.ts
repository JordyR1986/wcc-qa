import { APIResponse, expect } from "@playwright/test";
import { ensureSuccess as assertSuccess, TypedAPIResponse } from "../api.helper";
import { MailHogClient } from "../clients/mailhog.client";
import { MAILHOG_POLL_INTERVALS_MS, MAILHOG_WAIT_TIMEOUT_MS } from "helpers/datafactory/constants/mailhog.data";
import { MailHogMessage, MailHogMessages, mailHogMessagesSchema } from "helpers/datafactory/schemas/mailhog.schema";

export class MailHogService {
	constructor(private readonly client: MailHogClient) {}

	async getMessages(ensureSuccess = false): Promise<TypedAPIResponse<MailHogMessages>> {
		const response = await this.client.getMessages();
		if (ensureSuccess) assertSuccess(response);
		return response;
	}

	/** MailHog matches any recipient *containing* `email`, case-insensitively — see {@link messagesTo} for exact matches. */
	async searchByRecipient(email: string, ensureSuccess = false): Promise<TypedAPIResponse<MailHogMessages>> {
		const response = await this.client.searchByRecipient(email);
		if (ensureSuccess) assertSuccess(response);
		return response;
	}

	async deleteMessage(id: string, ensureSuccess = false): Promise<APIResponse> {
		const response = await this.client.deleteMessage(id);
		if (ensureSuccess) assertSuccess(response);
		return response;
	}

	async deleteAllMessages(ensureSuccess = false): Promise<APIResponse> {
		const response = await this.client.deleteAllMessages();
		if (ensureSuccess) assertSuccess(response);
		return response;
	}

	/** Messages whose SMTP envelope includes exactly `email` (BCC recipients included). */
	async messagesTo(email: string): Promise<MailHogMessage[]> {
		const response = await this.searchByRecipient(email, true);
		const { items } = mailHogMessagesSchema.parse(await response.json());
		const recipient = email.toLowerCase();
		return items.filter(message => message.Raw.To.some(to => to.toLowerCase() === recipient));
	}

	/**
	 * Polls until at least one email to `email` has arrived, then returns all of them.
	 * Returns as soon as one lands; fails after {@link MAILHOG_WAIT_TIMEOUT_MS}. The caller
	 * asserts how many it expects — a duplicate send is a finding, not a timeout.
	 */
	async waitForMessagesTo(email: string): Promise<MailHogMessage[]> {
		let messages: MailHogMessage[] = [];
		await expect
			.poll(
				async () => {
					messages = await this.messagesTo(email);
					return messages.length;
				},
				{
					message: `No email delivered to ${email} within ${MAILHOG_WAIT_TIMEOUT_MS}ms`,
					timeout: MAILHOG_WAIT_TIMEOUT_MS,
					intervals: MAILHOG_POLL_INTERVALS_MS,
				}
			)
			.toBeGreaterThan(0);
		return messages;
	}

	/** Cleanup: deletes every message delivered to `email`, leaving other tests' mail alone. */
	async deleteMessagesTo(email: string): Promise<void> {
		const messages = await this.messagesTo(email);
		for (const { ID } of messages) {
			await this.deleteMessage(ID, true);
		}
	}
}
