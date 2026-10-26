export declare class NylasError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getGrant(): Promise<string>;
export declare function listCalendars(limit?: string): Promise<string>;
export declare function listMessages(limit?: string): Promise<string>;
/** What a Nylas grant can be asked to do, read from the published API document. */
export declare function grantFlowAudit(args: {
    limit?: number;
}): Promise<string>;
/** The shape of the message object Nylas returns, straight from the published schemas. */
export declare function messageObjectAudit(args: {
    limit?: number;
}): Promise<string>;
