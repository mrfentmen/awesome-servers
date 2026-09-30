/**
 * Returns null when the caller may run the tool, or a short message telling
 * them how to get a key.
 *
 * A good key is remembered for an hour, so a busy session does not hit the
 * license server on every call and keeps working through a brief outage.
 */
export declare function premiumRequired(tool: string): Promise<string | null>;
