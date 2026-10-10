export declare class PlainError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listCustomers(limit?: string): Promise<string>;
export declare function listThreads(limit?: string): Promise<string>;
export declare function getThread(threadId: string): Promise<string>;
/**
 * Whether mail to an address can actually be delivered: the domain's MX
 * records, its SPF and DMARC policy, and whether it publishes a null MX that
 * refuses all mail. Every support reply depends on this.
 */
export declare function emailDeliverability(args: {
    email: string;
}): Promise<string>;
/**
 * First-response times for a batch of support threads, measured against a target,
 * so an SLA can be checked without pulling the whole thread list out of Plain.
 */
export declare function responseTimeReport(args: {
    target_hours: number;
    samples: Array<{
        label?: string;
        created_at: string;
        first_reply_at: string;
    }>;
}): Promise<string>;
