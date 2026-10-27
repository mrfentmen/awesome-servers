export declare class NovuError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listSubscribers(limit?: string): Promise<string>;
export declare function getSubscriber(subscriberId: string): Promise<string>;
export declare function listTopics(): Promise<string>;
export declare function topicDetails(topicKey: string): Promise<string>;
export declare function notifications(limit?: string): Promise<string>;
export declare function environments(): Promise<string>;
export declare function integrations(): Promise<string>;
export declare function layouts(): Promise<string>;
export declare function feeds(): Promise<string>;
export declare function blueprintGroups(): Promise<string>;
/** Audit Novu's own published OpenAPI document, the way a builder reads it. */
export declare function notificationApiAudit(args: {
    limit?: number;
    filter?: string;
}): Promise<string>;
/** How current and how used one of Novu's published SDK packages is. */
export declare function novuSdkReleaseCheck(args: {
    package: string;
    limit?: number;
}): Promise<string>;
