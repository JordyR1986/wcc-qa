/** MailHog polling: delivery is asynchronous, so the API can answer before the email lands. */

/** Upper bound for an email to reach MailHog after the triggering request. */
export const MAILHOG_WAIT_TIMEOUT_MS = 10_000;

/** Back-off between inbox checks; the last value repeats until the timeout. */
export const MAILHOG_POLL_INTERVALS_MS = [100, 250, 500, 1_000];
