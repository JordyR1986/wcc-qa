import { APIRequestContext, APIResponse } from "@playwright/test";
import { MailHogEndpoints } from "helpers/datafactory/constants/paths.data";

/** Expects a context with `baseURL` = MAILHOG_HOST. MailHog needs no auth headers. */
export class MailHogClient {
	constructor(private readonly request: APIRequestContext) {}

	getMessages(): Promise<APIResponse> {
		return this.request.get(MailHogEndpoints.MESSAGES);
	}

	/** `kind=to` matches SMTP envelope recipients, so it also finds BCC recipients. */
	searchByRecipient(email: string): Promise<APIResponse> {
		return this.request.get(MailHogEndpoints.SEARCH, {
			params: { kind: "to", query: email },
		});
	}

	deleteMessage(id: string): Promise<APIResponse> {
		return this.request.delete(`${MailHogEndpoints.DELETE_MESSAGES}/${encodeURIComponent(id)}`);
	}

	deleteAllMessages(): Promise<APIResponse> {
		return this.request.delete(MailHogEndpoints.DELETE_MESSAGES);
	}
}
