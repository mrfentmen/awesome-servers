export declare class CrispError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listVisitors(websiteId: string): Promise<string>;
export declare function getProfile(websiteId: string, email: string): Promise<string>;
export declare function getConversation(websiteId: string, sessionId: string): Promise<string>;
export declare function conversations(websiteId: string, page?: string): Promise<string>;
export declare function conversationMessages(websiteId: string, sessionId: string): Promise<string>;
export declare function conversationMeta(websiteId: string, sessionId: string): Promise<string>;
export interface OperatorsArgs {
    website_id: string;
}
/**
 * The agent roster with who is online, who owns the workspace, and who has
 * two-factor enabled. An operator without 2FA is a single stolen password away
 * from reading every conversation on the account.
 */
export declare function listOperators(args: OperatorsArgs): Promise<string>;
export interface InboxesArgs {
    website_id: string;
    page?: number;
}
/** The inbox topology, which is how a conversation reaches the right person in a Crisp workspace with several queues. */
export declare function listInboxes(args: InboxesArgs): Promise<string>;
export interface AudienceArgs {
    website_id: string;
}
/** How big the contact list is and how many visitors are on the site right now, from two cheap aggregate calls. */
export declare function audiencePulse(args: AudienceArgs): Promise<string>;
